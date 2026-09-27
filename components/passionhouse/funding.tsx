"use client";

import * as React from "react";
import {
  ArrowRight, Building2, CheckCircle2, CircleDollarSign, Coffee, HandCoins, Landmark,
  Rocket, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { FundingAudience, FundingRequest, FundingType, Idea, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import { FormField, SectionHeading, UserAvatar, compactNumber, fundingAudienceLabel } from "@/components/passionhouse/passionhouse-ui";

export type FundingSubmission = Pick<FundingRequest, "audience" | "amount" | "summary" | "useOfFunds" | "fundingType" | "proof" | "timeline">;

export function FundingView({
  requests,
  ideas,
  usersById,
  currentUserId,
  onOpenIdea,
  onPitch,
  onBack,
}: {
  requests: FundingRequest[];
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  currentUserId: string | null;
  onOpenIdea: (ideaId: string) => void;
  onPitch: (ideaId: string) => void;
  onBack: (ideaId: string, userId: string) => void;
}) {
  const active = requests.filter((request) => request.status !== "funded");
  const funded = requests.filter((request) => request.status === "funded");
  const pitchedIds = new Set(requests.map((request) => request.ideaId));
  const pitchable = ideas.filter((idea) => idea.creatorId === currentUserId && idea.postType === "idea" && !pitchedIds.has(idea.id));

  return (
    <>
      <SectionHeading
        eyebrow="Support ideas at the right size"
        title="Help an idea reach its next proof."
        detail="A small useful post may deserve a tip. A promising project may need one milestone backed. A proven idea can make a serious grant or investor ask."
        action={pitchable[0] ? <Button onClick={() => onPitch(pitchable[0].id)} className="bg-white text-black hover:bg-white/85"><CircleDollarSign />Create a funding ask</Button> : undefined}
      />

      <div className="ph-support-paths">
        <SupportPath icon={Coffee} step="01" title="Tip useful work" detail="Send $5–$50 to any post, article, idea or builder. No pitch required." />
        <SupportPath icon={Target} step="02" title="Back one milestone" detail="Support a specific prototype, pilot, audit or launch target with visible progress." featured />
        <SupportPath icon={Landmark} step="03" title="Fund the project" detail="Creators can request a PassionHouse grant or introduce a credible raise to investors." />
      </div>

      <div className="ph-funding-explainer"><ShieldCheck /><span><strong>Simple rule:</strong> explain what the money unlocks, show proof, name a timeline, and keep progress attached to the public idea.</span><em>0% platform equity</em></div>

      <Tabs defaultValue="open" className="mt-7">
        <TabsList className="border border-white/[0.07] bg-black/40"><TabsTrigger value="open">Ideas to back</TabsTrigger><TabsTrigger value="mine">My asks</TabsTrigger><TabsTrigger value="funded">Funded</TabsTrigger></TabsList>
        <TabsContent value="open" className="mt-4 grid gap-4 lg:grid-cols-2">
          {active.map((request) => {
            const idea = ideas.find((item) => item.id === request.ideaId);
            const creator = usersById[request.userId];
            if (!idea || !creator) return null;
            return <FundingCard key={request.id} request={request} idea={idea} creator={creator} onOpen={() => onOpenIdea(idea.id)} onBack={() => onBack(idea.id, creator.id)} />;
          })}
        </TabsContent>
        <TabsContent value="mine" className="mt-4 space-y-3">
          {requests.filter((request) => request.userId === currentUserId).map((request) => {
            const item = ideas.find((idea) => idea.id === request.ideaId);
            return item ? <FundingRow key={request.id} request={request} idea={item} onOpen={() => onOpenIdea(item.id)} /> : null;
          })}
          {pitchable.map((idea) => <button key={idea.id} type="button" onClick={() => onPitch(idea.id)} className="ph-funding-empty-row"><span><strong>{idea.title}</strong><small>Ready when you have one clear fundable milestone</small></span><span>Create ask <ArrowRight /></span></button>)}
          {!requests.some((request) => request.userId === currentUserId) && !pitchable.length && <p className="ph-empty-note">Publish an idea first, then return when its next milestone is clear.</p>}
        </TabsContent>
        <TabsContent value="funded" className="mt-4 space-y-3">
          {funded.map((request) => { const item = ideas.find((idea) => idea.id === request.ideaId); return item ? <FundingRow key={request.id} request={request} idea={item} onOpen={() => onOpenIdea(item.id)} /> : null; })}
        </TabsContent>
      </Tabs>
    </>
  );
}

function SupportPath({ icon: Icon, step, title, detail, featured = false }: { icon: React.ElementType; step: string; title: string; detail: string; featured?: boolean }) {
  return <article className={cn("ph-support-path", featured && "featured")}><div><span>{step}</span><Icon /></div><h3>{title}</h3><p>{detail}</p></article>;
}

function FundingCard({ request, idea, creator, onOpen, onBack }: { request: FundingRequest; idea: Idea; creator: UserProfile; onOpen: () => void; onBack: () => void }) {
  const target = Number(request.amount.replace(/[^0-9]/g, ""));
  const progress = target ? Math.min(100, Math.round(((request.raisedAmount ?? 0) / target) * 100)) : 0;
  return (
    <article className="ph-funding-card ph-funding-card-clear">
      <div className="flex items-center justify-between gap-3"><button type="button" onClick={onOpen} className="flex min-w-0 items-center gap-3 text-left"><UserAvatar user={creator} className="size-10" /><span className="min-w-0"><strong className="block truncate text-sm text-white/80">{creator.name}</strong><small className="mt-1 block truncate text-[11px] text-white/30">{idea.category} · {idea.stage}</small></span></button><Badge className="border-white/10 bg-white/[0.05] text-white/55">{fundingTypeLabel(request.fundingType)}</Badge></div>
      <button type="button" onClick={onOpen} className="mt-5 block w-full text-left"><h2 className="text-xl font-semibold tracking-[-0.04em] text-white">{idea.title}</h2><p className="mt-3 text-sm leading-6 text-white/48">{request.summary}</p></button>
      <div className="mt-5"><div className="flex items-end justify-between"><span><small className="block text-[10px] uppercase tracking-[0.1em] text-white/25">Raised</small><strong className="mt-1 block text-xl text-white">${compactNumber(request.raisedAmount)}</strong></span><span className="text-right"><small className="block text-[10px] text-white/25">Target</small><strong className="mt-1 block text-sm text-white/60">{request.amount}</strong></span></div><div className="ph-fund-progress mt-3"><span style={{ width: progress + "%" }} /></div><div className="mt-2 flex justify-between text-[10px] text-white/28"><span>{progress}% backed</span><span>{request.backerCount ?? 0} supporters</span></div></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-2"><div className="ph-funding-data"><span>Proof</span><strong>{request.proof || "Connected public build trail"}</strong></div><div className="ph-funding-data"><span>Timeline</span><strong>{request.timeline || "Milestone based"}</strong></div></div>
      <div className="mt-5 flex gap-2 border-t border-white/[0.07] pt-4"><Button type="button" variant="outline" onClick={onOpen} className="flex-1 border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">Read idea</Button><Button type="button" onClick={onBack} className="flex-1 bg-white text-black hover:bg-white/85"><HandCoins />Back this</Button></div>
    </article>
  );
}

function FundingRow({ request, idea, onOpen }: { request: FundingRequest; idea: Idea; onOpen: () => void }) {
  return <button type="button" onClick={onOpen} className="ph-funding-row"><span><strong>{idea.title}</strong><small>{fundingTypeLabel(request.fundingType)} · {request.amount} · {fundingAudienceLabel(request.audience)}</small></span><Badge className="border-white/10 bg-white/[0.05] text-white/50">{request.status.replace("-", " ")}</Badge><ArrowRight /></button>;
}

function fundingTypeLabel(type?: FundingType) {
  if (type === "grant") return "Project grant";
  if (type === "investment") return "Investor raise";
  return "Milestone backing";
}

export function FundingPitchDialog({ idea, onClose, onSubmit }: { idea: Idea | null; onClose: () => void; onSubmit: (idea: Idea, input: FundingSubmission) => void }) {
  const [fundingType, setFundingType] = React.useState<FundingType>("milestone");
  const [amount, setAmount] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [useOfFunds, setUseOfFunds] = React.useState("");
  const [proof, setProof] = React.useState("");
  const [timeline, setTimeline] = React.useState("");

  React.useEffect(() => { if (!idea) return; setFundingType("milestone"); setAmount(""); setSummary(""); setUseOfFunds(""); setProof(""); setTimeline(""); }, [idea]);
  const audience: FundingAudience = fundingType === "milestone" ? "community" : fundingType === "grant" ? "passionhouse" : "investors";
  const ready = !!idea && amount.trim().length >= 2 && summary.trim().length >= 10 && useOfFunds.trim().length >= 8 && proof.trim().length >= 6 && timeline.trim().length >= 2;

  return (
    <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#090909] text-white sm:max-w-[680px]">
        <DialogHeader><p className="ph-eyebrow">One clear funding ask</p><DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">What should support unlock for {idea?.title}?</DialogTitle><DialogDescription className="text-white/42">Choose the smallest funding path that fits. You can create a larger ask after the project proves more.</DialogDescription></DialogHeader>
        <div className="grid gap-5 py-2">
          <div><Label className="text-xs text-white/45">Choose a path</Label><div className="mt-2 grid gap-2 sm:grid-cols-3">{([
            ["milestone", "Community milestone", "Back one concrete next step", Target],
            ["grant", "PassionHouse grant", "Non-dilutive project support", Building2],
            ["investment", "Investor raise", "Capital for a validated venture", Landmark],
          ] as const).map(([value, title, detail, Icon]) => <button key={value} type="button" onClick={() => setFundingType(value)} className={cn("ph-funding-choice ph-funding-choice-clear", fundingType === value && "active")}><Icon /><span><strong>{title}</strong><small>{detail}</small></span>{fundingType === value && <CheckCircle2 />}</button>)}</div></div>
          <FormField label="Target amount" value={amount} onChange={setAmount} placeholder={fundingType === "milestone" ? "e.g. $8,000" : "e.g. $150,000"} />
          <div className="grid gap-2"><Label className="text-xs text-white/45">What becomes true?</Label><Textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Example: Ship the working clinic pilot to three care teams." className="min-h-20 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" /></div>
          <div className="grid gap-2"><Label className="text-xs text-white/45">What will the money pay for?</Label><Textarea value={useOfFunds} onChange={(event) => setUseOfFunds(event.target.value)} placeholder="Engineering, pilot operations, audit, creator grants…" className="min-h-20 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" /></div>
          <div className="grid gap-4 sm:grid-cols-2"><FormField label="Proof already earned" value={proof} onChange={setProof} placeholder="Users, prototype, LOIs…" /><FormField label="Time to milestone" value={timeline} onChange={setTimeline} placeholder="e.g. 10 weeks" /></div>
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs leading-5 text-white/38"><Sparkles className="mr-2 inline size-4" />This MVP simulates backing, review and investor interest. It never processes real funds or promises investment.</div>
        </div>
        <DialogFooter><Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:bg-white/10 hover:text-white">Cancel</Button><Button type="button" disabled={!ready} onClick={() => idea && onSubmit(idea, { audience, amount, summary, useOfFunds, fundingType, proof, timeline })} className="bg-white text-black hover:bg-white/85"><Rocket />Publish funding ask</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
