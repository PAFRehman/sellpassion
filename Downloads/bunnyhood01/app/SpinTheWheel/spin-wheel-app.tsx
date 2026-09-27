"use client";

import { FormEvent, type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";

type TaskType = "like" | "repost" | "comment";
type PrizeType = "GTD" | "FCFS1" | "FCFS2";
type SpinResult = PrizeType | "NONE" | "REFUND";

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
    roleWins: Record<PrizeType, number>;
  };
  referral?: {
    code: string;
    successfulReferrals: number;
    spinsEarned: number;
  };
  community: { connectedUsers: number };
  campaign: null | {
    id: string;
    title: string;
    roundNumber: number;
    tweetUrl: string;
    startsAt: string;
    endsAt: string;
  };
  claimedTasks?: TaskType[];
  taskStarts?: Array<{ taskType: TaskType; readyAt: string }>;
  codeRedemption?: null | { awardedSpins: number };
  wins?: Array<{
    id: string;
    prizeType: PrizeType;
    wonAt: string;
    wallet: string | null;
    walletSubmittedAt: string | null;
  }>;
};

type SpinOutcome = {
  eventId: string;
  result: SpinResult;
  spinsLeft: number;
  spinsUsed: number;
  totalWins: number;
  winId?: string;
};

type SpinBatchResponse = {
  batchId: string;
  requested: number;
  processed: number;
  consumedSpins: number;
  spinsLeft: number;
  spinsUsed: number;
  totalWins: number;
  results: SpinOutcome[];
  summary: {
    none: number;
    refunded: number;
    GTD: number;
    FCFS1: number;
    FCFS2: number;
  };
};

type ApiError = { error?: string; code?: string };

const TASKS: Array<{ id: TaskType; eyebrow: string; title: string; copy: string }> = [
  { id: "like", eyebrow: "01 · SUPPORT", title: "Like the post", copy: "Click once. The post opens and +1 spin with +1 point is secured automatically after five seconds." },
  { id: "repost", eyebrow: "02 · SHARE", title: "Repost it", copy: "Click once, repost the campaign, and the server completes your reward after five seconds." },
  { id: "comment", eyebrow: "03 · SPEAK", title: "Leave a comment", copy: "Click once, leave your reply, and return. No second claim click is required." },
];

type TaskTimer = { intervalId: number; claimId?: number };

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

