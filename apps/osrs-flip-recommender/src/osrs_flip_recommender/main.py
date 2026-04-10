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
from datetime import UTC, datetime
from typing import Any


API_BASE_URL = "https://prices.runescape.wiki/api/v1/osrs"


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
    min_timeseries_samples: int = 96
    min_positive_margin_ratio: float = 0.70
    max_mid_price_cv: float = 0.08
    dry_run: bool = False


@dataclass(frozen=True)
class ItemMapping:
    item_id: int
    name: str
    limit: int
    members: bool


@dataclass(frozen=True)
class Candidate:
    item_id: int
    name: str
    buy_price: int
    sell_price: int
    tax: int
    net_margin: int
    trade_qty: int
    expected_gp: int
    daily_volume: int
    ge_limit: int
    stability_note: str
    positive_margin_ratio: float
    mid_price_cv: float


class ApiError(RuntimeError):
    pass


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


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
        min_timeseries_samples=int(os.getenv("MIN_TIMESERIES_SAMPLES", "96")),
        min_positive_margin_ratio=float(os.getenv("MIN_POSITIVE_MARGIN_RATIO", "0.70")),
        max_mid_price_cv=float(os.getenv("MAX_MID_PRICE_CV", "0.08")),
        dry_run=env_bool("DRY_RUN"),
    )


def ge_tax(sell_price: int) -> int:
    return math.floor(sell_price * 0.02)


