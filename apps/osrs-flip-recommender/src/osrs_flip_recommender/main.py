from __future__ import annotations

import json
import math
import os
import statistics
import sys
import urllib.error
import urllib.parse
import urllib.request
from base64 import b64encode
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo


API_BASE_URL = "https://prices.runescape.wiki/api/v1/osrs"
TORONTO_TZ = ZoneInfo("America/Toronto")


@dataclass(frozen=True)
class Config:
    user_agent: str
    ntfy_base_url: str
    ntfy_topic: str
    ntfy_token: str | None
    top_n: int = 12
    min_daily_volume: int = 1_000_000
    ge_slot_budget_gp: int = 8_000_000
    buy_limit_multiplier: int = 3
    candidate_limit: int = 80
    buy_window_hours: int = 12
    sell_window_hours: int = 14
    buy_profile_days: int = 14
    sell_profile_days: int = 14
    buy_fill_min: float = 0.40
    sell_reach_min: float = 0.50
    min_edge_gp: int = 20
    min_edge_pct: float = 0.005
    min_liq_sell: float = 0.35
    min_stability_score: float = 0.30
    max_buy_share: float = 0.01
    stale_max_minutes: int = 60
    max_missing_ratio: float = 0.20
    q_buy_start: float = 0.15
    q_buy_step: float = 0.05
    q_buy_max: float = 0.50
    q_sell_start: float = 0.55
    q_sell_step: float = 0.05
    q_sell_min: float = 0.25
    tax_rate: float = 0.02
    fill_weight: float = 0.50
    jump_threshold_pct: float = 0.05
    volatility_scale_pct: float = 2.50
    drift_scale_pct: float = 8.00
    jump_rate_scale: float = 0.40
    weight_roi: float = 0.35
    weight_profit: float = 0.25
    weight_liq_sell: float = 0.20
    weight_stability: float = 0.20
    weight_jump_penalty: float = 0.15
    weight_buy_share_penalty: float = 0.15
    dry_run: bool = False


@dataclass(frozen=True)
class ItemMapping:
    item_id: int
    name: str
    limit: int
    members: bool


@dataclass(frozen=True)
class PricePoint:
    timestamp: datetime
    avg_low_price: int
    avg_high_price: int
    low_volume: int
    high_volume: int

    @property
    def minute_of_day(self) -> int:
        local_time = self.timestamp.astimezone(TORONTO_TZ)
        return local_time.hour * 60 + local_time.minute

    @property
    def total_volume(self) -> int:
        return self.low_volume + self.high_volume


@dataclass(frozen=True)
class WindowProfile:
    rows: list[PricePoint]
    low_prices: list[int]
    high_prices: list[int]
    low_volumes: list[int]
    high_volumes: list[int]

    @property
    def total_volume(self) -> int:
        return sum(self.low_volumes) + sum(self.high_volumes)


@dataclass(frozen=True)
class Evaluation:
    item_id: int
    name: str
    buy_price: int
    sell_price: int
    q_buy: float
    q_sell: float
    target_qty: int
    expected_fill_qty: int
    tax: int
    edge_gp: int
    edge_pct: float
    roi: float
    expected_profit_gp: int
    daily_volume: int
    ge_limit: int
    liq_buy: float
    liq_sell: float
    buy_share: float
    sell_share: float
    vol_pct: float
    drift_pct: float
    jump_rate: float
    stability_score: float
    sell_reach: float
    fill_rate: float
    stale_minutes: float
    missing_ratio: float
    score: float
    reject_reasons: list[str]


class ApiError(RuntimeError):
    pass


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def env_float(name: str, default: float) -> float:
    value = os.getenv(name)
    return float(value) if value is not None else default


