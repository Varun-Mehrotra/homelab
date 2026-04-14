from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta

from osrs_flip_recommender.main import (
    Evaluation,
    ItemMapping,
    TORONTO_TZ,
    WikiClient,
    assess_item,
    compute_fill_rate,
    compute_sell_reach,
    evaluate_candidates,
    format_message,
    ge_tax,
    parse_timeseries_rows,
    recommend,
    trade_quantity,
)


def test_config(**overrides):
    values = {
        "user_agent": "test-agent",
        "ntfy_base_url": "https://ntfy.example.test",
        "ntfy_topic": "osrs-flips",
        "ntfy_token": "token",
        "top_n": 12,
        "min_daily_volume": 1_000_000,
        "ge_slot_budget_gp": 8_000_000,
        "buy_limit_multiplier": 3,
        "candidate_limit": 80,
        "buy_window_hours": 1,
        "sell_window_hours": 1,
        "buy_profile_days": 14,
        "sell_profile_days": 14,
        "buy_fill_min": 0.55,
        "sell_reach_min": 0.65,
        "min_edge_gp": 50,
        "min_edge_pct": 0.01,
        "min_liq_sell": 0.50,
        "min_stability_score": 0.45,
        "max_buy_share": 0.003,
        "stale_max_minutes": 120,
        "max_missing_ratio": 0.20,
        "q_buy_start": 0.15,
        "q_buy_step": 0.05,
        "q_buy_max": 0.35,
        "q_sell_start": 0.55,
        "q_sell_step": 0.05,
        "q_sell_min": 0.35,
        "tax_rate": 0.02,
        "fill_weight": 0.50,
        "jump_threshold_pct": 0.03,
        "volatility_scale_pct": 1.50,
        "drift_scale_pct": 5.00,
        "jump_rate_scale": 0.15,
        "weight_roi": 0.35,
        "weight_profit": 0.25,
        "weight_liq_sell": 0.20,
        "weight_stability": 0.20,
        "weight_jump_penalty": 0.15,
        "weight_buy_share_penalty": 0.15,
        "dry_run": True,
    }
    values.update(overrides)
    from osrs_flip_recommender.main import Config

    return Config(**values)


def make_row(timestamp: datetime, low: int | None, high: int | None, low_volume: int, high_volume: int) -> dict[str, int | None]:
    return {
        "timestamp": int(timestamp.timestamp()),
        "avgLowPrice": low,
        "avgHighPrice": high,
        "lowPriceVolume": low_volume,
        "highPriceVolume": high_volume,
    }


def make_fixture_series(
    buy_start_local: datetime,
    *,
    buy_low: int,
    buy_high: int,
    sell_low: int,
    sell_high: int,
    buy_volume: int = 600_000,
    sell_volume: int = 600_000,
    days: int = 14,
    sell_offset_hours: int = 1,
) -> list[dict[str, int]]:
    rows: list[dict[str, int]] = []
    for days_ago in range(days, 0, -1):
        day_anchor = buy_start_local - timedelta(days=days_ago)
        for step in range(12):
            local_ts = day_anchor + timedelta(minutes=step * 5)
            rows.append(
                make_row(
                    local_ts.astimezone(UTC),
                    buy_low + (step % 3),
                    buy_high + (step % 3),
                    buy_volume,
                    buy_volume,
                )
            )
        sell_anchor = day_anchor + timedelta(hours=sell_offset_hours)
        for step in range(12):
            local_ts = sell_anchor + timedelta(minutes=step * 5)
            rows.append(
                make_row(
                    local_ts.astimezone(UTC),
                    sell_low + (step % 3),
                    sell_high + (step % 3),
                    sell_volume,
                    sell_volume,
                )
            )
    rows.append(make_row((buy_start_local - timedelta(minutes=5)).astimezone(UTC), buy_low, buy_high, buy_volume, buy_volume))
    rows.append(make_row((buy_start_local - timedelta(minutes=1)).astimezone(UTC), buy_low, buy_high, buy_volume, buy_volume))
    return rows


class FakeClient(WikiClient):
    def __init__(self, mappings, daily_prices, timeseries):
        super().__init__("test-agent", api_base_url="https://example.test")
        self._mappings = mappings
        self._daily_prices = daily_prices
        self._timeseries = timeseries

    def get_mapping(self):
        return self._mappings

    def get_price_window(self, window: str):
        if window != "24h":
            raise AssertionError(f"unexpected window {window}")
        return self._daily_prices

    def get_timeseries(self, item_id: int, timestep: str = "5m"):
        if timestep != "5m":
            raise AssertionError(f"unexpected timestep {timestep}")
        return self._timeseries[item_id]


