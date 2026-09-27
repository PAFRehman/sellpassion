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
const migration = [
  "001_spin_wheel.sql",
  "002_click_task_timer.sql",
  "003_referrals_fair_campaigns.sql",
].map((name) => readFileSync(join(root, "db/migrations", name), "utf8")).join("\n");
const wheel = readFileSync(join(root, "lib/spin/wheel.ts"), "utf8");
const campaigns = readFileSync(join(root, "lib/spin/campaigns.ts"), "utf8");
const users = readFileSync(join(root, "lib/spin/users.ts"), "utf8");
const wheelApp = readFileSync(join(root, "app/SpinTheWheel/spin-wheel-app.tsx"), "utf8");
const adminApp = readFileSync(join(root, "app/admin/spin/spin-admin-app.tsx"), "utf8");
const xIntegration = readFileSync(join(root, "lib/spin/x.ts"), "utf8");
const xStart = readFileSync(join(root, "app/api/spin/auth/x/start/route.ts"), "utf8");
const failures = [];

if (/NEXT_PUBLIC_(?:X_|DATABASE|TOKEN_|CODE_|PRIZE_|RATE_|ADMIN_|CRON_|GOOGLE_)/.test(source)) {
  failures.push("A private environment variable was exposed with NEXT_PUBLIC_.");
}
if (/script\.google\.com\/macros\/s\/(?!REPLACE_ME)[A-Za-z0-9_-]{20,}\/exec/.test(source)) {
  failures.push("A real Google Apps Script URL appears in tracked source.");
}
if (!/total_wins between 0 and 9/.test(migration)) failures.push("Nine-win database constraint is missing.");
if (!/enforce_spin_win_role_cap/.test(migration)) failures.push("Three-per-role database enforcement is missing.");
if (!/spin_wins_wallet_lower_unique/.test(migration)) failures.push("Global wallet uniqueness is missing.");
if (!/spin_campaign_rounds/.test(migration)) failures.push("Daily campaign rounds are missing.");
if (!/round_number integer not null check \(round_number between 1 and 20\)/.test(migration) || !/roundNumber > 20/.test(campaigns)) failures.push("Twenty-round campaign cap is missing.");
if (!/campaign_version integer not null default 1/.test(migration) || !/campaign_version = 2/.test(campaigns)) failures.push("Legacy campaign isolation is missing.");
if (!/unique \(user_id, round_id, task_type\)/.test(migration)) failures.push("Per-round task claim uniqueness is missing.");
if (!/create table if not exists spin_task_starts/.test(migration)) failures.push("Server-backed task timers are missing.");
if (!/interval '5 seconds'/.test(campaigns)) failures.push("Five-second task enforcement is missing.");
if (!/startCampaignTask/.test(campaigns) || !/scheduleTaskRecovery/.test(wheelApp)) failures.push("One-click automatic task completion is missing.");
if (/liked_tweets|referenced_tweets|tasks\/verify|verifyOnX/.test(`${campaigns}\n${xIntegration}`)) failures.push("Paid X task verification code is still present.");
if (/like\.read|offline\.access/.test(xStart)) failures.push("Unneeded X task-verification scopes are still requested.");
if (!/unique \(user_id, round_id\)/.test(migration)) failures.push("Per-round code redemption uniqueness is missing.");
if (!/randomInt\(10, 21\)/.test(wheel)) failures.push("Secure 10–20 code-spin allocation is missing.");
if (!/create table if not exists spin_campaign_prizes/.test(migration)) failures.push("Private campaign prize inventory is missing.");
if (!/expected_users integer not null default 500/.test(migration)) failures.push("Five-hundred-user campaign pacing is missing.");
if (!/expected_spins_per_user integer not null default 360/.test(migration) || !/\$\{expectedUsers\}, 360, 2/.test(campaigns)) failures.push("Twenty-round spin pacing is missing.");
if (!/20 \* 24 \* 60 \* 60 \* 1000/.test(campaigns)) failures.push("Twenty-day campaign default is missing.");
if (!/0\.5 \*\*/.test(wheel)) failures.push("Repeat-role probability reduction is missing.");
if (!/paceProjection/.test(wheel) || !/paceConfidence/.test(wheel)) failures.push("Turnout-adaptive campaign pacing is missing.");
if (!/spin_batches/.test(migration) || !/playSpins/.test(wheel)) failures.push("Idempotent batch spinning is missing.");
if (!/spin_referrals/.test(migration) || !/awarded_spins integer not null default 3/.test(migration)) failures.push("Three-spin referral rewards are missing.");
if (!/spin_referral_codes/.test(migration) || !/from spin_referral_codes/.test(users)) failures.push("Persistent referral-link aliases are missing.");
if (!/applyNewUserReferral/.test(`${users}\n${xIntegration}`)) failures.push("New-user referral attribution is missing.");
if (!/Share referral link on X/.test(wheelApp) || !/Share win on X/.test(wheelApp)) failures.push("X referral and win sharing are missing.");
if (!/xShareUrl\([\s\S]{0,180}referralLink/.test(wheelApp)) failures.push("Referral links are not attached to X shares.");
if (/GTD LEFT|FCFS1 LEFT|FCFS2 LEFT|Daily prize inventory/.test(wheelApp)) failures.push("Private prize counts are exposed in the public UI.");
if (!/Total GTD/.test(adminApp) || !/Expected connected users/.test(adminApp)) failures.push("Admin campaign controls are incomplete.");

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log("Security invariants and secret-boundary checks passed.");