def load_config() -> Config:
    user_agent = os.getenv("OSRS_USER_AGENT", "").strip()
    if not user_agent:
        raise ValueError("OSRS_USER_AGENT is required by the OSRS Wiki API acceptable use policy")

    return Config(
        user_agent=user_agent,
        ntfy_base_url=os.getenv("NTFY_BASE_URL", "https://ntfy.webguru.ca").rstrip("/"),
        ntfy_topic=os.getenv("NTFY_TOPIC", "osrs-flips").strip("/"),
        ntfy_token=os.getenv("NTFY_TOKEN"),
        top_n=int(os.getenv("TOP_N", "12")),
        min_daily_volume=int(os.getenv("MIN_DAILY_VOLUME", "1000000")),
        ge_slot_budget_gp=int(os.getenv("GE_SLOT_BUDGET_GP", "8000000")),
        buy_limit_multiplier=int(os.getenv("BUY_LIMIT_MULTIPLIER", "3")),
        candidate_limit=int(os.getenv("CANDIDATE_LIMIT", "80")),
        buy_window_hours=int(os.getenv("BUY_WINDOW_HOURS", "12")),
        sell_window_hours=int(os.getenv("SELL_WINDOW_HOURS", "14")),
        buy_profile_days=int(os.getenv("BUY_PROFILE_DAYS", "14")),
        sell_profile_days=int(os.getenv("SELL_PROFILE_DAYS", "14")),
        buy_fill_min=env_float("BUY_FILL_MIN", 0.40),
        sell_reach_min=env_float("SELL_REACH_MIN", 0.50),
        min_edge_gp=int(os.getenv("MIN_EDGE_GP", "20")),
        min_edge_pct=env_float("MIN_EDGE_PCT", 0.005),
        min_liq_sell=env_float("MIN_LIQ_SELL", 0.35),
        min_stability_score=env_float("MIN_STABILITY_SCORE", 0.30),
        max_buy_share=env_float("MAX_BUY_SHARE", 0.01),
        stale_max_minutes=int(os.getenv("STALE_MAX_MINUTES", "60")),
        max_missing_ratio=env_float("MAX_MISSING_RATIO", 0.20),
        q_buy_start=env_float("Q_BUY_START", 0.15),
        q_buy_step=env_float("Q_BUY_STEP", 0.05),
        q_buy_max=env_float("Q_BUY_MAX", 0.50),
        q_sell_start=env_float("Q_SELL_START", 0.55),
        q_sell_step=env_float("Q_SELL_STEP", 0.05),
        q_sell_min=env_float("Q_SELL_MIN", 0.25),
        tax_rate=env_float("GE_TAX_RATE", 0.02),
        fill_weight=env_float("FILL_WEIGHT", 0.50),
        jump_threshold_pct=env_float("JUMP_THRESHOLD_PCT", 0.05),
        volatility_scale_pct=env_float("VOLATILITY_SCALE_PCT", 2.50),
        drift_scale_pct=env_float("DRIFT_SCALE_PCT", 8.00),
        jump_rate_scale=env_float("JUMP_RATE_SCALE", 0.40),
        weight_roi=env_float("WEIGHT_ROI", 0.35),
        weight_profit=env_float("WEIGHT_PROFIT", 0.25),
        weight_liq_sell=env_float("WEIGHT_LIQ_SELL", 0.20),
        weight_stability=env_float("WEIGHT_STABILITY", 0.20),
        weight_jump_penalty=env_float("WEIGHT_JUMP_PENALTY", 0.15),
        weight_buy_share_penalty=env_float("WEIGHT_BUY_SHARE_PENALTY", 0.15),
        dry_run=env_bool("DRY_RUN"),
    )


def ge_tax(sell_price: int, tax_rate: float = 0.02) -> int:
    if sell_price <= 0:
        return 0
    return math.floor(sell_price * tax_rate)


