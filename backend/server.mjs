import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import fs from "node:fs";

const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.CORS_ALLOW_ORIGIN || "*";
const LOG_SALT = process.env.LOG_SALT || "change-me";
const DB_PATH = "/data/logs.sqlite";

// ensure /data exists (Fly volume)
fs.mkdirSync("/data", { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
// run schema
db.exec(fs.readFileSync(new URL("./schema.sql", import.meta.url)).toString());

// prepared statements
const insertVisit = db.prepare(
  `INSERT INTO visits (ts, card_id, event, ua, ip_hash) VALUES (?, ?, ?, ?, ?)`
);

// naive in-memory rate limiter
const bucket = new Map();
function tooMany(ip) {
  const now = Date.now();
  const win = 10_000; // 10s
  const key = `${ip}:${Math.floor(now / win)}`;
  const count = (bucket.get(key) || 0) + 1;
  bucket.set(key, count);
  return count > 30; // max 30 hits / 10s window per ip
}

const app = express();
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: false, // static pages handle CSP
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json({ limit: "32kb" }));
app.use(morgan("tiny"));

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/v1/health", (req, res) => res.json({ ok: true }));

app.post("/v1/logs", (req, res) => {
  const ip = req.headers["fly-client-ip"] || req.ip || "";
  if (tooMany(ip)) return res.status(429).json({ ok: false, error: "rate_limited" });

  const { cardId, event } = req.body || {};
  if (!cardId || !event) return res.status(400).json({ ok: false, error: "bad_request" });

  const ua = String(req.headers["user-agent"] || "").slice(0, 200);
  const ipHash = crypto.createHash("sha256").update(String(ip) + LOG_SALT).digest("hex");
  const ts = new Date().toISOString();

  insertVisit.run(ts, String(cardId), String(event), ua, ipHash);
  res.json({ ok: true });
});

// (optional) minimal read endpoint for you
app.get("/v1/stats/cards", (req, res) => {
  const rows = db.prepare(`SELECT card_id, COUNT(*) as c FROM visits GROUP BY card_id ORDER BY c DESC`).all();
  res.json({ ok: true, rows });
});

app.listen(PORT, () => console.log(`Liber Arcanae logs on :${PORT}`));