class RecommenderTests(unittest.TestCase):
    def setUp(self):
        self.buy_start_local = datetime(2026, 4, 10, 23, 0, tzinfo=TORONTO_TZ)
        self.item = ItemMapping(1, "stable item", 100, True)

    def test_ge_tax_floor_zero_below_50_coins(self):
        self.assertEqual(ge_tax(49), 0)
        self.assertEqual(ge_tax(50), 1)
        self.assertEqual(ge_tax(101), 2)

    def test_trade_quantity_uses_three_times_buy_limit_and_budget_cap(self):
        self.assertEqual(trade_quantity(1_000, ge_limit=100, ge_slot_budget_gp=8_000_000, buy_limit_multiplier=3), 300)
        self.assertEqual(
            trade_quantity(1_000_000, ge_limit=100, ge_slot_budget_gp=8_000_000, buy_limit_multiplier=3),
            8,
        )

    def test_fill_rate_and_sell_reach_use_profile_series(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=130,
            sell_low=120,
            sell_high=150,
        )
        parsed_rows, _ = parse_timeseries_rows(rows)
        from osrs_flip_recommender.main import build_window_profile, minute_window

        buy_profile = build_window_profile(parsed_rows, minute_window(self.buy_start_local, 1), 14, self.buy_start_local)
        sell_profile = build_window_profile(
            parsed_rows,
            minute_window(self.buy_start_local + timedelta(hours=1), 1),
            14,
            self.buy_start_local,
        )

        self.assertGreaterEqual(compute_fill_rate(buy_profile, 101, 0.5), 0.60)
        self.assertGreaterEqual(compute_sell_reach(sell_profile, 151), 0.60)

    def test_assess_item_accepts_stable_liquid_candidate(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
            buy_volume=700_000,
            sell_volume=700_000,
        )

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertEqual(evaluation.reject_reasons, [])
        self.assertGreater(evaluation.expected_profit_gp, 0)
        self.assertGreaterEqual(evaluation.fill_rate, 0.55)
        self.assertGreaterEqual(evaluation.sell_reach, 0.65)
        self.assertGreater(evaluation.stability_score, 0.45)

    def test_assess_item_rejects_stale_data(self):
        stale_buy_start = datetime(2026, 4, 20, 23, 0, tzinfo=TORONTO_TZ)
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
        )

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(stale_max_minutes=30),
            buy_start_time_local=stale_buy_start,
        )

        self.assertIn("stale market data", evaluation.reject_reasons)

    def test_assess_item_rejects_missing_data(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
        )
        rows.extend(
            [
                make_row((self.buy_start_local - timedelta(days=1)).astimezone(UTC), None, 100, 0, 0),
                make_row((self.buy_start_local - timedelta(days=2)).astimezone(UTC), 100, None, 0, 0),
                make_row((self.buy_start_local - timedelta(days=3)).astimezone(UTC), None, None, 0, 0),
            ]
        )

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(max_missing_ratio=0.005),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertIn("too much missing timeseries data", evaluation.reject_reasons)

    def test_assess_item_adapts_buy_quantile_for_fill_rate(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
            buy_volume=700_000,
            sell_volume=700_000,
        )
        for row in rows:
            if row["avgLowPrice"] is not None and row["avgLowPrice"] <= 100:
                row["avgLowPrice"] = 112

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(q_buy_start=0.05, q_buy_max=1.00, buy_fill_min=0.65),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertEqual(evaluation.reject_reasons, [])
        self.assertGreater(evaluation.q_buy, 0.05)
        self.assertGreaterEqual(evaluation.fill_rate, 0.65)

    def test_assess_item_adapts_sell_quantile_for_reach(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
            buy_volume=700_000,
            sell_volume=700_000,
        )
        for index, row in enumerate(rows):
            if row["avgHighPrice"] is not None and row["avgHighPrice"] >= 176 and index % 2 == 0:
                row["avgHighPrice"] = 160

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(q_sell_start=0.70, q_sell_min=0.35, sell_reach_min=0.80),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertEqual(evaluation.reject_reasons, [])
        self.assertLess(evaluation.q_sell, 0.70)
        self.assertGreaterEqual(evaluation.sell_reach, 0.80)

    def test_assess_item_rejects_drifting_item(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=130,
            sell_low=145,
            sell_high=176,
        )
        for index, row in enumerate(rows):
            if row["avgLowPrice"] is not None:
                row["avgLowPrice"] += index * 5
            if row["avgHighPrice"] is not None:
                row["avgHighPrice"] += index * 5

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(min_stability_score=0.80),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertIn("stability score below threshold", evaluation.reject_reasons)

    def test_assess_item_rejects_spiky_item(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=132,
            sell_low=145,
            sell_high=176,
        )
        for index, row in enumerate(rows):
            if index % 5 == 0 and row["avgHighPrice"] is not None:
                row["avgHighPrice"] += 300

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(min_stability_score=0.90),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertIn("stability score below threshold", evaluation.reject_reasons)

    def test_assess_item_rejects_edge_after_tax(self):
        rows = make_fixture_series(
            self.buy_start_local,
            buy_low=100,
            buy_high=101,
            sell_low=101,
            sell_high=102,
            buy_volume=700_000,
            sell_volume=700_000,
        )

        evaluation = assess_item(
            self.item,
            rows,
            daily_volume=1_600_000,
            config=test_config(min_edge_gp=5, min_edge_pct=0.02),
            buy_start_time_local=self.buy_start_local,
        )

        self.assertTrue(
            "no viable quantile pair" in evaluation.reject_reasons
            or "fill rate below threshold" in evaluation.reject_reasons
        )

    def test_recommend_ranks_by_composite_score(self):
        buy_start_local = self.buy_start_local
        mappings = [
            {"id": 1, "name": "high roi", "limit": 100, "members": True},
            {"id": 2, "name": "high spread but worse", "limit": 100, "members": True},
        ]
        daily_prices = {
            "1": {"avgLowPrice": 100, "avgHighPrice": 176, "lowPriceVolume": 900_000, "highPriceVolume": 900_000},
            "2": {"avgLowPrice": 150, "avgHighPrice": 320, "lowPriceVolume": 600_000, "highPriceVolume": 600_000},
        }
        timeseries = {
            1: make_fixture_series(buy_start_local, buy_low=100, buy_high=132, sell_low=145, sell_high=176, buy_volume=800_000, sell_volume=800_000),
            2: make_fixture_series(buy_start_local, buy_low=190, buy_high=220, sell_low=210, sell_high=255, buy_volume=120_000, sell_volume=120_000),
        }

        candidates = recommend(FakeClient(mappings, daily_prices, timeseries), test_config(top_n=2), now_local=buy_start_local)

        self.assertEqual([candidate.name for candidate in candidates], ["high roi", "high spread but worse"])

    def test_format_message_contains_overnight_metrics(self):
        message = format_message(
            candidates=[
                Evaluation(
                    item_id=1,
                    name="stable item",
                    buy_price=100,
                    sell_price=176,
                    q_buy=0.20,
                    q_sell=0.50,
                    target_qty=300,
                    expected_fill_qty=255,
                    tax=3,
                    edge_gp=73,
                    edge_pct=0.73,
                    roi=0.23,
                    expected_profit_gp=18_615,
                    daily_volume=1_500_000,
                    ge_limit=100,
                    liq_buy=0.90,
                    liq_sell=0.85,
                    buy_share=0.001,
                    sell_share=0.001,
                    vol_pct=0.8,
                    drift_pct=0.5,
                    jump_rate=0.02,
                    stability_score=0.88,
                    sell_reach=0.75,
                    fill_rate=0.85,
                    stale_minutes=5,
                    missing_ratio=0.0,
                    score=0.72,
                    reject_reasons=[],
                )
            ],
            scored_candidates=[
                Evaluation(
                    item_id=1,
                    name="stable item",
                    buy_price=100,
                    sell_price=176,
                    q_buy=0.20,
                    q_sell=0.50,
                    target_qty=300,
                    expected_fill_qty=255,
                    tax=3,
                    edge_gp=73,
                    edge_pct=0.73,
                    roi=0.23,
                    expected_profit_gp=18_615,
                    daily_volume=1_500_000,
                    ge_limit=100,
                    liq_buy=0.90,
                    liq_sell=0.85,
                    buy_share=0.001,
                    sell_share=0.001,
                    vol_pct=0.8,
                    drift_pct=0.5,
                    jump_rate=0.02,
                    stability_score=0.88,
                    sell_reach=0.75,
                    fill_rate=0.85,
                    stale_minutes=5,
                    missing_ratio=0.0,
                    score=0.72,
                    reject_reasons=[],
                )
            ],
            include_all_scores=True,
        )

        self.assertIn("OSRS overnight flips", message)
        self.assertIn("Top 1 scored candidates", message)
        self.assertIn("score 0.720", message)
        self.assertIn("ROI 23.0%", message)
        self.assertIn("sell gross 176, sell net 173", message)
        self.assertIn("tax 3", message)
        self.assertIn("sell reach 75.0%", message)
        self.assertIn("All scored candidates", message)

    def test_evaluate_candidates_returns_passing_and_scored_lists(self):
        buy_start_local = self.buy_start_local
        mappings = [
            {"id": 1, "name": "passing item", "limit": 100, "members": True},
            {"id": 2, "name": "failing item", "limit": 100, "members": True},
        ]
        daily_prices = {
            "1": {"avgLowPrice": 100, "avgHighPrice": 176, "lowPriceVolume": 900_000, "highPriceVolume": 900_000},
            "2": {"avgLowPrice": 100, "avgHighPrice": 102, "lowPriceVolume": 900_000, "highPriceVolume": 900_000},
        }
        timeseries = {
            1: make_fixture_series(buy_start_local, buy_low=100, buy_high=132, sell_low=145, sell_high=176, buy_volume=800_000, sell_volume=800_000),
            2: make_fixture_series(buy_start_local, buy_low=100, buy_high=101, sell_low=101, sell_high=102, buy_volume=700_000, sell_volume=700_000),
        }

        passing, scored = evaluate_candidates(
            FakeClient(mappings, daily_prices, timeseries),
            test_config(top_n=10),
            now_local=buy_start_local,
        )

        self.assertEqual([candidate.name for candidate in passing], ["passing item"])
        self.assertEqual({candidate.name for candidate in scored}, {"passing item", "failing item"})


if __name__ == "__main__":
    unittest.main()