def trade_quantity(buy_price: int, ge_limit: int, ge_slot_budget_gp: int, buy_limit_multiplier: int) -> int:
    if buy_price <= 0 or ge_limit <= 0:
        return 0
    return min(buy_limit_multiplier * ge_limit, ge_slot_budget_gp // buy_price)


def net_margin(buy_price: int, sell_price: int, tax_rate: float = 0.02) -> int:
    return sell_price - buy_price - ge_tax(sell_price, tax_rate)


def total_volume(price_row: dict[str, Any]) -> int:
    return int(price_row.get("highPriceVolume") or 0) + int(price_row.get("lowPriceVolume") or 0)


def clamp01(value: float) -> float:
    return max(0.0, min(1.0, value))


def scale_ratio(value: float, limit: float) -> float:
    if limit <= 0:
        return 0.0
    return clamp01(value / limit)


def quantile(values: list[int], q: float) -> int:
    if not values:
        raise ValueError("quantile requires at least one value")
    if len(values) == 1:
        return values[0]
    clamped_q = clamp01(q)
    ordered = sorted(values)
    position = clamped_q * (len(ordered) - 1)
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    lower_value = ordered[lower]
    upper_value = ordered[upper]
    weight = position - lower
    return int(round(lower_value + (upper_value - lower_value) * weight))


def request_json(url: str, user_agent: str, timeout_seconds: int = 30) -> dict[str, Any] | list[dict[str, Any]]:
    request = urllib.request.Request(url, headers={"User-Agent": user_agent})
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ApiError(f"GET {url} failed with HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"GET {url} failed: {exc.reason}") from exc


class WikiClient:
    def __init__(self, user_agent: str, api_base_url: str = API_BASE_URL) -> None:
        self.user_agent = user_agent
        self.api_base_url = api_base_url.rstrip("/")
        self._cache: dict[tuple[str, str], Any] = {}

    def get_mapping(self) -> list[dict[str, Any]]:
        cache_key = ("mapping", "")
        if cache_key not in self._cache:
            response = request_json(f"{self.api_base_url}/mapping", self.user_agent)
            if not isinstance(response, list):
                raise ApiError("Unexpected /mapping response shape")
            self._cache[cache_key] = response
        return self._cache[cache_key]

    def get_price_window(self, window: str) -> dict[str, Any]:
        cache_key = ("window", window)
        if cache_key not in self._cache:
            response = request_json(f"{self.api_base_url}/{window}", self.user_agent)
            if not isinstance(response, dict) or not isinstance(response.get("data"), dict):
                raise ApiError(f"Unexpected /{window} response shape")
            self._cache[cache_key] = response["data"]
        return self._cache[cache_key]

    def get_timeseries(self, item_id: int, timestep: str = "5m") -> list[dict[str, Any]]:
        cache_key = ("timeseries", f"{item_id}:{timestep}")
        if cache_key not in self._cache:
            params = urllib.parse.urlencode({"timestep": timestep, "id": item_id})
            response = request_json(f"{self.api_base_url}/timeseries?{params}", self.user_agent)
            if not isinstance(response, dict) or not isinstance(response.get("data"), list):
                raise ApiError("Unexpected /timeseries response shape")
            self._cache[cache_key] = response["data"]
        return self._cache[cache_key]


def parse_mappings(rows: list[dict[str, Any]]) -> dict[int, ItemMapping]:
    mappings: dict[int, ItemMapping] = {}
    for row in rows:
        item_id = row.get("id")
        name = row.get("name")
        limit = row.get("limit")
        if isinstance(item_id, int) and isinstance(name, str) and isinstance(limit, int) and limit > 0:
            mappings[item_id] = ItemMapping(
                item_id=item_id,
                name=name,
                limit=limit,
                members=bool(row.get("members", False)),
            )
    return mappings


def parse_timeseries_rows(rows: list[dict[str, Any]]) -> tuple[list[PricePoint], float]:
    parsed: list[PricePoint] = []
    total_rows = len(rows)
    invalid_rows = 0

    for row in rows:
        timestamp = row.get("timestamp")
        avg_low_price = row.get("avgLowPrice")
        avg_high_price = row.get("avgHighPrice")
        if not isinstance(timestamp, int) or not isinstance(avg_low_price, int) or not isinstance(avg_high_price, int):
            invalid_rows += 1
            continue
        if avg_low_price <= 0 or avg_high_price <= 0:
            invalid_rows += 1
            continue
        parsed.append(
            PricePoint(
                timestamp=datetime.fromtimestamp(timestamp, tz=UTC),
                avg_low_price=avg_low_price,
                avg_high_price=avg_high_price,
                low_volume=int(row.get("lowPriceVolume") or 0),
                high_volume=int(row.get("highPriceVolume") or 0),
            )
        )

    missing_ratio = invalid_rows / total_rows if total_rows else 1.0
    parsed.sort(key=lambda point: point.timestamp)
    return parsed, missing_ratio


def minute_window(start_local: datetime, hours: int) -> set[int]:
    start_minute = start_local.hour * 60 + start_local.minute
    steps = max(1, math.ceil(hours * 60 / 5))
    return {(start_minute + step * 5) % 1440 for step in range(steps)}


def align_to_timestep(local_time: datetime, minutes: int = 5) -> datetime:
    aligned_minute = local_time.minute - (local_time.minute % minutes)
    return local_time.replace(minute=aligned_minute, second=0, microsecond=0)


def build_window_profile(
    rows: list[PricePoint],
    minute_buckets: set[int],
    lookback_days: int,
    now_local: datetime,
) -> WindowProfile:
    cutoff = now_local - timedelta(days=lookback_days)
    grouped_lows: dict[int, list[int]] = {}
    grouped_highs: dict[int, list[int]] = {}
    grouped_low_volumes: dict[int, list[int]] = {}
    grouped_high_volumes: dict[int, list[int]] = {}
    selected_rows: list[PricePoint] = []

    for row in rows:
        local_time = row.timestamp.astimezone(TORONTO_TZ)
        if local_time < cutoff:
            continue
        minute = row.minute_of_day
        if minute not in minute_buckets:
            continue
        selected_rows.append(row)
        grouped_lows.setdefault(minute, []).append(row.avg_low_price)
        grouped_highs.setdefault(minute, []).append(row.avg_high_price)
        grouped_low_volumes.setdefault(minute, []).append(row.low_volume)
        grouped_high_volumes.setdefault(minute, []).append(row.high_volume)

    ordered_minutes = sorted(grouped_lows)
    return WindowProfile(
        rows=selected_rows,
        low_prices=[int(round(statistics.median(grouped_lows[minute]))) for minute in ordered_minutes],
        high_prices=[int(round(statistics.median(grouped_highs[minute]))) for minute in ordered_minutes],
        low_volumes=[int(round(statistics.median(grouped_low_volumes[minute]))) for minute in ordered_minutes],
        high_volumes=[int(round(statistics.median(grouped_high_volumes[minute]))) for minute in ordered_minutes],
    )


def profile_to_points(
    low_prices: list[int],
    high_prices: list[int],
    start_time_local: datetime,
) -> list[PricePoint]:
    points: list[PricePoint] = []
    for index, (low_price, high_price) in enumerate(zip(low_prices, high_prices, strict=False)):
        points.append(
            PricePoint(
                timestamp=(start_time_local + timedelta(minutes=index * 5)).astimezone(UTC),
                avg_low_price=low_price,
                avg_high_price=high_price,
                low_volume=0,
                high_volume=0,
            )
        )
    return points


def compute_fill_rate(profile: WindowProfile, buy_price: int, fill_weight: float) -> float:
    if not profile.low_prices:
        return 0.0
    fill_presence = sum(1 for price in profile.low_prices if price <= buy_price) / len(profile.low_prices)
    total_low_volume = sum(profile.low_volumes)
    fill_volume = (
        sum(volume for price, volume in zip(profile.low_prices, profile.low_volumes, strict=False) if price <= buy_price)
        / total_low_volume
        if total_low_volume > 0
        else 0.0
    )
    return clamp01(fill_weight * fill_presence + (1 - fill_weight) * fill_volume)


def compute_sell_reach(profile: WindowProfile, sell_price: int) -> float:
    if not profile.high_prices:
        return 0.0
    return sum(1 for price in profile.high_prices if price >= sell_price) / len(profile.high_prices)


def compute_window_liquidity(target_qty: int, total_window_volume: int, max_share: float) -> tuple[float, float]:
    share = target_qty / max(total_window_volume, 1)
    liquidity = clamp01(1 - scale_ratio(share, max_share))
    return share, liquidity


def compute_returns(rows: list[PricePoint]) -> list[float]:
    returns: list[float] = []
    previous_mid: float | None = None
    for row in rows:
        mid = (row.avg_low_price + row.avg_high_price) / 2
        if previous_mid is not None and previous_mid > 0 and mid > 0:
            returns.append(math.log(mid / previous_mid))
        previous_mid = mid
    return returns


def median_absolute_deviation(values: list[float]) -> float:
    if not values:
        return 0.0
    median_value = statistics.median(values)
    return statistics.median(abs(value - median_value) for value in values)


def regression_slope(xs: list[float], ys: list[float]) -> float:
    if len(xs) != len(ys) or len(xs) < 2:
        return 0.0
    mean_x = statistics.fmean(xs)
    mean_y = statistics.fmean(ys)
    denominator = sum((x - mean_x) ** 2 for x in xs)
    if denominator == 0:
        return 0.0
    numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys, strict=False))
    return numerator / denominator


