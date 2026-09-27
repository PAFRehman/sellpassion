"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Dashboard = {
  campaign: null | {
    id: string;
    title: string;
    tweetUrl: string;
    startsAt: string;
    endsAt: string;
  };
  totals: { users: number; spins: number; wins: number; pending_wallets: number };
  inventory: Array<{ prize_type: string; claimed: number; total: number }>;
  sheetSyncPending: number;
  prizeDay: string;
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
  const [title, setTitle] = useState("Bunny Hood Daily Drop");
  const [tweetUrl, setTweetUrl] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [endsAt, setEndsAt] = useState("");
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
        }),
      });
      setTweetUrl("");
      setRedeemCode("");
      setEndsAt("");
      setMessage("New campaign is live. Every user can complete the three tasks and redeem this code once.");
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
          <header><div><p className="section-kicker">PRIVATE CONTROL ROOM</p><h1>Run today’s<br /><em>drop.</em></h1></div><p>{dashboard.prizeDay} · UTC prize day</p></header>
          <div className="admin-stats">
            <div><span>CONNECTED USERS</span><strong>{Number(dashboard.totals.users)}</strong></div>
            <div><span>SPINS USED</span><strong>{Number(dashboard.totals.spins)}</strong></div>
            <div><span>TOTAL WINS</span><strong>{Number(dashboard.totals.wins)}</strong></div>
            <div><span>WAITING FOR WALLET</span><strong>{Number(dashboard.totals.pending_wallets)}</strong></div>
          </div>
          <div className="admin-grid">
            <section className="admin-panel">
              <h2>Current campaign</h2>
              {dashboard.campaign ? (
                <div className="admin-campaign-data">
                  <div><span>Title</span><strong>{dashboard.campaign.title}</strong></div>
                  <div><span>Tweet</span><strong>{dashboard.campaign.tweetUrl.replace(/^https:\/\//, "")}</strong></div>
                  <div><span>Ends</span><strong>{new Date(dashboard.campaign.endsAt).toLocaleString()}</strong></div>
                  {dashboard.inventory.map((item) => <div key={item.prize_type}><span>{item.prize_type}</span><strong>{Number(item.claimed)} / {Number(item.total)} claimed</strong></div>)}
                  <div><span>Sheet sync queue</span><strong>{dashboard.sheetSyncPending}</strong></div>
                </div>
              ) : <p className="admin-note">No live campaign. Publish one using the form.</p>}
              <p className="admin-note">The redeem code is stored only as a one-way hash. It cannot be viewed after publishing.</p>
            </section>
            <section className="admin-panel">
              <h2>Publish new campaign</h2>
              <form onSubmit={publish}>
                <div className="admin-field"><label htmlFor="campaign-title">Campaign title</label><input id="campaign-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required /></div>
                <div className="admin-field"><label htmlFor="campaign-tweet">Full X post URL</label><input id="campaign-tweet" type="url" value={tweetUrl} onChange={(event) => setTweetUrl(event.target.value)} placeholder="https://x.com/BunnysHood/status/..." required /></div>
                <div className="admin-field"><label htmlFor="campaign-code">New redeem code</label><input id="campaign-code" value={redeemCode} onChange={(event) => setRedeemCode(event.target.value)} minLength={4} maxLength={64} placeholder="BUNNY-XXXX" required autoComplete="off" /></div>
                <div className="admin-field"><label htmlFor="campaign-end">Optional end time (defaults to 24 hours)</label><input id="campaign-end" type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} /></div>
                <button className="admin-submit" disabled={busy}>{busy ? "Publishing…" : "Publish and reset eligibility"}</button>
              </form>
            </section>
          </div>
          {message && <div className="spin-message">{message}</div>}
        </section>
      </div>
    </main>
  );
}
