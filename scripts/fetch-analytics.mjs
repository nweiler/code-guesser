#!/usr/bin/env node

import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GA_PROPERTY_ID;
const credentialsRaw = process.env.GA_CREDENTIALS;

if (!propertyId) {
  console.error("GA_PROPERTY_ID env var required (the numeric GA4 property ID, e.g. 123456789)");
  process.exit(1);
}
if (!credentialsRaw) {
  console.error("GA_CREDENTIALS env var required (JSON string of your GCP service account key)");
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(credentialsRaw);
} catch {
  console.error("GA_CREDENTIALS must be valid JSON");
  process.exit(1);
}

const client = new BetaAnalyticsDataClient({ credentials });

const range = process.argv[2] || "7daysAgo";

async function runReport(name, dimensions, metrics, orderBy) {
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: range, endDate: "today" }],
    dimensions: dimensions.map((d) => ({ name: d })),
    metrics: metrics.map((m) => ({ name: m })),
    ...(orderBy ? { orderBys: [{ dimension: { dimensionName: orderBy }, desc: true }] } : {}),
    limit: 20,
  });

  return response.rows?.map((row) => {
    const entry = {};
    row.dimensionValues.forEach((v, i) => (entry[dimensions[i]] = v.value));
    row.metricValues.forEach((v, i) => (entry[metrics[i]] = v.value));
    return entry;
  }) || [];
}

function fmt(n) {
  const v = Number(n);
  return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`;
}

async function main() {
  const label = range === "today" ? "Today" : `Last ${range.replace(/[a-z]/g, "")} days`;
  console.log(`\n=== CodeGuesser Analytics — ${label} ===\n`);

  // 1. Daily snapshot
  const daily = await runReport("Daily", ["date"], ["activeUsers", "screenPageViews", "sessions"]);
  const totals = { users: 0, pageViews: 0, sessions: 0 };
  for (const d of daily) {
    totals.users += Number(d.activeUsers);
    totals.pageViews += Number(d.screenPageViews);
    totals.sessions += Number(d.sessions);
  }
  const days = daily.length || 1;
  console.log(`  Active users:     ${fmt(totals.users)}  (${fmt(Math.round(totals.users / days))}/day avg)`);
  console.log(`  Page views:       ${fmt(totals.pageViews)}`);
  console.log(`  Sessions:         ${fmt(totals.sessions)}`);
  console.log();

  // 2. Top pages
  console.log("  Top pages:");
  const pages = await runReport("Pages", ["pagePath", "pageTitle"], ["screenPageViews"], "screenPageViews");
  for (const p of pages.slice(0, 8)) {
    const path = p.pagePath.padEnd(30);
    console.log(`    ${path} ${fmt(p.screenPageViews)} views`);
  }
  console.log();

  // 3. Top referrers
  console.log("  Top referrers:");
  const refs = await runReport("Referrers", ["sessionSource", "sessionMedium"], ["sessions"], "sessions");
  for (const r of refs.slice(0, 6)) {
    const src = `${r.sessionSource} / ${r.sessionMedium}`.padEnd(30);
    console.log(`    ${src} ${fmt(r.sessions)} sessions`);
  }
  console.log();

  // 4. Device breakdown
  const devices = await runReport("Devices", ["deviceCategory"], ["activeUsers", "screenPageViews"]);
  console.log("  Devices:");
  for (const d of devices) {
    const cat = (d.deviceCategory || "unknown").padEnd(12);
    console.log(`    ${cat} ${fmt(d.activeUsers)} users, ${fmt(d.screenPageViews)} views`);
  }
  console.log();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
