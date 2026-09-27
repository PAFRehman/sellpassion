"use client";

import * as React from "react";
import {
  ArrowRight, Building2, CheckCircle2, CircleDollarSign, HandCoins, Landmark,
  Rocket, Sparkles, Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { FundingAudience, FundingRequest, Idea, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import {
  FormField, SectionHeading, UserAvatar, fundingAudienceLabel,
} from "@/components/passionhouse/passionhouse-ui";

export function FundingView({
  requests,
  ideas,
  usersById,
  currentUserId,
  onOpenIdea,
  onPitch,
}: {
  requests: FundingRequest[];
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  currentUserId: string | null;
  onOpenIdea: (ideaId: string) => void;
  onPitch: (ideaId: string) => void;
}) {
  const [signaled, setSignaled] = React.useState<string[]>([]);
  const active = requests.filter((request) => request.status !== "funded");
  const funded = requests.filter((request) => request.status === "funded");
  const totalOpen = active.reduce((sum, request) => sum + Number(request.amount.replace(/[^0-9]/g, "")), 0);
  const pitchedIds = new Set(requests.map((request) => request.ideaId));
  const pitchable = ideas.filter((idea) => idea.creatorId === currentUserId && idea.postType === "idea" && !pitchedIds.has(idea.id));

  function signal(requestId: string) {
    setSignaled((current) => current.includes(requestId) ? current : [...current, requestId]);
    toast.success("Investor interest shared with the creator");
  }

  return (
    <>
      <SectionHeading
        eyebrow="Capital that follows proof"
        title="Fund the next useful thing."
        detail="Creators can pitch verified investors, the PassionHouse project fund, or both—before or after finding collaborators. Every funding request stays connected to the public build trail."
        action={pitchable[0] ? <Button onClick={() => onPitch(pitchable[0].id)} className="bg-white text-black hover:bg-white/85"><CircleDollarSign />Pitch for funding</Button> : undefined}
      />

      <div className="ph-funding-hero">
        <div>
          <span className="ph-funding-icon"><Landmark /></span>
          <p className="mt-5 ph-eyebrow">Open capital signal</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-white">${Math.round(totalOpen / 1000)}k</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">currently being requested across ideas with visible traction, credible builders and clear milestones.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[510px]">
          <FundingProof value={active.length.toString()} label="Open pitches" icon={Rocket} />
          <FundingProof value={funded.length.toString()} label="Funded demos" icon={CheckCircle2} />
          <FundingProof value="0%" label="Equity taken" icon={HandCoins} />
        </div>
      </div>

      <Tabs defaultValue="open" className="mt-6">
        <TabsList className="border border-white/[0.07] bg-black/40">
          <TabsTrigger value="open">Open opportunities</TabsTrigger>
          <TabsTrigger value="mine">My funding pitches</TabsTrigger>
          <TabsTrigger value="funded">Funded</TabsTrigger>
        </TabsList>
        <TabsContent value="open" className="mt-4 grid gap-4 lg:grid-cols-2">
          {active.map((request) => {
            const idea = ideas.find((item) => item.id === request.ideaId);
            const creator = usersById[request.userId];
            if (!idea || !creator) return null;
            const isSignaled = signaled.includes(request.id);
            return (
              <article key={request.id} className="ph-funding-card">
                <div className="flex items-center justify-between gap-3">
                  <button type="button" onClick={() => onOpenIdea(idea.id)} className="flex min-w-0 items-center gap-3 text-left">
                    <UserAvatar user={creator} className="size-10" />
                    <span className="min-w-0"><strong className="block truncate text-sm text-white/80">{creator.name}</strong><small className="mt-1 block truncate text-[11px] text-white/30">{creator.handle}</small></span>
                  </button>
                  <Badge className="border-white/10 bg-white/[0.05] text-white/55">{fundingAudienceLabel(request.audience)}</Badge>
                </div>
                <button type="button" onClick={() => onOpenIdea(idea.id)} className="mt-5 block w-full text-left">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-white/28">{idea.category} · {idea.stage}</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">{idea.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-white/48">{request.summary}</p>
                </button>
                <div className="mt-5 grid grid-cols-[0.7fr_1.3fr] gap-2">
                  <div className="ph-funding-data"><span>Seeking</span><strong>{request.amount}</strong></div>
                  <div className="ph-funding-data"><span>Use of funds</span><strong>{request.useOfFunds}</strong></div>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="flex items-center gap-1.5 text-[11px] text-white/30"><Users className="size-3.5" />{idea.interested} builder signals</span>
                  {creator.id !== currentUserId && (
                    <Button type="button" size="sm" onClick={() => signal(request.id)} disabled={isSignaled} className={cn("bg-white text-black hover:bg-white/85", isSignaled && "bg-white/10 text-white")}>
                      {isSignaled ? <CheckCircle2 /> : <Sparkles />}{isSignaled ? "Interest sent" : "Investor interest"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </TabsContent>
        <TabsContent value="mine" className="mt-4 space-y-3">
          {requests.filter((request) => request.userId === currentUserId).map((request) => {
            const item = ideas.find((idea) => idea.id === request.ideaId);
            return item ? <FundingRow key={request.id} request={request} idea={item} onOpen={() => onOpenIdea(item.id)} /> : null;
          })}
          {pitchable.map((idea) => (
            <button key={idea.id} type="button" onClick={() => onPitch(idea.id)} className="ph-funding-empty-row">
              <span><strong>{idea.title}</strong><small>No funding pitch yet</small></span>
              <span>Start pitch <ArrowRight /></span>
            </button>
          ))}
          {!requests.some((request) => request.userId === currentUserId) && !pitchable.length && <p className="ph-empty-note">Publish a full idea to request funding.</p>}
        </TabsContent>
        <TabsContent value="funded" className="mt-4 space-y-3">
          {funded.map((request) => {
            const item = ideas.find((idea) => idea.id === request.ideaId);
            return item ? <FundingRow key={request.id} request={request} idea={item} onOpen={() => onOpenIdea(item.id)} /> : null;
          })}
        </TabsContent>
      </Tabs>
    </>
  );
}

function FundingProof({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return <div className="ph-funding-proof"><Icon /><strong>{value}</strong><span>{label}</span></div>;
}

function FundingRow({ request, idea, onOpen }: { request: FundingRequest; idea: Idea; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="ph-funding-row">
      <span><strong>{idea.title}</strong><small>{fundingAudienceLabel(request.audience)} · {request.amount}</small></span>
      <Badge className="border-white/10 bg-white/[0.05] text-white/50">{request.status.replace("-", " ")}</Badge>
      <ArrowRight />
    </button>
  );
}

export function FundingPitchDialog({
  idea,
  onClose,
  onSubmit,
}: {
  idea: Idea | null;
  onClose: () => void;
  onSubmit: (idea: Idea, input: Pick<FundingRequest, "audience" | "amount" | "summary" | "useOfFunds">) => void;
}) {
  const [audience, setAudience] = React.useState<FundingAudience>("both");
  const [amount, setAmount] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [useOfFunds, setUseOfFunds] = React.useState("");

  React.useEffect(() => {
    if (!idea) return;
    setAudience("both");
    setAmount("");
    setSummary("");
    setUseOfFunds("");
  }, [idea]);

  return (
    <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#090909] text-white sm:max-w-[660px]">
        <DialogHeader>
          <p className="ph-eyebrow">Capital request · MVP demo</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">Pitch funding for {idea?.title}</DialogTitle>
          <DialogDescription className="text-white/42">Choose who should review the idea. The pitch stays attached to its public proof, credibility and collaboration history.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2">
          <div>
            <Label className="text-xs text-white/45">Send this pitch to</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {([
                ["investors", "Investor network", Landmark],
                ["passionhouse", "PassionHouse", Building2],
                ["both", "Both", Users],
              ] as const).map(([value, label, Icon]) => (
                <button key={value} type="button" onClick={() => setAudience(value)} className={cn("ph-funding-choice", audience === value && "active")}>
                  <Icon /><span>{label}</span>{audience === value && <CheckCircle2 />}
                </button>
              ))}
            </div>
          </div>
          <FormField label="Amount requested" value={amount} onChange={setAmount} placeholder="e.g. $150,000" />
          <div className="grid gap-2"><Label className="text-xs text-white/45">Funding milestone</Label><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="What becomes possible if this is funded?" className="min-h-24 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" /></div>
          <div className="grid gap-2"><Label className="text-xs text-white/45">Use of funds</Label><Textarea value={useOfFunds} onChange={(event) => setUseOfFunds(event.target.value)} placeholder="Be specific: engineering, pilots, audits, creator grants…" className="min-h-24 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" /></div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs leading-5 text-white/38">PassionHouse does not promise investment in this demo. The flow demonstrates transparent review, investor interest and project-fund routing.</div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:bg-white/10 hover:text-white">Cancel</Button>
          <Button type="button" disabled={!idea || amount.trim().length < 2 || summary.trim().length < 12 || useOfFunds.trim().length < 10} onClick={() => idea && onSubmit(idea, { audience, amount, summary, useOfFunds })} className="bg-white text-black hover:bg-white/85"><CircleDollarSign />Submit funding pitch</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
