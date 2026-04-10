# OSRS Flip Recommender

Daily OSRS Grand Exchange flip recommender for the homelab CronJob.

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

## Build

```sh
docker build -t ghcr.io/varun-mehrotra/osrs-flip-recommender:latest apps/osrs-flip-recommender
docker push ghcr.io/varun-mehrotra/osrs-flip-recommender:latest
```
