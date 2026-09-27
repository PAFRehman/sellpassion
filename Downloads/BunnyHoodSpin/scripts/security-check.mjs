import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const skipped = new Set([".git", ".next", "node_modules"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".sql", ".example", ".gs"]);

function filesIn(directory) {
  return readdirSync(directory).flatMap((name) => {
    if (skipped.has(name)) return [];
    const path = join(directory, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

const files = filesIn(root).filter((path) => {
  const name = path.slice(path.lastIndexOf("/"));
  const extension = path.slice(path.lastIndexOf("."));
  return name === "/.env.example" || textExtensions.has(extension);
});
const source = files.map((path) => `\nFILE:${relative(root, path)}\n${readFileSync(path, "utf8")}`).join("\n");
const migration = readFileSync(join(root, "db/migrations/001_spin_wheel.sql"), "utf8");
const wheel = readFileSync(join(root, "lib/spin/wheel.ts"), "utf8");
const campaigns = readFileSync(join(root, "lib/spin/campaigns.ts"), "utf8");
const xIntegration = readFileSync(join(root, "lib/spin/x.ts"), "utf8");
const xStart = readFileSync(join(root, "app/api/spin/auth/x/start/route.ts"), "utf8");
const failures = [];

if (/NEXT_PUBLIC_(?:X_|DATABASE|TOKEN_|CODE_|PRIZE_|RATE_|ADMIN_|CRON_|GOOGLE_)/.test(source)) {
  failures.push("A private environment variable was exposed with NEXT_PUBLIC_.");
}
if (/script\.google\.com\/macros\/s\/(?!REPLACE_ME)[A-Za-z0-9_-]{20,}\/exec/.test(source)) {
  failures.push("A real Google Apps Script URL appears in tracked source.");
}
if (!/total_wins between 0 and 3/.test(migration)) failures.push("Three-win database constraint is missing.");
if (!/spin_wins_wallet_lower_unique/.test(migration)) failures.push("Global wallet uniqueness is missing.");
if (!/unique \(user_id, campaign_id, task_type\)/.test(migration)) failures.push("Task claim uniqueness is missing.");
if (!/create table if not exists spin_task_starts/.test(migration)) failures.push("Server-backed task timers are missing.");
if (!/interval '5 seconds'/.test(campaigns)) failures.push("Five-second task enforcement is missing.");
if (/liked_tweets|referenced_tweets|tasks\/verify|verifyOnX/.test(`${campaigns}\n${xIntegration}`)) failures.push("Paid X task verification code is still present.");
if (/like\.read|offline\.access/.test(xStart)) failures.push("Unneeded X task-verification scopes are still requested.");
if (!/unique \(user_id, campaign_id\)/.test(migration)) failures.push("Code redemption uniqueness is missing.");
if (!/randomInt\(10, 21\)/.test(wheel)) failures.push("Secure 10–20 code-spin allocation is missing.");
if (!/\{ type: "GTD", count: 15 \}/.test(wheel)) failures.push("Daily GTD inventory is incorrect.");
if (!/\{ type: "FCFS1", count: 20 \}/.test(wheel)) failures.push("Daily FCFS1 inventory is incorrect.");
if (!/\{ type: "FCFS2", count: 30 \}/.test(wheel)) failures.push("Daily FCFS2 inventory is incorrect.");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log("Security invariants and secret-boundary checks passed.");