def compute_stability(rows: list[PricePoint], config: Config) -> tuple[float, float, float, float]:
    if len(rows) < 3:
        return 100.0, 100.0, 1.0, 0.0

    returns = compute_returns(rows)
    vol_pct = median_absolute_deviation(returns) * 100 if returns else 100.0

    xs: list[float] = []
    ys: list[float] = []
    start = rows[0].timestamp
    for row in rows:
        mid = (row.avg_low_price + row.avg_high_price) / 2
        if mid <= 0:
            continue
        xs.append((row.timestamp - start).total_seconds() / 3600)
        ys.append(math.log(mid))
    slope = regression_slope(xs, ys)
    window_hours = max(xs[-1] if xs else 0.0, 0.0)
    drift_pct = (math.exp(abs(slope) * window_hours) - 1) * 100 if window_hours > 0 else 0.0
    jump_cutoff = config.jump_threshold_pct / 100
    jump_rate = (
        sum(1 for value in returns if abs(value) > jump_cutoff) / len(returns)
        if returns
        else 1.0
    )

    stability_score = clamp01(
        1
        - 0.45 * scale_ratio(vol_pct, config.volatility_scale_pct)
        - 0.30 * scale_ratio(drift_pct, config.drift_scale_pct)
        - 0.25 * scale_ratio(jump_rate, config.jump_rate_scale)
    )
    return vol_pct, drift_pct, jump_rate, stability_score


