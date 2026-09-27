"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Dashboard = {
  campaign: null | {
    id: string;
    title: string;
    tweetUrl: string;
    startsAt: string;
    endsAt: string;
    roundNumber: number;
    expectedUsers: number;
    expectedSpinsPerUser: number;
  };
  totals: { users: number; spins: number; wins: number; pending_wallets: number; referrals: number };
  inventory: Array<{ prize_type: string; claimed: number; total: number }>;
  sheetSyncPending: number;
};

async function adminRequest<T>(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (init?.method === "POST") headers.set("content-type", "application/json");
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & { error?: string; code?: string };
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    Object.assign(error, { code: data.code, status: response.status });
    throw error;
  }
  return data;
}

export function SpinAdminApp() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("Bunny Hood 20-Day Drop");
  const [tweetUrl, setTweetUrl] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [expectedUsers, setExpectedUsers] = useState("500");
  const [gtdCount, setGtdCount] = useState("15");
  const [fcfs1Count, setFcfs1Count] = useState("20");
  const [fcfs2Count, setFcfs2Count] = useState("30");
  const [startNewCampaign, setStartNewCampaign] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      const data = await adminRequest<Dashboard>("/api/admin/spin/dashboard");
      setDashboard(data);
      setNeedsLogin(false);
    } catch (error) {
      const status = (error as Error & { status?: number }).status;
      if (status === 401) setNeedsLogin(true);
      else setMessage(error instanceof Error ? error.message : "Dashboard could not be loaded.");
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadDashboard]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await adminRequest("/api/admin/spin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Admin sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await adminRequest("/api/admin/spin/campaign", {
        method: "POST",
        body: JSON.stringify({
          title,
          tweetUrl,
          redeemCode,
          endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
          expectedUsers: Number(expectedUsers),
          gtdCount: Number(gtdCount),
          fcfs1Count: Number(fcfs1Count),
          fcfs2Count: Number(fcfs2Count),
          startNewCampaign: !dashboard?.campaign || startNewCampaign,
        }),
      });
      setTweetUrl("");
      setRedeemCode("");
      setEndsAt("");
      setStartNewCampaign(false);
      setMessage(startNewCampaign || !dashboard?.campaign
        ? "New 20-day campaign is live with its private prize pool."
        : "New daily round is live. Task and code eligibility reset without resetting the 20-day prize pool.");
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Campaign could not be published.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await adminRequest("/api/admin/spin/logout", { method: "POST", body: "{}" }).catch(() => undefined);
    setDashboard(null);
    setNeedsLogin(true);
  }

  if (needsLogin) {
    return (
      <main className="spin-admin-page">
        <div className="spin-admin-shell">
          <div className="spin-admin-brand"><strong>BUNNY HOOD · SPIN ADMIN</strong><a href="/SpinTheWheel">Open wheel</a></div>
          <section className="admin-login">
            <div className="admin-card">
              <p className="section-kicker">PRIVATE CONTROL ROOM</p>
              <h1>Admin sign in.</h1>
              <p>Publish a new tweet and redeem code without exposing either backend credential or Google Sheet URL.</p>
              <form onSubmit={login}>
                <div className="admin-field"><label htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" /></div>
                <button className="admin-submit" disabled={busy}>{busy ? "Checking…" : "Enter control room"}</button>
              </form>
              {message && <p className="spin-error">{message}</p>}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!dashboard) return <main className="spin-admin-page"><div className="spin-loading">Loading control room…</div></main>;

  return (
    <main className="spin-admin-page">
      <div className="spin-admin-shell">
        <div className="spin-admin-brand"><strong>BUNNY HOOD · SPIN ADMIN</strong><div><a href="/SpinTheWheel">Open wheel</a><button onClick={logout} type="button">Sign out</button></div></div>
        <section className="admin-dashboard">
          <header><div><p className="section-kicker">PRIVATE CONTROL ROOM</p><h1>Run the<br /><em>campaign.</em></h1></div><p>Private inventory · paced server draw</p></header>
          <div className="admin-stats">
            <div><span>UNIQUE X USERS</span><strong>{Number(dashboard.totals.users)}</strong></div>
            <div><span>SPINS USED</span><strong>{Number(dashboard.totals.spins)}</strong></div>
            <div><span>TOTAL WINS</span><strong>{Number(dashboard.totals.wins)}</strong></div>
            <div><span>SUCCESSFUL REFERRALS</span><strong>{Number(dashboard.totals.referrals)}</strong></div>
            <div><span>WAITING FOR WALLET</span><strong>{Number(dashboard.totals.pending_wallets)}</strong></div>
          </div>
          <div className="admin-grid">
            <section className="admin-panel">
              <h2>Current campaign</h2>
              {dashboard.campaign ? (
                <div className="admin-campaign-data">
                  <div><span>Title</span><strong>{dashboard.campaign.title}</strong></div>
                  <div><span>Tweet</span><strong>{dashboard.campaign.tweetUrl.replace(/^https:\/\//, "")}</strong></div>
                  <div><span>Expected users</span><strong>{Number(dashboard.campaign.expectedUsers)}</strong></div>
                  <div><span>20-day spins per user</span><strong>{Number(dashboard.campaign.expectedSpinsPerUser)}</strong></div>
                  <div><span>Current daily round</span><strong>#{Number(dashboard.campaign.roundNumber)}</strong></div>
                  <div><span>Ends</span><strong>{new Date(dashboard.campaign.endsAt).toLocaleString()}</strong></div>
                  {dashboard.inventory.map((item) => <div key={item.prize_type}><span>{item.prize_type}</span><strong>{Number(item.claimed)} / {Number(item.total)} claimed</strong></div>)}
                  <div><span>Sheet sync queue</span><strong>{dashboard.sheetSyncPending}</strong></div>
                </div>
              ) : <p className="admin-note">No live campaign. Publish one using the form.</p>}
              <p className="admin-note">Daily updates reset task and code eligibility but preserve this campaign&apos;s private prize pool and end date. Prize totals and draw pacing remain private.</p>
            </section>
            <section className="admin-panel">
              <h2>Publish new campaign</h2>
              <form onSubmit={publish}>
                <div className="admin-field"><label htmlFor="campaign-title">Campaign title</label><input id="campaign-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required /></div>
                <div className="admin-field"><label htmlFor="campaign-tweet">Full X post URL</label><input id="campaign-tweet" type="url" value={tweetUrl} onChange={(event) => setTweetUrl(event.target.value)} placeholder="https://x.com/BunnysHood/status/..." required /></div>
                <div className="admin-field"><label htmlFor="campaign-code">New redeem code</label><input id="campaign-code" value={redeemCode} onChange={(event) => setRedeemCode(event.target.value)} minLength={4} maxLength={64} placeholder="BUNNY-XXXX" required autoComplete="off" /></div>
                {dashboard.campaign && (
                  <label className="admin-new-campaign-toggle">
                    <input type="checkbox" checked={startNewCampaign} onChange={(event) => setStartNewCampaign(event.target.checked)} />
                    <span><strong>Start a completely new 20-day campaign</strong><small>Leave off for the normal daily tweet/code update. Turning this on replaces the current prize pool.</small></span>
                  </label>
                )}
                <div className="admin-field"><label htmlFor="campaign-users">Expected connected users</label><input id="campaign-users" type="number" min="10" max="1000000" value={expectedUsers} onChange={(event) => setExpectedUsers(event.target.value)} disabled={Boolean(dashboard.campaign) && !startNewCampaign} required /></div>
                <div className="admin-prize-grid">
                  <div className="admin-field"><label htmlFor="campaign-gtd">Total GTD</label><input id="campaign-gtd" type="number" min="1" max="100000" value={gtdCount} onChange={(event) => setGtdCount(event.target.value)} disabled={Boolean(dashboard.campaign) && !startNewCampaign} required /></div>
                  <div className="admin-field"><label htmlFor="campaign-fcfs1">Total FCFS1</label><input id="campaign-fcfs1" type="number" min="1" max="100000" value={fcfs1Count} onChange={(event) => setFcfs1Count(event.target.value)} disabled={Boolean(dashboard.campaign) && !startNewCampaign} required /></div>
                  <div className="admin-field"><label htmlFor="campaign-fcfs2">Total FCFS2</label><input id="campaign-fcfs2" type="number" min="1" max="100000" value={fcfs2Count} onChange={(event) => setFcfs2Count(event.target.value)} disabled={Boolean(dashboard.campaign) && !startNewCampaign} required /></div>
                </div>
                <div className="admin-field"><label htmlFor="campaign-end">Optional end time (new campaigns default to 20 days)</label><input id="campaign-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} disabled={Boolean(dashboard.campaign) && !startNewCampaign} /></div>
                <button className="admin-submit" disabled={busy}>{busy ? "Publishing…" : dashboard.campaign && !startNewCampaign ? "Publish daily update" : "Start 20-day campaign"}</button>
              </form>
            </section>
          </div>
          {message && <div className="spin-message">{message}</div>}
        </section>
      </div>
    </main>
  );
}
