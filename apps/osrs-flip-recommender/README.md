# OSRS Flip Recommender

Overnight OSRS Grand Exchange flip recommender for the homelab CronJob.

## Run locally

```sh
OSRS_USER_AGENT='homelab-osrs-flip-recommender - varun.mehrotra@webguru.ca' \
NTFY_BASE_URL='https://ntfy.webguru.ca' \
NTFY_TOPIC='osrs-flips' \
NTFY_TOKEN='<token>' \
PYTHONPATH=src \
python3 -m osrs_flip_recommender.main
```

Set `DRY_RUN=true` to print the notification instead of publishing to ntfy.

## Strategy knobs

The recommender now models an explicit Toronto-time overnight buy window followed by a next-day sell window. Useful environment variables include:

- `BUY_WINDOW_HOURS` and `SELL_WINDOW_HOURS` for the buy-fill and sell-liquidation windows
- `BUY_PROFILE_DAYS` and `SELL_PROFILE_DAYS` for time-of-day conditioning history
- `BUY_FILL_MIN` and `SELL_REACH_MIN` for fill/reach certainty thresholds
- `MIN_EDGE_GP`, `MIN_EDGE_PCT`, `MIN_LIQ_SELL`, and `MIN_STABILITY_SCORE` for hard filters
- `Q_BUY_START`, `Q_BUY_STEP`, `Q_BUY_MAX`, `Q_SELL_START`, `Q_SELL_STEP`, and `Q_SELL_MIN` for adaptive quantile targeting
- `GE_TAX_RATE` for the configurable GE sell tax, which defaults to `0.02`
- `STALE_MAX_MINUTES` and `MAX_MISSING_RATIO` for data freshness and data-quality guardrails

The shipped defaults are intentionally somewhat permissive now: they target “show me plausible overnight candidates” rather than “only show near-perfect setups.” Tighten them later once you’ve seen a few dry-run outputs you trust.

`OSRS_USER_AGENT` remains mandatory to comply with the OSRS Wiki API acceptable-use guidance.

## Build

```sh
docker build -t ghcr.io/varun-mehrotra/osrs-flip-recommender:latest apps/osrs-flip-recommender
docker push ghcr.io/varun-mehrotra/osrs-flip-recommender:latest
```