def profit_ratio(expected_profit_gp: int, cash_locked: int) -> float:
    if cash_locked <= 0:
        return 0.0
    return expected_profit_gp / cash_locked


def score_evaluation(
    expected_profit_gp: int,
    cash_locked: int,
    liq_sell: float,
    stability_score: float,
    jump_rate: float,
    buy_share: float,
    config: Config,
) -> float:
    profit_component = profit_ratio(expected_profit_gp, config.ge_slot_budget_gp)
    roi_component = profit_ratio(expected_profit_gp, cash_locked)
    return (
        config.weight_roi * roi_component
        + config.weight_profit * profit_component
        + config.weight_liq_sell * liq_sell
        + config.weight_stability * stability_score
        - config.weight_jump_penalty * jump_rate
        - config.weight_buy_share_penalty * scale_ratio(buy_share, config.max_buy_share)
    )


def assess_item(
    item: ItemMapping,
    rows: list[dict[str, Any]],
    daily_volume: int,
    config: Config,
    buy_start_time_local: datetime,
) -> Evaluation:
    now_utc = buy_start_time_local.astimezone(UTC)
    parsed_rows, missing_ratio = parse_timeseries_rows(rows)
    reject_reasons: list[str] = []

    stale_minutes = (
        (now_utc - parsed_rows[-1].timestamp).total_seconds() / 60
        if parsed_rows
        else float("inf")
    )
    if missing_ratio > config.max_missing_ratio:
        reject_reasons.append("too much missing timeseries data")
    if stale_minutes > config.stale_max_minutes:
        reject_reasons.append("stale market data")

    buy_minutes = minute_window(buy_start_time_local, config.buy_window_hours)
    sell_start_time = buy_start_time_local + timedelta(hours=config.buy_window_hours)
    sell_minutes = minute_window(sell_start_time, config.sell_window_hours)

    buy_profile = build_window_profile(parsed_rows, buy_minutes, config.buy_profile_days, buy_start_time_local)
    sell_profile = build_window_profile(parsed_rows, sell_minutes, config.sell_profile_days, buy_start_time_local)

    if not buy_profile.low_prices:
        reject_reasons.append("no buy-window profile data")
    if not sell_profile.high_prices:
        reject_reasons.append("no sell-window profile data")
    if daily_volume < config.min_daily_volume:
        reject_reasons.append("daily volume below threshold")

    buy_stability = compute_stability(
        profile_to_points(buy_profile.low_prices, buy_profile.high_prices, buy_start_time_local),
        config,
    )
    sell_stability = compute_stability(
        profile_to_points(sell_profile.low_prices, sell_profile.high_prices, sell_start_time),
        config,
    )
    vol_pct = (buy_stability[0] + sell_stability[0]) / 2
    drift_pct = (buy_stability[1] + sell_stability[1]) / 2
    jump_rate = (buy_stability[2] + sell_stability[2]) / 2
    stability_score = (buy_stability[3] + sell_stability[3]) / 2
    if stability_score < config.min_stability_score:
        reject_reasons.append("stability score below threshold")

    selected_buy_price = 0
    selected_sell_price = 0
    selected_q_buy = config.q_buy_start
    selected_q_sell = config.q_sell_start
    selected_fill_rate = 0.0
    selected_sell_reach = 0.0
    selected_target_qty = 0
    selected_expected_fill_qty = 0
    selected_edge_gp = 0
    selected_edge_pct = 0.0
    selected_buy_share = 1.0
    selected_sell_share = 1.0
    selected_liq_buy = 0.0
    selected_liq_sell = 0.0
    selected_roi = 0.0
    selected_expected_profit = 0
    selected_score = 0.0
    best_attempt_seen = False

    if not reject_reasons:
        q_buy = config.q_buy_start
        while q_buy <= config.q_buy_max + 1e-9:
            buy_price = quantile(buy_profile.low_prices, q_buy)
            target_qty = trade_quantity(buy_price, item.limit, config.ge_slot_budget_gp, config.buy_limit_multiplier)
            buy_share, liq_buy = compute_window_liquidity(target_qty, buy_profile.total_volume, config.max_buy_share)
            fill_rate = compute_fill_rate(buy_profile, buy_price, config.fill_weight)

            q_sell = config.q_sell_start
            while q_sell >= config.q_sell_min - 1e-9:
                sell_price = quantile(sell_profile.high_prices, q_sell)
                sell_reach = compute_sell_reach(sell_profile, sell_price)
                edge_gp = net_margin(buy_price, sell_price, config.tax_rate)
                edge_pct = edge_gp / buy_price if buy_price > 0 else 0.0
                sell_share, liq_sell = compute_window_liquidity(target_qty, sell_profile.total_volume, config.max_buy_share)
                expected_fill_qty = int(round(target_qty * fill_rate))
                expected_profit_gp = expected_fill_qty * edge_gp
                cash_locked = target_qty * buy_price
                roi = profit_ratio(expected_profit_gp, cash_locked)
                score = score_evaluation(
                    expected_profit_gp=expected_profit_gp,
                    cash_locked=cash_locked,
                    liq_sell=liq_sell,
                    stability_score=stability_score,
                    jump_rate=jump_rate,
                    buy_share=buy_share,
                    config=config,
                )

                if not best_attempt_seen or score > selected_score:
                    selected_buy_price = buy_price
                    selected_sell_price = sell_price
                    selected_q_buy = q_buy
                    selected_q_sell = q_sell
                    selected_fill_rate = fill_rate
                    selected_sell_reach = sell_reach
                    selected_target_qty = target_qty
                    selected_expected_fill_qty = expected_fill_qty
                    selected_edge_gp = edge_gp
                    selected_edge_pct = edge_pct
                    selected_buy_share = buy_share
                    selected_sell_share = sell_share
                    selected_liq_buy = liq_buy
                    selected_liq_sell = liq_sell
                    selected_roi = roi
                    selected_expected_profit = expected_profit_gp
                    selected_score = score
                    best_attempt_seen = True

                if edge_gp < config.min_edge_gp or edge_pct < config.min_edge_pct:
                    q_sell -= config.q_sell_step
                    continue
                if sell_reach < config.sell_reach_min:
                    q_sell -= config.q_sell_step
                    continue

                selected_buy_price = buy_price
                selected_sell_price = sell_price
                selected_q_buy = q_buy
                selected_q_sell = q_sell
                selected_fill_rate = fill_rate
                selected_sell_reach = sell_reach
                selected_target_qty = target_qty
                selected_expected_fill_qty = expected_fill_qty
                selected_edge_gp = edge_gp
                selected_edge_pct = edge_pct
                selected_buy_share = buy_share
                selected_sell_share = sell_share
                selected_liq_buy = liq_buy
                selected_liq_sell = liq_sell
                selected_roi = roi
                selected_expected_profit = expected_profit_gp
                selected_score = score
                break

            if selected_sell_price > 0 and fill_rate >= config.buy_fill_min:
                break
            q_buy += config.q_buy_step

        if selected_target_qty <= 0:
            reject_reasons.append("no viable quantile pair")
        else:
            if selected_fill_rate < config.buy_fill_min:
                reject_reasons.append("fill rate below threshold")
            if selected_liq_sell < config.min_liq_sell:
                reject_reasons.append("sell liquidity below threshold")
            if selected_buy_share > config.max_buy_share:
                reject_reasons.append("buy share above threshold")
            if selected_expected_profit <= 0:
                reject_reasons.append("non-positive expected profit")

    return Evaluation(
        item_id=item.item_id,
        name=item.name,
        buy_price=selected_buy_price,
        sell_price=selected_sell_price,
        q_buy=selected_q_buy,
        q_sell=selected_q_sell,
        target_qty=selected_target_qty,
        expected_fill_qty=selected_expected_fill_qty,
        tax=ge_tax(selected_sell_price, config.tax_rate),
        edge_gp=selected_edge_gp,
        edge_pct=selected_edge_pct,
        roi=selected_roi,
        expected_profit_gp=selected_expected_profit,
        daily_volume=daily_volume,
        ge_limit=item.limit,
        liq_buy=selected_liq_buy,
        liq_sell=selected_liq_sell,
        buy_share=selected_buy_share,
        sell_share=selected_sell_share,
        vol_pct=vol_pct,
        drift_pct=drift_pct,
        jump_rate=jump_rate,
        stability_score=stability_score,
        sell_reach=selected_sell_reach,
        fill_rate=selected_fill_rate,
        stale_minutes=stale_minutes,
        missing_ratio=missing_ratio,
        score=selected_score,
        reject_reasons=reject_reasons,
    )