def trade_quantity(buy_price: int, ge_limit: int, ge_slot_budget_gp: int, buy_limit_multiplier: int) -> int:
    if buy_price <= 0 or ge_limit <= 0:
        return 0
    return min(buy_limit_multiplier * ge_limit, ge_slot_budget_gp // buy_price)


def net_margin(buy_price: int, sell_price: int) -> int:
    return sell_price - buy_price - ge_tax(sell_price)


def total_volume(price_row: dict[str, Any]) -> int:
    return int(price_row.get("highPriceVolume") or 0) + int(price_row.get("lowPriceVolume") or 0)


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

    def get_mapping(self) -> list[dict[str, Any]]:
        response = request_json(f"{self.api_base_url}/mapping", self.user_agent)
        if not isinstance(response, list):
            raise ApiError("Unexpected /mapping response shape")
        return response

    def get_price_window(self, window: str) -> dict[str, Any]:
        response = request_json(f"{self.api_base_url}/{window}", self.user_agent)
        if not isinstance(response, dict) or not isinstance(response.get("data"), dict):
            raise ApiError(f"Unexpected /{window} response shape")
        return response["data"]

    def get_timeseries(self, item_id: int, timestep: str = "5m") -> list[dict[str, Any]]:
        params = urllib.parse.urlencode({"timestep": timestep, "id": item_id})
        response = request_json(f"{self.api_base_url}/timeseries?{params}", self.user_agent)
        if not isinstance(response, dict) or not isinstance(response.get("data"), list):
            raise ApiError("Unexpected /timeseries response shape")
        return response["data"]


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


def median_int(values: list[int]) -> int:
    return int(round(statistics.median(values)))


def pre_rank_candidates(
    mappings: dict[int, ItemMapping],
    daily_prices: dict[str, dict[str, Any]],
    recent_prices: dict[str, dict[str, Any]],
    config: Config,
) -> list[int]:
    candidate_scores: list[tuple[int, int]] = []

    for item_id, mapping in mappings.items():
        daily_row = daily_prices.get(str(item_id))
        recent_row = recent_prices.get(str(item_id))
        if not daily_row or not recent_row:
            continue

        if total_volume(daily_row) < config.min_daily_volume:
            continue

        buy_price = recent_row.get("avgLowPrice")
        sell_price = recent_row.get("avgHighPrice")
        if not isinstance(buy_price, int) or not isinstance(sell_price, int):
            continue

        margin = net_margin(buy_price, sell_price)
        qty = trade_quantity(buy_price, mapping.limit, config.ge_slot_budget_gp, config.buy_limit_multiplier)
        expected_gp = margin * qty
        if margin <= 0 or qty <= 0 or expected_gp <= 0:
            continue

        candidate_scores.append((expected_gp, item_id))

    candidate_scores.sort(reverse=True)
    return [item_id for _, item_id in candidate_scores[: config.candidate_limit]]


def evaluate_timeseries(item: ItemMapping, rows: list[dict[str, Any]], daily_volume: int, config: Config) -> Candidate | None:
    valid_rows: list[tuple[int, int]] = []
    margins: list[int] = []
    mid_prices: list[float] = []

    for row in rows:
        buy_price = row.get("avgLowPrice")
        sell_price = row.get("avgHighPrice")
        if not isinstance(buy_price, int) or not isinstance(sell_price, int) or buy_price <= 0 or sell_price <= 0:
            continue
        valid_rows.append((buy_price, sell_price))
        margins.append(net_margin(buy_price, sell_price))
        mid_prices.append((buy_price + sell_price) / 2)

    if len(valid_rows) < config.min_timeseries_samples:
        return None

    positive_margin_ratio = sum(1 for margin in margins if margin > 0) / len(margins)
    median_mid = statistics.median(mid_prices)
    mid_price_cv = (statistics.pstdev(mid_prices) / median_mid) if median_mid > 0 and len(mid_prices) > 1 else 0.0

    if positive_margin_ratio < config.min_positive_margin_ratio or mid_price_cv > config.max_mid_price_cv:
        return None

    buy_price = median_int([row[0] for row in valid_rows])
    sell_price = median_int([row[1] for row in valid_rows])
    margin = net_margin(buy_price, sell_price)
    qty = trade_quantity(buy_price, item.limit, config.ge_slot_budget_gp, config.buy_limit_multiplier)
    expected_gp = margin * qty
    if margin <= 0 or qty <= 0 or expected_gp <= 0:
        return None

    return Candidate(
        item_id=item.item_id,
        name=item.name,
        buy_price=buy_price,
        sell_price=sell_price,
        tax=ge_tax(sell_price),
        net_margin=margin,
        trade_qty=qty,
        expected_gp=expected_gp,
        daily_volume=daily_volume,
        ge_limit=item.limit,
        stability_note=f"{positive_margin_ratio:.0%} positive spreads, {mid_price_cv:.1%} mid-price CV",
        positive_margin_ratio=positive_margin_ratio,
        mid_price_cv=mid_price_cv,
    )


def recommend(client: WikiClient, config: Config) -> list[Candidate]:
    mappings = parse_mappings(client.get_mapping())
    daily_prices = client.get_price_window("24h")
    recent_prices = client.get_price_window("5m")
    pre_ranked_ids = pre_rank_candidates(mappings, daily_prices, recent_prices, config)

    candidates: list[Candidate] = []
    for item_id in pre_ranked_ids:
        item = mappings[item_id]
        rows = client.get_timeseries(item_id, "5m")
        candidate = evaluate_timeseries(item, rows, total_volume(daily_prices[str(item_id)]), config)
        if candidate is not None:
            candidates.append(candidate)

    candidates.sort(key=lambda candidate: candidate.expected_gp, reverse=True)
    return candidates[: config.top_n]


def format_gp(value: int) -> str:
    return f"{value:,} gp"


def format_volume(value: int) -> str:
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}m"
    if value >= 1_000:
        return f"{value / 1_000:.1f}k"
    return str(value)


def format_message(candidates: list[Candidate]) -> str:
    generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")
    if not candidates:
        return f"OSRS daily flips - {generated_at}\n\nNo items passed the liquidity and stability filters today."

    lines = [f"OSRS daily flips - {generated_at}", ""]
    for index, candidate in enumerate(candidates, start=1):
        lines.append(
            f"{index}. {candidate.name}: buy {candidate.buy_price:,}, sell {candidate.sell_price:,}, "
            f"tax {candidate.tax:,}, margin {candidate.net_margin:,}, qty {candidate.trade_qty:,}, "
            f"expected {format_gp(candidate.expected_gp)}"
        )
        lines.append(
            f"   volume {format_volume(candidate.daily_volume)}, GE limit {candidate.ge_limit:,}, "
            f"{candidate.stability_note}"
        )
    return "\n".join(lines)


def publish_ntfy(config: Config, message: str) -> None:
    url = f"{config.ntfy_base_url}/{urllib.parse.quote(config.ntfy_topic)}"
    headers = {
        "Title": "OSRS daily flips",
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
    message = format_message(recommend(client, config))

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
