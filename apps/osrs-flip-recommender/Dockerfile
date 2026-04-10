FROM python:3.12-slim

WORKDIR /app

COPY src ./src

ENV PYTHONPATH=/app/src

USER 65532:65532

ENTRYPOINT ["python", "-m", "osrs_flip_recommender.main"]