def evaluate_item(
    item: ItemMapping,
    rows: list[dict[str, Any]],
    daily_volume: int,
    config: Config,
    buy_start_time_local: datetime,
) -> Evaluation | None:
    evaluation = assess_item(item, rows, daily_volume, config, buy_start_time_local)
    return evaluation if not evaluation.reject_reasons else None


def pre_rank_candidates(
    mappings: dict[int, ItemMapping],
    daily_prices: dict[str, dict[str, Any]],
    config: Config,
) -> list[int]:
    candidate_scores: list[tuple[int, int]] = []
    for item_id, mapping in mappings.items():
        daily_row = daily_prices.get(str(item_id))
        if not daily_row:
            continue
        volume = total_volume(daily_row)
        if volume < config.min_daily_volume:
            continue
        avg_low_price = daily_row.get("avgLowPrice")
        if not isinstance(avg_low_price, int) or avg_low_price <= 0:
            continue
        qty = trade_quantity(avg_low_price, mapping.limit, config.ge_slot_budget_gp, config.buy_limit_multiplier)
        if qty <= 0:
            continue
        candidate_scores.append((volume * qty, item_id))

    candidate_scores.sort(reverse=True)
    return [item_id for _, item_id in candidate_scores[: config.candidate_limit]]


def evaluate_candidates(
    client: WikiClient,
    config: Config,
    now_local: datetime | None = None,
) -> tuple[list[Evaluation], list[Evaluation]]:
    buy_start_time_local = align_to_timestep(now_local or datetime.now(TORONTO_TZ))
    mappings = parse_mappings(client.get_mapping())
    daily_prices = client.get_price_window("24h")
    pre_ranked_ids = pre_rank_candidates(mappings, daily_prices, config)

    passing_candidates: list[Evaluation] = []
    scored_candidates: list[Evaluation] = []
    for item_id in pre_ranked_ids:
        daily_row = daily_prices.get(str(item_id))
        if daily_row is None:
            continue
        item = mappings[item_id]
        evaluation = assess_item(
            item=item,
            rows=client.get_timeseries(item_id, "5m"),
            daily_volume=total_volume(daily_row),
            config=config,
            buy_start_time_local=buy_start_time_local,
        )
        scored_candidates.append(evaluation)
        if not evaluation.reject_reasons:
            passing_candidates.append(evaluation)

    scored_candidates.sort(key=lambda candidate: candidate.score, reverse=True)
    passing_candidates.sort(key=lambda candidate: candidate.score, reverse=True)
    return passing_candidates[: config.top_n], scored_candidates


