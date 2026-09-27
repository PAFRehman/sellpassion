"use client";

import { FormEvent, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TaskType = "like" | "repost" | "comment";
type PrizeType = "GTD" | "FCFS1" | "FCFS2";

type WheelState = {
  authenticated: boolean;
  user?: {
    id: string;
    xUserId: string;
    xUsername: string;
    xName: string;
    spinsAvailable: number;
    spinsUsed: number;
    points: number;
    totalWins: number;
  };
  campaign: null | {
    id: string;
    title: string;
    tweetUrl: string;
    startsAt: string;
    endsAt: string;
  };
  claimedTasks?: TaskType[];
  taskStarts?: Array<{ taskType: TaskType; readyAt: string }>;
  codeRedemption?: null | { awardedSpins: number };
  inventory: Array<{ prize_type: PrizeType; claimed: number; total: number }>;
  wins?: Array<{
    id: string;
    prizeType: PrizeType;
    wonAt: string;
    wallet: string | null;
    walletSubmittedAt: string | null;
  }>;
};

type ApiError = { error?: string; code?: string };

const TASKS: Array<{ id: TaskType; eyebrow: string; title: string; copy: string }> = [
  { id: "like", eyebrow: "01 · SUPPORT", title: "Like the post", copy: "Open today’s Bunny Hood post. This task completes automatically after five seconds." },
  { id: "repost", eyebrow: "02 · SHARE", title: "Repost it", copy: "Open the campaign post and repost it. Your spin is added automatically after five seconds." },
  { id: "comment", eyebrow: "03 · SPEAK", title: "Leave a comment", copy: "Open the campaign post and leave a reply. The five-second timer handles completion." },
];

type TaskTimer = { intervalId: number; claimId: number };

const SEGMENTS: Array<{ label: string; result: PrizeType | "NONE" }> = [
  { label: "GTD", result: "GTD" },
  { label: "KEEP GOING", result: "NONE" },
  { label: "FCFS2", result: "FCFS2" },
  { label: "KEEP GOING", result: "NONE" },
  { label: "FCFS1", result: "FCFS1" },
  { label: "KEEP GOING", result: "NONE" },
  { label: "GTD", result: "GTD" },
  { label: "KEEP GOING", result: "NONE" },
  { label: "FCFS2", result: "FCFS2" },
  { label: "KEEP GOING", result: "NONE" },
  { label: "FCFS1", result: "FCFS1" },
  { label: "KEEP GOING", result: "NONE" },
];

function readCsrfCookie() {
  const item = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("bh_spin_csrf="));
  return item ? decodeURIComponent(item.slice("bh_spin_csrf=".length)) : "";
}

async function requestJson<T>(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (init?.method && init.method !== "GET") {
    headers.set("content-type", "application/json");
    headers.set("x-csrf-token", readCsrfCookie());
  }
  const response = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({})) as T & ApiError;
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function inventoryFor(state: WheelState | null, type: PrizeType) {
  const item = state?.inventory.find((entry) => entry.prize_type === type);
  return item ? { claimed: Number(item.claimed), total: Number(item.total) } : { claimed: 0, total: type === "GTD" ? 15 : type === "FCFS1" ? 20 : 30 };
}

function WalletForm({ winId, onSaved }: { winId: string; onSaved: () => Promise<void> }) {
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await requestJson(`/api/spin/wins/${winId}/wallet`, {
        method: "POST",
        body: JSON.stringify({ wallet }),
      });
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Wallet could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="win-wallet-form" onSubmit={submit}>
      <label htmlFor={`wallet-${winId}`}>Submit a new wallet for this win</label>
      <div>
        <input
          id={`wallet-${winId}`}
          value={wallet}
          onChange={(event) => setWallet(event.target.value)}
          placeholder="0x..."
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button disabled={busy}>{busy ? "Saving…" : "Lock wallet"}</button>
      </div>
      <small>This wallet becomes permanent and cannot be changed. Every win must use a different wallet.</small>
      {message && <p className="spin-error">{message}</p>}
    </form>
  );
}