function xShareUrl(text: string, url: string) {
  const params = new URLSearchParams({ text, url });
  return `https://x.com/intent/post?${params.toString()}`;
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
  const [batchSpinning, setBatchSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [batchResult, setBatchResult] = useState<SpinBatchResponse["summary"] & { processed: number; consumed: number } | null>(null);
  const [incomingReferral] = useState(() => {
    if (typeof window === "undefined") return "";
    const value = new URLSearchParams(window.location.search).get("ref")?.trim().toLowerCase() ?? "";
    return /^[a-z0-9_]{3,24}$/.test(value) ? value : "";
  });
  const [origin] = useState(() => typeof window === "undefined" ? "https://www.bunnyhood.xyz" : window.location.origin);
  const [referralCode, setReferralCode] = useState("");
  const [savingReferral, setSavingReferral] = useState(false);
  const revealTimer = useRef<number | null>(null);
  const pendingOutcome = useRef<SpinOutcome | null>(null);
  const skipRequested = useRef(false);
  const taskTimers = useRef<Partial<Record<TaskType, TaskTimer>>>({});

  const loadState = useCallback(async () => {
    try {
      const next = await requestJson<WheelState>("/api/spin/state");
      setState(next);
      if (next.referral?.code) setReferralCode(next.referral.code);
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
        if (timer.claimId) window.clearTimeout(timer.claimId);
      }
    };
  }, [loadState]);

  const claimed = useMemo(() => new Set(state?.claimedTasks ?? []), [state?.claimedTasks]);
  const referralLink = state?.referral?.code
    ? `${origin}/SpinTheWheel?ref=${encodeURIComponent(state.referral.code)}`
    : `${origin}/SpinTheWheel`;
  const referralShare = xShareUrl(
    "Join me in Bunny Hood. Connect X, complete the campaign, and spin with my invite link.",
    referralLink,
  );
  const connectHref = incomingReferral
    ? `/api/spin/auth/x/start?ref=${encodeURIComponent(incomingReferral)}`
    : "/api/spin/auth/x/start";

  const clearTaskTimer = useCallback((task: TaskType) => {
    const timer = taskTimers.current[task];
    if (timer) {
      window.clearInterval(timer.intervalId);
      if (timer.claimId) window.clearTimeout(timer.claimId);
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
    try {
      await requestJson("/api/spin/tasks/claim", {
        method: "POST",
        body: JSON.stringify({ task }),
      });
      setMessage("Task complete. +1 spin and +1 point were added automatically.");
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task reward could not be recovered.");
    } finally {
      setTaskWorking((current) => ({ ...current, [task]: false }));
    }
  }, [clearTaskTimer, loadState]);

  const scheduleTaskRecovery = useCallback((task: TaskType, readyAt: string) => {
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
      if (!claimed.has(start.taskType)) scheduleTaskRecovery(start.taskType, start.readyAt);
    }
  }, [claimed, scheduleTaskRecovery, state?.taskStarts]);

  async function startTask(task: TaskType) {
    if (!state?.campaign || claimed.has(task) || taskTimers.current[task]) return;
    window.open(state.campaign.tweetUrl, "_blank", "noopener,noreferrer");
    setTaskWorking((current) => ({ ...current, [task]: true }));
    setMessage("");
    try {
      const started = await requestJson<{ alreadyClaimed: boolean; readyAt: string }>("/api/spin/tasks/start", {
        method: "POST",
        body: JSON.stringify({ task }),
      });
      if (started.alreadyClaimed) {
        await loadState();
      } else {
        scheduleTaskRecovery(task, started.readyAt);
        setMessage("Task opened. Your spin and point will be added automatically after five seconds.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The task could not be completed.");
      await loadState();
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

  async function saveReferralCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingReferral(true);
    setMessage("");
    try {
      await requestJson("/api/spin/referral/code", {
        method: "POST",
        body: JSON.stringify({ code: referralCode }),
      });
      setMessage("Your custom invite code is live. New shares now use it.");
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invite code could not be saved.");
    } finally {
      setSavingReferral(false);
    }
  }

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setMessage("Referral link copied.");
    } catch {
      setMessage("Copy this referral link from the field and share it with your community.");
    }
  }

  const finishSingleSpin = useCallback(async (outcome: SpinOutcome) => {
    pendingOutcome.current = null;
    skipRequested.current = false;
    revealTimer.current = null;
    setResult(outcome.result);
    setSpinning(false);
    await loadState();
  }, [loadState]);

  async function spinOne() {
    if (spinning || batchSpinning) return;
    setSpinning(true);
    setResult(null);
    setBatchResult(null);
    setMessage("");
    skipRequested.current = false;
    try {
      const reply = await requestJson<SpinBatchResponse>("/api/spin/play", {
        method: "POST",
        body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), count: 1 }),
      });
      const outcome = reply.results[0];
      pendingOutcome.current = outcome;
      if (skipRequested.current) {
        await finishSingleSpin(outcome);
        return;
      }
      const visualResult = outcome.result === "REFUND" ? "NONE" : outcome.result;
      const candidates = SEGMENTS.map((segment, index) => ({ segment, index }))
        .filter((item) => item.segment.result === visualResult);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)] ?? { index: 1 };
      const centerAngle = chosen.index * 30 + 15;
      const normalized = ((rotation % 360) + 360) % 360;
      const target = rotation + 5 * 360 + ((360 - centerAngle - normalized + 360) % 360);
      setRotation(target);
      revealTimer.current = window.setTimeout(() => void finishSingleSpin(outcome), 4_400);
    } catch (error) {
      setSpinning(false);
      setMessage(error instanceof Error ? error.message : "The wheel could not spin.");
    }
  }

  function skipAnimation() {
    if (!pendingOutcome.current) {
      skipRequested.current = true;
      return;
    }
    if (revealTimer.current) window.clearTimeout(revealTimer.current);
    const outcome = pendingOutcome.current;
    void finishSingleSpin(outcome);
  }

  async function spinAll() {
    if (!state?.user || spinning || batchSpinning || state.user.spinsAvailable < 1) return;
    setBatchSpinning(true);
    setResult(null);
    setBatchResult(null);
    setMessage("");
    const targetAttempts = state.user.spinsAvailable;
    let attemptsLeft = targetAttempts;
    const combined = { none: 0, refunded: 0, GTD: 0, FCFS1: 0, FCFS2: 0 };
    let consumed = 0;
    let processed = 0;
    try {
      while (attemptsLeft > 0) {
        const reply = await requestJson<SpinBatchResponse>("/api/spin/play", {
          method: "POST",
          body: JSON.stringify({
            idempotencyKey: crypto.randomUUID(),
            count: Math.min(100, attemptsLeft),
          }),
        });
        combined.none += reply.summary.none;
        combined.refunded += reply.summary.refunded;
        combined.GTD += reply.summary.GTD;
        combined.FCFS1 += reply.summary.FCFS1;
        combined.FCFS2 += reply.summary.FCFS2;
        consumed += reply.consumedSpins;
        processed += reply.processed;
        attemptsLeft -= reply.processed;
        if (reply.processed < 1) break;
      }
      setBatchResult({ ...combined, processed, consumed });
      await loadState();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your spins could not be processed.");
      await loadState();
    } finally {
      setBatchSpinning(false);
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

  const winShareHref = (prizeType: PrizeType) => xShareUrl(
    `I won ${prizeType} on the Bunny Hood wheel. Join the Hood with my invite link.`,
    referralLink,
  );

  return (
    <>
      <section className="spin-hero">
        <div className="spin-grid" />
        <div className="spin-hero-copy">
          <p className="section-kicker"><span className="live-dot" /> CAMPAIGN REWARDS</p>
          <h1>SPIN<br /><em>THE HOOD.</em></h1>
          <p>Connect X, complete each five-second task with one click, redeem the live code, and spin one-by-one or process them instantly.</p>
          <div className="community-proof" aria-label="Bunny Hood connected community">
            <div><strong>{state?.community.connectedUsers ?? 0}</strong><span>UNIQUE X USERS CONNECTED</span></div>
            <div><strong>20 DAYS</strong><span>PRIVATE PACED CAMPAIGN DRAW</span></div>
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
              <p>Your X ID is the permanent account key. Returning users recover points, spins, referrals, wins, and pending wallet submissions.</p>
              {incomingReferral && <div className="incoming-referral">INVITE CODE · {incomingReferral}</div>}
            </div>
            <a className="x-connect-button" href={connectHref}><span>Connect X</span><b>X</b></a>
          </div>
        )}

        {!loading && state?.authenticated && state.user && (
          <>
            <div className="profile-bar">
              <div><span>CONNECTED AS</span><strong>@{state.user.xUsername}</strong></div>
              <div><span>SPINS LEFT</span><strong>{state.user.spinsAvailable}</strong></div>
              <div><span>POINTS</span><strong>{state.user.points}</strong></div>
              <div><span>WINS</span><strong>{state.user.totalWins}/9</strong></div>
              <div><span>CONNECTED USERS</span><strong>{state.community.connectedUsers}</strong></div>
              <button type="button" onClick={logout}>Disconnect</button>
            </div>

            <div className="role-cap-strip" aria-label="Wins by role">
              <span>GTD <strong>{state.user.roleWins.GTD}/3</strong></span>
              <span>FCFS1 <strong>{state.user.roleWins.FCFS1}/3</strong></span>
              <span>FCFS2 <strong>{state.user.roleWins.FCFS2}/3</strong></span>
              <small>Each role is capped at three wins. A capped-role hit returns the spin.</small>
            </div>

            {!state.campaign && <div className="no-campaign"><span>THE WHEEL IS RESTING</span><h2>Next campaign<br /><em>coming soon.</em></h2><p>Your profile and balances are saved. Return when the next tweet and code go live.</p></div>}

            {state.campaign && (
              <>
                <section className="daily-campaign">
                  <header>
                    <div><p className="section-kicker">LIVE CAMPAIGN · ROUND {String(state.campaign.roundNumber).padStart(2, "0")}</p><h2>{state.campaign.title}</h2></div>
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
                              ? "Completed · +1 spin +1 point"
                              : taskSeconds[task.id] !== undefined
                                ? `Auto-completes in ${taskSeconds[task.id]}s`
                                : taskWorking[task.id]
                                  ? "Securing reward…"
                                  : "Open once · auto reward"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="referral-panel">
                  <div>
                    <p className="section-kicker">INVITE THE HOOD</p>
                    <h2>Earn 3 spins<br /><em>per referral.</em></h2>
                    <p>A referral succeeds once a new X account connects through your link. Each X account can credit only one inviter.</p>
                    <div className="referral-stats">
                      <div><span>SUCCESSFUL</span><strong>{state.referral?.successfulReferrals ?? 0}</strong></div>
                      <div><span>SPINS EARNED</span><strong>{state.referral?.spinsEarned ?? 0}</strong></div>
                    </div>
                  </div>
                  <div className="referral-controls">
                    <form onSubmit={saveReferralCode}>
                      <label htmlFor="referral-code">Custom username-style invite code</label>
                      <div><input id="referral-code" value={referralCode} onChange={(event) => setReferralCode(event.target.value.toLowerCase())} minLength={3} maxLength={24} pattern="[a-z0-9_]+" required /><button disabled={savingReferral}>{savingReferral ? "Saving…" : "Save code"}</button></div>
                    </form>
                    <label htmlFor="referral-link">Your permanent referral link</label>
                    <div className="referral-link-row"><input id="referral-link" value={referralLink} readOnly /><button type="button" onClick={copyReferralLink}>Copy</button></div>
                    <a className="share-x-button" href={referralShare} target="_blank" rel="noreferrer">Share referral link on X</a>
                  </div>
                </section>

                <section className="code-and-wheel">
                  <div className="redeem-panel">
                    <p className="section-kicker">CAMPAIGN CODE DROP</p>
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
                    <div className="wheel-actions">
                      <button type="button" onClick={spinOne} disabled={spinning || batchSpinning || state.user.spinsAvailable < 1}>{spinning ? "Spinning…" : state.user.spinsAvailable < 1 ? "Earn a spin first" : "Spin one"}</button>
                      <button type="button" onClick={spinAll} disabled={spinning || batchSpinning || state.user.spinsAvailable < 1}>{batchSpinning ? "Processing…" : `Spin all · ${state.user.spinsAvailable}`}</button>
                    </div>
                    {spinning && <button className="skip-spin-button" type="button" onClick={skipAnimation}>Skip animation</button>}
                    {result && (
                      <div className={`spin-result ${result === "NONE" || result === "REFUND" ? "none" : "winner"}`} role="status">
                        <span>{result === "NONE" ? "KEEP GOING" : result === "REFUND" ? "SPIN RETURNED" : "WINNER"}</span>
                        <strong>{result === "NONE" ? "No prize this spin." : result === "REFUND" ? "Your role cap protected this spin." : `You won ${result}.`}</strong>
                        <p>{result === "NONE" ? "Your next spin could be the one." : result === "REFUND" ? "Nothing was deducted. You can spin it again." : "Submit a fresh EVM wallet in your profile below."}</p>
                        {result !== "NONE" && result !== "REFUND" && <a href={winShareHref(result)} target="_blank" rel="noreferrer">Share win on X</a>}
                      </div>
                    )}
                    {batchResult && (
                      <div className="batch-result" role="status">
                        <strong>{batchResult.processed} attempts processed</strong>
                        <span>{batchResult.GTD} GTD · {batchResult.FCFS1} FCFS1 · {batchResult.FCFS2} FCFS2</span>
                        <small>{batchResult.consumed} spins used · {batchResult.refunded} returned</small>
                        {(batchResult.GTD + batchResult.FCFS1 + batchResult.FCFS2) > 0 && <a href={xShareUrl("I just won on the Bunny Hood wheel. Join with my invite link.", referralLink)} target="_blank" rel="noreferrer">Share results on X</a>}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            <section className="spin-profile" id="spin-profile">
              <header><div><p className="section-kicker">YOUR HOOD PROFILE</p><h2>Wins &amp;<br /><em>wallets.</em></h2></div><p>You can win each role up to three times, for nine total wins. Each win requires a different wallet, and a saved wallet can never be edited.</p></header>
              {!state.wins?.length && <div className="empty-wins">No wins yet. Complete the campaign, redeem the code, invite the Hood, and keep spinning.</div>}
              <div className="wins-list">
                {state.wins?.map((win, index) => (
                  <article key={win.id}>
                    <div className="win-number">{String(state.wins!.length - index).padStart(2, "0")}</div>
                    <div><span>{new Date(win.wonAt).toLocaleString()}</span><h3>{win.prizeType}</h3><a className="win-share-link" href={winShareHref(win.prizeType)} target="_blank" rel="noreferrer">Share on X</a></div>
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
