import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const ACCOUNT_ID = "68559bc822f9d0ec46ea5e19569a315e";
const ZONE_ID = "5aae6c24936ac3f66e6e518394bcd7a8";
const SITE_TAG = "0b882d8c2dea4a44b1b640946a629c7d";
const HOST = "yawn.gdd.moe";

function getConfigPath() {
  if (process.platform === "win32" && process.env.APPDATA) {
    return path.join(process.env.APPDATA, "xdg.config", "cloudflare", "config", "default.json");
  }
  return path.join(os.homedir(), ".config", "cloudflare", "config", "default.json");
}

function getToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) {
    return process.env.CLOUDFLARE_API_TOKEN;
  }
  const cfgPath = getConfigPath();
  if (!fs.existsSync(cfgPath)) {
    throw new Error("Not logged in to cf CLI. Run: cf auth login");
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  if (cfg.expiration_time && Date.now() > new Date(cfg.expiration_time).getTime() - 60_000) {
    execSync("cf auth whoami", { stdio: "ignore" });
    return JSON.parse(fs.readFileSync(cfgPath, "utf8")).oauth_token;
  }
  return cfg.oauth_token;
}

const daysArg = Number(process.argv[2] || 7);
const days = Number.isFinite(daysArg) && daysArg > 0 ? Math.min(daysArg, 30) : 7;
const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
const until = new Date().toISOString().slice(0, 10);

const query = `query {
  viewer {
    accounts(filter: { accountTag: "${ACCOUNT_ID}" }) {
      rumPageloadEventsAdaptiveGroups(
        limit: 20
        orderBy: [count_DESC]
        filter: { date_geq: "${since}", date_leq: "${until}", siteTag: "${SITE_TAG}", requestHost: "${HOST}" }
      ) {
        count
        sum { visits }
        dimensions { countryName refererHost requestPath }
      }
    }
    zones(filter: { zoneTag: "${ZONE_ID}" }) {
      httpRequests1dGroups(
        limit: ${days}
        orderBy: [date_ASC]
        filter: { date_geq: "${since}", date_leq: "${until}" }
      ) {
        dimensions { date }
        sum { requests bytes pageViews }
        uniq { uniques }
      }
    }
  }
}`;

const token = getToken();
const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query }),
});

const json = await res.json();
if (!res.ok || json.errors?.length) {
  console.error("GraphQL error:", JSON.stringify(json.errors || json, null, 2));
  process.exit(1);
}

const rumRows = json.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
const httpRows = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups || [];

const totalRumPageviews = rumRows.reduce((acc, r) => acc + (r.count || 0), 0);
const totalRumVisits = rumRows.reduce((acc, r) => acc + (r.sum?.visits || 0), 0);

console.log(`\n=== ${HOST} — Last ${days} days (${since} to ${until}) ===\n`);
console.log(`Web Analytics (RUM): ${totalRumVisits} visits | ${totalRumPageviews} pageviews`);

if (rumRows.length > 0) {
  console.log("\nTop RUM breakdown (path / referrer / country):");
  console.table(
    rumRows.map((r) => ({
      path: r.dimensions?.requestPath || "/",
      referrer: r.dimensions?.refererHost || "(direct)",
      country: r.dimensions?.countryName || "?",
      visits: r.sum?.visits ?? 0,
      views: r.count ?? 0,
    }))
  );
} else {
  console.log("(No RUM beacon events recorded yet — new visits will appear shortly after deployment.)");
}

console.log("\nZone HTTP traffic (gdd.moe):");
if (httpRows.length > 0) {
  console.table(
    httpRows.map((r) => ({
      date: r.dimensions?.date,
      uniques: r.uniq?.uniques ?? 0,
      pageViews: r.sum?.pageViews ?? 0,
      requests: r.sum?.requests ?? 0,
      kb: Math.round((r.sum?.bytes ?? 0) / 1024),
    }))
  );
} else {
  console.log("(No zone HTTP rows yet.)");
}
