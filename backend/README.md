# Liber Arcanae — Append-Only Logs (Fly.io)

- Receives POST /v1/logs with `{ cardId, event }`.
- Stores to SQLite on a Fly volume at /data.
- CORS locked to https://bekalah.github.io by default.
- ND-safe: no PII; hashed IP with LOG_SALT.

### Deploy

```
flyctl launch --no-deploy   # pick app name (e.g., liber-arcanae-logs) + region
flyctl volumes create logs --size 1 --region ord -a liber-arcanae-logs
flyctl deploy -a liber-arcanae-logs
```

### Test

```
curl -X POST "https://<your-app>.fly.dev/v1/logs" \
  -H "content-type: application/json" \
  -d '{"cardId":"fool","event":"enter-door"}'
```
