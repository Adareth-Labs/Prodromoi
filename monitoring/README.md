# Monitoring stack

1. Copy `.env.example` to `.env` and set `GRAFANA_PASSWORD` to a long, unique secret. The example leaves it blank intentionally; Compose will refuse to start until you set it.
2. Start the API from `../api` so it listens on port 3002 and writes logs to `api/logs`.
3. Start monitoring with `docker compose -f docker-compose.monitoring.yml up -d`.
4. Open Grafana at http://localhost:3100. Prometheus is available at http://localhost:9090; Loki is intentionally not published to the host.

All published UI/metrics ports bind to `127.0.0.1`. Do not change them to `0.0.0.0` on an untrusted network. The Promtail Docker socket mount was removed; this stack tails the API log files only. In production, set a strong `METRICS_BEARER_TOKEN` in the API environment. Create `prometheus/secrets/metrics-token` containing that same token (no newline), keep it out of Git, then uncomment the `authorization` block for the API target in `prometheus/prometheus.yml`. The Compose file mounts that secrets directory read-only. Do not expose `/metrics` publicly.