def recommend(client: WikiClient, config: Config, now_local: datetime | None = None) -> list[Evaluation]:
    passing_candidates, _ = evaluate_candidates(client, config, now_local)
    return passing_candidates


def format_gp(value: int) -> str:
    return f"{value:,} gp"


def format_pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def format_volume(value: int) -> str:
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}m"
    if value >= 1_000:
        return f"{value / 1_000:.1f}k"
    return str(value)


def confidence_label(candidate: Evaluation) -> str:
    composite = (candidate.fill_rate + candidate.sell_reach + candidate.stability_score) / 3
    if composite >= 0.75:
        return "high"
    if composite >= 0.55:
        return "medium"
    return "low"


def format_candidate_line(index: int, candidate: Evaluation) -> list[str]:
    status = "PASS" if not candidate.reject_reasons else "FAIL"
    reason_suffix = ""
    if candidate.reject_reasons:
        reason_suffix = f" | reasons: {', '.join(candidate.reject_reasons)}"
    net_sell_price = max(candidate.sell_price - candidate.tax, 0)

    return [
        (
            f"{index}. [{status}] {candidate.name}: score {candidate.score:.3f}, "
            f"buy {candidate.buy_price:,}, sell gross {candidate.sell_price:,}, sell net {net_sell_price:,}, "
            f"qty {candidate.target_qty:,}, "
            f"expected {format_gp(candidate.expected_profit_gp)}, ROI {format_pct(candidate.roi)}{reason_suffix}"
        ),
        (
            f"   fill {candidate.expected_fill_qty:,} @ {format_pct(candidate.fill_rate)}, "
            f"sell reach {format_pct(candidate.sell_reach)}, tax {candidate.tax:,}, "
            f"edge {candidate.edge_gp:,} gp ({format_pct(candidate.edge_pct)}), "
            f"liq buy/sell {format_pct(candidate.liq_buy)}/{format_pct(candidate.liq_sell)}, "
            f"stability {format_pct(candidate.stability_score)}"
        ),
    ]