export function SpinWheelApp() {
  const [state, setState] = useState<WheelState | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [taskSeconds, setTaskSeconds] = useState<Partial<Record<TaskType, number>>>({});
  const [taskWorking, setTaskWorking] = useState<Partial<Record<TaskType, boolean>>>({});
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<PrizeType | "NONE" | null>(null);
  const revealTimer = useRef<number | null>(null);
  const taskTimers = useRef<Partial<Record<TaskType, TaskTimer>>>({});

  const loadState = useCallback(async () => {
    try {
      const next = await requestJson<WheelState>("/api/spin/state");
      setState(next);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Spin data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timers = taskTimers.current;
    const initialLoad = window.setTimeout(() => void loadState(), 0);
    return () => {
      window.clearTimeout(initialLoad);
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
      for (const timer of Object.values(timers)) {
        if (!timer) continue;
        window.clearInterval(timer.intervalId);
        window.clearTimeout(timer.claimId);
      }
    };
  }, [loadState]);

  const claimed = useMemo(() => new Set(state?.claimedTasks ?? []), [state?.claimedTasks]);
  const gtd = inventoryFor(state, "GTD");
  const fcfs1 = inventoryFor(state, "FCFS1");
  const fcfs2 = inventoryFor(state, "FCFS2");

  const clearTaskTimer = useCallback((task: TaskType) => {
    const timer = taskTimers.current[task];
    if (timer) {
      window.clearInterval(timer.intervalId);
      window.clearTimeout(timer.claimId);
      delete taskTimers.current[task];
    }
    setTaskSeconds((current) => {
      const next = { ...current };
      delete next[task];
      return next;
    });
  }, []);

  const claimStartedTask = useCallback(async (task: TaskType) => {
    clearTaskTimer(task);
    setTaskWorking((current) => ({ ...current, [task]: true }));
    setMessage("");
    try {
      await requestJson("/api/spin/tasks/claim", {
        method: "POST",
        body: JSON.stringify({ task }),
      });
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task spin could not be added.");
    } finally {
      setTaskWorking((current) => ({ ...current, [task]: false }));
    }
  }, [clearTaskTimer, loadState]);

  const scheduleTaskClaim = useCallback((task: TaskType, readyAt: string) => {
    if (taskTimers.current[task]) return;
    const readyTime = new Date(readyAt).getTime();
    if (!Number.isFinite(readyTime)) return;

    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((readyTime - Date.now()) / 1000));
      setTaskSeconds((current) => ({ ...current, [task]: seconds }));
    };
    const intervalId = window.setInterval(updateCountdown, 250);
    const claimId = window.setTimeout(
      () => void claimStartedTask(task),
      Math.max(0, readyTime - Date.now()) + 300,
    );
    taskTimers.current[task] = { intervalId, claimId };
    window.setTimeout(updateCountdown, 0);
  }, [claimStartedTask]);

  useEffect(() => {
    for (const start of state?.taskStarts ?? []) {
      if (!claimed.has(start.taskType)) scheduleTaskClaim(start.taskType, start.readyAt);
    }
  }, [claimed, scheduleTaskClaim, state?.taskStarts]);

  async function startTask(task: TaskType) {
    if (!state?.campaign || claimed.has(task) || taskTimers.current[task]) return;
    window.open(state.campaign.tweetUrl, "_blank", "noopener,noreferrer");
    setTaskWorking((current) => ({ ...current, [task]: true }));
    setMessage("");
    try {
      const reply = await requestJson<{ alreadyClaimed: boolean; readyAt: string }>("/api/spin/tasks/start", {
        method: "POST",
        body: JSON.stringify({ task }),
      });
      if (reply.alreadyClaimed) {
        await loadState();
      } else {
        scheduleTaskClaim(task, reply.readyAt);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task timer could not start.");
    } finally {
      setTaskWorking((current) => ({ ...current, [task]: false }));
    }
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedeeming(true);
    setMessage("");
    try {
      const reply = await requestJson<{ awardedSpins: number }>("/api/spin/redeem", {
        method: "POST",
        body: JSON.stringify({ code: redeemCode }),
      });
      setMessage(`${reply.awardedSpins} spins added to your profile.`);
      setRedeemCode("");
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Code could not be redeemed.");
    } finally {
      setRedeeming(false);
    }
  }

  async function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    setMessage("");
    try {
      const reply = await requestJson<{ result: PrizeType | "NONE" }>("/api/spin/play", {
        method: "POST",
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID() }),
      });
      const candidates = SEGMENTS.map((segment, index) => ({ segment, index }))
        .filter((item) => item.segment.result === reply.result);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? { index: 1 };
      const centerAngle = chosen.index * 30 + 15;
      const normalized = ((rotation % 360) + 360) % 360;
      const target = rotation + 5 * 360 + ((360 - centerAngle - normalized + 360) % 360);
      setRotation(target);
      revealTimer.current = window.setTimeout(async () => {
        setResult(reply.result);
        setSpinning(false);
        await loadState();
      }, 4400);
    } catch (error) {
      setSpinning(false);
      setMessage(error instanceof Error ? error.message : "The wheel could not spin.");
    }
  }

  async function logout() {
    try {
      await requestJson("/api/spin/auth/logout", { method: "POST", body: "{}" });
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign out failed.");
    }
  }

  return (
    <>
      <section className="spin-hero">
        <div className="spin-grid" />
        <div className="spin-hero-copy">
          <p className="section-kicker"><span className="live-dot" /> DAILY HOOD REWARDS</p>
          <h1>SPIN<br /><em>THE HOOD.</em></h1>
          <p>Connect X, open today’s five-second tasks, redeem the live code, and use every earned spin for a chance at GTD or FCFS.</p>
          <div className="daily-prize-strip" aria-label="Daily prize inventory">
            <div><strong>{gtd.total - gtd.claimed}</strong><span>GTD LEFT</span></div>
            <div><strong>{fcfs1.total - fcfs1.claimed}</strong><span>FCFS1 LEFT</span></div>
            <div><strong>{fcfs2.total - fcfs2.claimed}</strong><span>FCFS2 LEFT</span></div>
          </div>
        </div>
        <div className="hero-mini-wheel" aria-hidden="true"><i /><i /><i /><b>BH</b></div>
      </section>

      <section className="spin-console">
        {loading && <div className="spin-loading">Loading the Hood…</div>}
        {!loading && !state?.authenticated && (
          <div className="connect-panel">
            <div>
              <p className="section-kicker">ONE ACCOUNT · SAVED FOREVER</p>
              <h2>Connect your<br /><em>X profile.</em></h2>
              <p>Your X ID is the permanent account key. Returning users instantly recover points, spins, wins, and pending wallet submissions.</p>
            </div>
            <a className="x-connect-button" href="/api/spin/auth/x/start"><span>Connect X</span><b>X</b></a>
          </div>
        )}

        {!loading && state?.authenticated && state.user && (
          <>
            <div className="profile-bar">
              <div><span>CONNECTED AS</span><strong>@{state.user.xUsername}</strong></div>
              <div><span>SPINS LEFT</span><strong>{state.user.spinsAvailable}</strong></div>
              <div><span>POINTS</span><strong>{state.user.points}</strong></div>
              <div><span>WINS</span><strong>{state.user.totalWins}/3</strong></div>
              <button type="button" onClick={logout}>Disconnect</button>
            </div>

            {!state.campaign && <div className="no-campaign"><span>THE WHEEL IS RESTING</span><h2>Next campaign<br /><em>coming soon.</em></h2><p>Your profile and balances are saved. Return when the next tweet and code go live.</p></div>}

            {state.campaign && (
              <>
                <section className="daily-campaign">
                  <header>
                    <div><p className="section-kicker">TODAY’S CAMPAIGN</p><h2>{state.campaign.title}</h2></div>
                    <a href={state.campaign.tweetUrl} target="_blank" rel="noreferrer">Open post <span aria-hidden="true">X</span></a>
                  </header>
                  <div className="spin-task-list">
                    {TASKS.map((task) => (
                      <article className={claimed.has(task.id) ? "claimed" : ""} key={task.id}>
                        <div><span>{task.eyebrow}</span><h3>{task.title}</h3><p>{task.copy}</p></div>
                        <div className="spin-task-actions">
                          <button
                            type="button"
                            disabled={claimed.has(task.id) || taskWorking[task.id] || taskSeconds[task.id] !== undefined}
                            onClick={() => startTask(task.id)}
                          >
                            {claimed.has(task.id)
                              ? "Completed · +1 spin"
                              : taskWorking[task.id]
                                ? "Adding spin…"
                                : taskSeconds[task.id] !== undefined
                                  ? `Auto-completes in ${taskSeconds[task.id]}s`
                                  : "Open task · +1 spin"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="code-and-wheel">
                  <div className="redeem-panel">
                    <p className="section-kicker">DAILY CODE DROP</p>
                    <h2>Unlock<br /><em>10–20 spins.</em></h2>
                    <p>Each campaign code can be redeemed once per connected X account. Every new campaign opens a fresh redemption.</p>
                    {state.codeRedemption ? (
                      <div className="redeemed-code"><span>CODE REDEEMED</span><strong>+{state.codeRedemption.awardedSpins} SPINS</strong></div>
                    ) : (
                      <form onSubmit={redeem}>
                        <label htmlFor="spin-code">Enter current code</label>
                        <div><input id="spin-code" value={redeemCode} onChange={(event) => setRedeemCode(event.target.value)} placeholder="BUNNY-XXXX" required /><button disabled={redeeming}>{redeeming ? "Checking…" : "Redeem"}</button></div>
                      </form>
                    )}
                  </div>

                  <div className="wheel-panel">
                    <div className="wheel-pointer" aria-hidden="true" />
                    <div className="prize-wheel" style={{ "--spin-rotation": `${rotation}deg` } as CSSProperties}>
                      {SEGMENTS.map((segment, index) => (
                        <span key={`${segment.label}-${index}`} style={{ "--segment-angle": `${index * 30 + 15}deg` } as CSSProperties}>{segment.label}</span>
                      ))}
                      <i className="wheel-core">BH</i>
                    </div>
                    <button
                      className="spin-now-button"
                      type="button"
                      onClick={spin}
                      disabled={spinning || state.user.spinsAvailable < 1 || state.user.totalWins >= 3}
                    >
                      {spinning ? "Spinning…" : state.user.totalWins >= 3 ? "3 wins reached" : state.user.spinsAvailable < 1 ? "Earn a spin first" : `Spin now · ${state.user.spinsAvailable} left`}
                    </button>
                    {result && (
                      <div className={`spin-result ${result === "NONE" ? "none" : "winner"}`} role="status">
                        <span>{result === "NONE" ? "KEEP GOING" : "WINNER"}</span>
                        <strong>{result === "NONE" ? "No prize this spin." : `You won ${result}.`}</strong>
                        <p>{result === "NONE" ? "Your next spin could be the one." : "Submit a fresh EVM wallet in your profile below."}</p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            <section className="spin-profile" id="spin-profile">
              <header><div><p className="section-kicker">YOUR HOOD PROFILE</p><h2>Wins &amp;<br /><em>wallets.</em></h2></div><p>You can win a maximum of three times. Each win requires a different wallet, and a saved wallet can never be edited.</p></header>
              {!state.wins?.length && <div className="empty-wins">No wins yet. Complete today’s missions, redeem the code, and keep spinning.</div>}
              <div className="wins-list">
                {state.wins?.map((win, index) => (
                  <article key={win.id}>
                    <div className="win-number">0{state.wins!.length - index}</div>
                    <div><span>{new Date(win.wonAt).toLocaleString()}</span><h3>{win.prizeType}</h3></div>
                    {win.wallet ? (
                      <div className="locked-wallet"><span>LOCKED WALLET</span><strong>{win.wallet.slice(0, 8)}…{win.wallet.slice(-6)}</strong><small>Permanent · cannot be changed</small></div>
                    ) : <WalletForm winId={win.id} onSaved={loadState} />}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
        {message && <div className="spin-message" role="status">{message}</div>}
      </section>
    </>
  );
}
