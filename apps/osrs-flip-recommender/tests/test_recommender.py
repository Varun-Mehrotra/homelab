from __future__ import annotations

import unittest

from osrs_flip_recommender.main import (
    Candidate,
    Config,
    ItemMapping,
    evaluate_timeseries,
    format_message,
    ge_tax,
    pre_rank_candidates,
    trade_quantity,
)


def config(**overrides):
    values = {
        "user_agent": "test-agent",
        "ntfy_base_url": "https://ntfy.example.test",
        "ntfy_topic": "osrs-flips",
        "ntfy_token": "token",
        "candidate_limit": 10,
        "min_timeseries_samples": 3,
        "min_positive_margin_ratio": 0.70,
        "max_mid_price_cv": 0.08,
    }
    values.update(overrides)
    return Config(**values)


class RecommenderTests(unittest.TestCase):
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

    def test_pre_rank_filters_volume_missing_prices_and_ranks_expected_gp(self):
        mappings = {
            1: ItemMapping(1, "good item", 100, True),
            2: ItemMapping(2, "low volume", 100, True),
            3: ItemMapping(3, "missing price", 100, True),
            4: ItemMapping(4, "better item", 100, True),
        }
        daily = {
            "1": {"avgHighPrice": 120, "highPriceVolume": 700_000, "avgLowPrice": 100, "lowPriceVolume": 400_000},
            "2": {"avgHighPrice": 120, "highPriceVolume": 10, "avgLowPrice": 100, "lowPriceVolume": 10},
            "3": {"avgHighPrice": 120, "highPriceVolume": 700_000, "avgLowPrice": 100, "lowPriceVolume": 400_000},
            "4": {"avgHighPrice": 250, "highPriceVolume": 700_000, "avgLowPrice": 100, "lowPriceVolume": 400_000},
        }
        recent = {
            "1": {"avgHighPrice": 120, "avgLowPrice": 100},
            "2": {"avgHighPrice": 120, "avgLowPrice": 100},
            "3": {"avgHighPrice": None, "avgLowPrice": 100},
            "4": {"avgHighPrice": 250, "avgLowPrice": 100},
        }

        self.assertEqual(pre_rank_candidates(mappings, daily, recent, config()), [4, 1])

    def test_evaluate_timeseries_uses_medians_and_expected_gp(self):
        item = ItemMapping(1, "stable item", 100, True)
        rows = [
            {"avgLowPrice": 100, "avgHighPrice": 120},
            {"avgLowPrice": 101, "avgHighPrice": 121},
            {"avgLowPrice": 99, "avgHighPrice": 119},
        ]

        candidate = evaluate_timeseries(item, rows, daily_volume=1_500_000, config=config())

        self.assertIsNotNone(candidate)
        assert candidate is not None
        self.assertEqual(candidate.buy_price, 100)
        self.assertEqual(candidate.sell_price, 120)
        self.assertEqual(candidate.tax, 2)
        self.assertEqual(candidate.net_margin, 18)
        self.assertEqual(candidate.trade_qty, 300)
        self.assertEqual(candidate.expected_gp, 5_400)

    def test_evaluate_timeseries_rejects_unstable_items(self):
        item = ItemMapping(1, "unstable item", 100, True)
        rows = [
            {"avgLowPrice": 100, "avgHighPrice": 120},
            {"avgLowPrice": 300, "avgHighPrice": 320},
            {"avgLowPrice": 500, "avgHighPrice": 520},
        ]

        self.assertIsNone(evaluate_timeseries(item, rows, daily_volume=1_500_000, config=config(max_mid_price_cv=0.01)))

    def test_evaluate_timeseries_rejects_too_many_negative_spreads(self):
        item = ItemMapping(1, "bad spread item", 100, True)
        rows = [
            {"avgLowPrice": 100, "avgHighPrice": 120},
            {"avgLowPrice": 130, "avgHighPrice": 120},
            {"avgLowPrice": 130, "avgHighPrice": 120},
        ]

        self.assertIsNone(evaluate_timeseries(item, rows, daily_volume=1_500_000, config=config()))

    def test_format_message_contains_trade_details(self):
        message = format_message(
            [
                Candidate(
                    item_id=1,
                    name="stable item",
                    buy_price=100,
                    sell_price=120,
                    tax=2,
                    net_margin=18,
                    trade_qty=300,
                    expected_gp=5_400,
                    daily_volume=1_500_000,
                    ge_limit=100,
                    stability_note="100% positive spreads, 1.0% mid-price CV",
                    positive_margin_ratio=1,
                    mid_price_cv=0.01,
                )
            ]
        )

        self.assertIn("stable item", message)
        self.assertIn("expected 5,400 gp", message)
        self.assertIn("volume 1.5m", message)


if __name__ == "__main__":
    unittest.main()