def format_message(
    candidates: list[Evaluation],
    scored_candidates: list[Evaluation] | None = None,
    include_all_scores: bool = False,
    top_ranked_n: int = 10,
) -> str:
    generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    ranked_candidates = scored_candidates if scored_candidates is not None else candidates

    lines = [f"OSRS overnight flips - {generated_at}", ""]
    if candidates:
        lines.append(f"Passing items: {len(candidates)}")
    else:
        lines.append("Passing items: 0")
        lines.append("No items passed the overnight liquidity, stability, and edge filters.")
    lines.append("")
    lines.append(f"Top {min(top_ranked_n, len(ranked_candidates))} scored candidates:")
    for index, candidate in enumerate(ranked_candidates[:top_ranked_n], start=1):
        lines.extend(format_candidate_line(index, candidate))

    if include_all_scores and ranked_candidates:
        lines.append("")
        lines.append("All scored candidates:")
        for index, candidate in enumerate(ranked_candidates, start=1):
            lines.extend(format_candidate_line(index, candidate))
    return "\n".join(lines)


def publish_ntfy(config: Config, message: str) -> None:
    url = f"{config.ntfy_base_url}/{urllib.parse.quote(config.ntfy_topic)}"
    headers = {
        "Title": "OSRS overnight flips",
        "Tags": "moneybag,game",
        "Priority": "default",
    }
    if config.ntfy_token:
        token_auth = b64encode(f":{config.ntfy_token}".encode("utf-8")).decode("ascii")
        headers["Authorization"] = f"Basic {token_auth}"
    request = urllib.request.Request(url, data=message.encode("utf-8"), headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            if response.status >= 400:
                raise ApiError(f"ntfy publish failed with HTTP {response.status}")
    except urllib.error.HTTPError as exc:
        raise ApiError(f"ntfy publish failed with HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise ApiError(f"ntfy publish failed: {exc.reason}") from exc


def run() -> int:
    config = load_config()
    client = WikiClient(config.user_agent)
    candidates, scored_candidates = evaluate_candidates(client, config)
    message = format_message(candidates, scored_candidates, include_all_scores=config.dry_run)

    if config.dry_run:
        print(message)
    else:
        publish_ntfy(config, message)
        print("Published OSRS flip recommendations to ntfy")
    return 0


def main() -> None:
    try:
        raise SystemExit(run())
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
