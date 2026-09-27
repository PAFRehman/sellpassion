"use client";

import * as React from "react";
import NextImage from "next/image";
import {
  BookOpen, CheckCircle2, ChevronRight, CreditCard, Globe2,
  Image as ImageIcon, KeyRound, Lightbulb, Lock, MessageCircle, Rocket, Send, ShieldCheck, Video, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AccessMode, AccessTier, ContentType, Idea, MediaAttachment, Proposal, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import {
  CATEGORIES, STAGES, TIER_LABELS, FormField, readFileAsDataUrl, stateId,
} from "@/components/passionhouse/passionhouse-ui";

export type AccessSubmission = {
  tier: AccessTier;
  role: string;
  note: string;
  method: "request" | "paid" | "trust";
  amountPaid?: string;
};

export function AccessRequestDialog({
  idea,
  creator,
  currentUser,
  onClose,
  onSubmit,
}: {
  idea: Idea | null;
  creator: UserProfile | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onSubmit: (idea: Idea, input: AccessSubmission) => void;
}) {
  const [path, setPath] = React.useState<"request" | "pay" | "trust">("request");
  const [tier, setTier] = React.useState<AccessTier>("build");
  const [role, setRole] = React.useState("");
  const [note, setNote] = React.useState("");
  const [checkout, setCheckout] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (!idea) return;
    setPath(idea.accessMode === "paid" ? "pay" : idea.accessMode === "trust" || idea.accessMode === "hybrid" ? "trust" : "request");
    setTier("build");
    setRole("");
    setNote("");
    setCheckout(false);
    setProcessing(false);
  }, [idea]);

  if (!idea) return <Dialog open={false} />;
  const price = idea.accessPricing[tier];
  const trustEligible = !!currentUser && currentUser.credibility >= idea.trustThreshold;
  const allowsTrust = idea.accessMode === "trust" || idea.accessMode === "hybrid";
  const allowsPayment = idea.accessMode === "paid" || idea.accessMode === "hybrid";
  const tierCopy: Record<AccessTier, { title: string; detail: string; features: string[] }> = {
    context: {
      title: "Context",
      detail: "Understand the opportunity",
      features: ["Research context", "Problem map", "Public conversation"],
    },
    build: {
      title: "Build Plan",
      detail: "Evaluate and start building",
      features: ["Everything in Context", "Product workflow", "Validation + build priorities"],
    },
    full: {
      title: "Full Project",
      detail: "Enter the execution room",
      features: ["Everything in Build", "Commercial plan", "Private media + execution materials"],
    },
  };

  function completePayment() {
    if (!idea) return;
    setProcessing(true);
    window.setTimeout(() => {
      onSubmit(idea, {
        tier,
        role: "Paid member",
        note: "Instant tier access purchased through the demo checkout.",
        method: "paid",
        amountPaid: price === 0 ? "Free" : "$" + price,
      });
      setProcessing(false);
    }, 700);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#0b0b0c] text-white sm:max-w-[680px]">
        <DialogHeader>
          <p className="ph-eyebrow">Project access</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">{checkout ? "Complete demo checkout" : "Choose how to access " + idea.title}</DialogTitle>
          <DialogDescription className="text-white/42">
            {checkout
              ? "Confirm the selected project tier. No real payment is processed in this MVP."
              : "Use the access path chosen by the creator. Trust can unlock the Builder Kit; payment or approval can unlock more."}
          </DialogDescription>
        </DialogHeader>

        {!checkout ? (
          <>
            <div className="ph-access-path-toggle">
              {allowsTrust && <button type="button" className={path === "trust" ? "active" : ""} onClick={() => setPath("trust")}><ShieldCheck /><span><strong>Trust access</strong><small>{idea.trustThreshold}+ credibility · free Builder Kit</small></span></button>}
              {allowsPayment && <button type="button" className={path === "pay" ? "active" : ""} onClick={() => setPath("pay")}><CreditCard /><span><strong>Paid access</strong><small>Choose a project tier</small></span></button>}
              {idea.accessMode !== "paid" && <button type="button" className={path === "request" ? "active" : ""} onClick={() => setPath("request")}><KeyRound /><span><strong>Ask the creator</strong><small>Personal request · auto-approved in demo</small></span></button>}
            </div>

            {path === "request" ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 rounded-xl border border-white/[0.09] bg-white/[0.035] p-4">
                  <span className="flex size-10 items-center justify-center rounded-full bg-white text-black"><CheckCircle2 className="size-5" /></span>
                  <span><strong className="block text-sm text-white/80">Full Project request</strong><small className="mt-1 block text-xs text-white/35">Automatically approved in this demo; creator-controlled in production</small></span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="access-role" className="text-xs text-white/45">How might you help? <span className="text-white/22">(optional)</span></Label>
                  <Input id="access-role" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Founder, engineer, investor, design partner…" className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="access-note" className="text-xs text-white/45">A short note <span className="text-white/22">(optional)</span></Label>
                  <Textarea id="access-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Relevant experience, an introduction, or the first thing you would test." className="min-h-24 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
                </div>
              </div>
            ) : path === "trust" ? (
              <div className="space-y-4 py-2">
                <div className={cn("rounded-2xl border p-5", trustEligible ? "border-white/20 bg-white/[0.06]" : "border-white/[0.08] bg-white/[0.025]")}>
                  <div className="flex items-center gap-4">
                    <span className={cn("flex size-12 items-center justify-center rounded-full", trustEligible ? "bg-white text-black" : "bg-white/[0.06] text-white/35")}><ShieldCheck /></span>
                    <span className="min-w-0 flex-1"><small className="block text-[10px] uppercase tracking-[0.12em] text-white/30">Your credibility</small><strong className="mt-1 block text-2xl text-white">{currentUser?.credibility ?? 0}</strong></span>
                    <span className="text-right"><small className="block text-[10px] text-white/30">Required</small><strong className="mt-1 block text-lg text-white/65">{idea.trustThreshold}+</strong></span>
                  </div>
                  <p className="mt-4 text-xs leading-6 text-white/40">{trustEligible ? "You qualify. Unlock the Builder Kit free based on your connected identity, execution and community credibility." : "Connect more social proof or build your PassionHouse history to qualify. You can still ask the creator directly."}</p>
                </div>
                <div className="rounded-xl border border-white/[0.08] p-4"><strong className="text-sm text-white/70">Builder Kit includes</strong><div className="mt-3 flex flex-wrap gap-2">{tierCopy.build.features.map((feature) => <span key={feature} className="rounded-full bg-white/[0.05] px-2.5 py-1.5 text-[10px] text-white/38">{feature}</span>)}</div></div>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {(["context", "build", "full"] as AccessTier[]).map((item) => {
                  const copy = tierCopy[item];
                  const itemPrice = idea.accessPricing[item];
                  return (
                    <button key={item} type="button" onClick={() => setTier(item)} className={cn("ph-paid-tier", tier === item && "active")}>
                      <span className="ph-paid-tier-check">{tier === item ? <CheckCircle2 /> : <span />}</span>
                      <span className="min-w-0 flex-1 text-left">
                        <span className="flex items-center gap-2"><strong>{copy.title}</strong>{item === "build" && <em>Popular</em>}</span>
                        <small>{copy.detail}</small>
                        <span className="mt-3 flex flex-wrap gap-1.5">{copy.features.map((feature) => <i key={feature}>{feature}</i>)}</span>
                      </span>
                      <span className="ph-paid-tier-price"><strong>{itemPrice === 0 ? "Free" : "$" + itemPrice}</strong><small>{itemPrice === 0 ? "forever" : "one-time"}</small></span>
                    </button>
                  );
                })}
                <p className="px-1 text-[10px] leading-5 text-white/25">Demo pricing shows the product flow. Creators will be able to configure tiers, pricing and included project materials.</p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="ph-checkout-summary">
              <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"><CreditCard /></span>
              <span className="min-w-0 flex-1"><small>{idea.title}</small><strong>{tierCopy[tier].title} access</strong></span>
              <span className="text-right"><strong>{price === 0 ? "Free" : "$" + price}</strong><small>USD · one-time</small></span>
            </div>
            <div className="ph-demo-payment">
              <div className="flex items-center justify-between"><span>Demo card</span><span>VISA</span></div>
              <strong>•••• •••• •••• 4242</strong>
              <div className="flex items-center justify-between"><small>12 / 30</small><small>CVV •••</small></div>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-xs leading-5 text-white/38">
              This is a simulated checkout. Clicking complete records the tier and immediately unlocks the included project materials.
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => checkout ? setCheckout(false) : onClose()} className="text-white/55 hover:bg-white/10 hover:text-white">{checkout ? "Back" : "Cancel"}</Button>
          {!checkout && path === "request" && (
            <Button type="button" className="bg-white text-black hover:bg-white/85" onClick={() => onSubmit(idea, { tier: "full", role: role.trim() || "Interested builder", note: note.trim() || "Requested creator access in the MVP demo.", method: "request" })}><KeyRound />Request Full Project</Button>
          )}
          {!checkout && path === "pay" && (
            <Button type="button" className="bg-white text-black hover:bg-white/85" onClick={() => setCheckout(true)}><CreditCard />Continue · {price === 0 ? "Free" : "$" + price}</Button>
          )}
          {!checkout && path === "trust" && (
            <Button type="button" disabled={!trustEligible} className="bg-white text-black hover:bg-white/85" onClick={() => onSubmit(idea, { tier: "build", role: "Trust-qualified builder", note: "Builder Kit unlocked through PassionHouse credibility.", method: "trust" })}><ShieldCheck />{trustEligible ? "Unlock Builder Kit free" : "Trust score not high enough"}</Button>
          )}
          {checkout && (
            <Button type="button" disabled={processing} className="bg-white text-black hover:bg-white/85" onClick={completePayment}>{processing ? "Processing…" : price === 0 ? "Unlock free tier" : "Complete demo payment"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProposalDialog({
  idea,
  onClose,
  onSubmit,
}: {
  idea: Idea | null;
  onClose: () => void;
  onSubmit: (
    idea: Idea,
    data: Omit<Proposal, "id" | "ideaId" | "fromUserId" | "toUserId" | "status" | "createdAt">,
  ) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [scope, setScope] = React.useState("");
  const [timeline, setTimeline] = React.useState("");
  const [budget, setBudget] = React.useState("");
  React.useEffect(() => {
    if (idea) {
      setTitle("");
      setSummary("");
      setScope("");
      setTimeline("");
      setBudget("");
    }
  }, [idea]);
  return (
    <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0f1113] text-white sm:max-w-[650px]">
        <DialogHeader>
          <p className="ph-eyebrow">From interest to terms</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">Propose a way to build {idea?.title}</DialogTitle>
          <DialogDescription className="text-white/42">
            A creator can accept, decline or discuss this proposal. Acceptance opens a private deal room.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <FormField label="Proposal title" value={title} onChange={setTitle} placeholder="e.g. Four-week pilot architecture sprint" />
          <FormField label="Outcome in one line" value={summary} onChange={setSummary} placeholder="What changes when this work is complete?" />
          <div className="grid gap-2">
            <Label className="text-xs text-white/45">Scope</Label>
            <Textarea value={scope} onChange={(event) => setScope(event.target.value)} placeholder="Specific deliverables and boundaries" className="min-h-24 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Timeline" value={timeline} onChange={setTimeline} placeholder="e.g. 4 weeks" />
            <FormField label="Budget / terms" value={budget} onChange={setBudget} placeholder="e.g. $8,500 fixed" />
          </div>
          <div className="rounded-xl border border-[#f5f5f5]/15 bg-[#f5f5f5]/[0.04] p-3 text-xs leading-5 text-white/42">
            PassionHouse helps both sides agree and execute. It takes <span className="font-medium text-[#f5f5f5]">0% equity</span> in the project.
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/55 hover:bg-white/10 hover:text-white">Cancel</Button>
          <Button
            type="button"
            disabled={!idea || !title.trim() || !summary.trim() || !scope.trim() || !timeline.trim() || !budget.trim()}
            className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]"
            onClick={() => idea && onSubmit(idea, { title, summary, scope, timeline, budget })}
          >
            Send proposal
            <Send />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type PostSubmission = {
  postType: ContentType;
  title: string;
  oneLiner: string;
  description: string;
  fullDetails: string;
  category: string;
  stage: string;
  ask: string;
  evidence: string;
  disclosure: "open" | "tiered";
  accessMode: AccessMode;
  trustThreshold: number;
  media: MediaAttachment[];
};

export function PostIdeaDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PostSubmission) => void;
}) {
  const [postType, setPostType] = React.useState<ContentType>("post");
  const [quickBody, setQuickBody] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [oneLiner, setOneLiner] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [fullDetails, setFullDetails] = React.useState("");
  const [category, setCategory] = React.useState("Web3");
  const [stage, setStage] = React.useState("Concept");
  const [ask, setAsk] = React.useState("");
  const [evidence, setEvidence] = React.useState("");
  const [disclosure, setDisclosure] = React.useState<"open" | "tiered">("open");
  const [accessMode, setAccessMode] = React.useState<AccessMode>("public");
  const [trustThreshold, setTrustThreshold] = React.useState(78);
  const [media, setMedia] = React.useState<MediaAttachment[]>([]);

  React.useEffect(() => {
    if (!open) return;
    setPostType("post");
    setQuickBody("");
    setTitle("");
    setOneLiner("");
    setDescription("");
    setFullDetails("");
    setCategory("Web3");
    setStage("Concept");
    setAsk("");
    setEvidence("");
    setDisclosure("open");
    setAccessMode("public");
    setTrustThreshold(78);
    setMedia([]);
  }, [open]);

  React.useEffect(() => {
    if (disclosure === "open") {
      setMedia((current) => current.map((item) => ({ ...item, visibility: "public" })));
    }
  }, [disclosure]);

  async function addMedia(files: FileList | null) {
    if (!files?.length) return;
    const slots = Math.max(0, 4 - media.length);
    const selected = Array.from(files).slice(0, slots);
    const accepted = selected.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const totalBytes = accepted.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 3_000_000) {
      toast.error("For this browser demo, keep each upload batch under 3 MB.");
      return;
    }
    const next = await Promise.all(
      accepted.map(async (file) => ({
        id: stateId("media"),
        kind: file.type.startsWith("video/") ? "video" as const : "image" as const,
        name: file.name,
        url: await readFileAsDataUrl(file),
        visibility: "public" as const,
      })),
    );
    setMedia((current) => [...current, ...next]);
    if (accepted.length < selected.length) toast.info("Only image and video files can be attached.");
  }

  function publish() {
    if (postType === "post") {
      const clean = quickBody.trim();
      const firstLine = clean.split(/[.!?\n]/)[0]?.trim() || "New post";
      onSubmit({
        postType,
        title: firstLine.slice(0, 58),
        oneLiner: clean.slice(0, 150),
        description: clean,
        fullDetails: clean,
        category,
        stage: "Concept",
        ask: "",
        evidence: "",
        disclosure: "open",
        accessMode: "public",
        trustThreshold: 0,
        media: media.map((item) => ({ ...item, visibility: "public" })),
      });
      return;
    }

    const isArticle = postType === "article";
    onSubmit({
      postType,
      title,
      oneLiner,
      description,
      fullDetails: fullDetails.trim() || description,
      category,
      stage: isArticle ? "Validated" : stage,
      ask: isArticle ? "" : ask,
      evidence: isArticle ? "" : evidence,
      disclosure: isArticle ? "open" : accessMode === "public" ? "open" : "tiered",
      accessMode: isArticle ? "public" : accessMode,
      trustThreshold: isArticle ? 0 : trustThreshold,
      media: isArticle ? media.map((item) => ({ ...item, visibility: "public" as const })) : media,
    });
  }

  const ideaReady =
    title.trim().length >= 2 &&
    oneLiner.trim().length >= 10 &&
    description.trim().length >= 20;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-[760px]">
        <DialogHeader>
          <p className="ph-eyebrow">Create · public by default</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">Share the thought at the size it deserves.</DialogTitle>
          <DialogDescription className="text-white/42">
            Post one useful sentence, explain an idea, or publish a thoughtful article. Funding comes later when the idea is ready.
          </DialogDescription>
        </DialogHeader>

        <div className="ph-post-type-toggle">
          <button type="button" className={postType === "post" ? "active" : ""} onClick={() => setPostType("post")}>
            <MessageCircle /><span><strong>Quick post</strong><small>A thought, question, update or ask</small></span>
          </button>
          <button type="button" className={postType === "idea" ? "active" : ""} onClick={() => setPostType("idea")}>
            <Lightbulb /><span><strong>Idea</strong><small>Share something people can help build</small></span>
          </button>
          <button type="button" className={postType === "article" ? "active" : ""} onClick={() => setPostType("article")}>
            <BookOpen /><span><strong>Article</strong><small>Long-form thinking and lessons</small></span>
          </button>
        </div>

        {postType === "post" ? (
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="quick-post" className="text-xs text-white/45">What is on your mind?</Label>
              <Textarea
                id="quick-post"
                autoFocus
                value={quickBody}
                onChange={(event) => setQuickBody(event.target.value)}
                placeholder="Share an observation, ask for an intro, post a build update, test a hot take…"
                maxLength={1200}
                className="min-h-44 resize-y border-white/10 bg-white/[0.035] text-[16px] leading-7 text-white placeholder:text-white/24"
              />
              <span className="text-right font-mono text-[9px] text-white/24">{quickBody.length} / 1,200</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="grid gap-2">
                <Label className="text-xs text-white/45">Topic</Label>
                <Select value={category} onValueChange={(value) => setCategory(value ?? "Web3")}>
                  <SelectTrigger className="w-full border-white/10 bg-white/[0.035] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121416] text-white">
                    {CATEGORIES.slice(1).map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <span className="self-end rounded-full border border-white/[0.09] px-3 py-2 text-[10px] text-white/36"><Globe2 className="mr-1.5 inline size-3" />Public</span>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs leading-5 text-white/40">
              {postType === "article" ? "Give readers a clear title, short introduction and the complete article." : "Only the name, summary and public overview are required. Builder details can be added without turning this into a long form."}
            </div>
            <FormField label={postType === "article" ? "Article title" : "Idea name"} value={title} onChange={setTitle} placeholder={postType === "article" ? "A title people want to open" : "A short, memorable name"} />
            <FormField label={postType === "article" ? "One-line takeaway" : "One-line thesis"} value={oneLiner} onChange={setOneLiner} placeholder={postType === "article" ? "What will the reader understand?" : "What changes, for whom, and why now?"} />
            <div className="grid gap-2">
              <Label htmlFor="idea-description" className="text-xs text-white/45">{postType === "article" ? "Introduction" : "Public overview"}</Label>
              <Textarea id="idea-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={postType === "article" ? "Set up the question, story or lesson in plain language." : "Explain the problem, your insight and the approach in plain language."} className="min-h-32 resize-y border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="idea-details" className="text-xs text-white/45">{postType === "article" ? "Article body" : "Deeper idea"} <span className="text-white/22">(optional)</span></Label>
              <Textarea id="idea-details" value={fullDetails} onChange={(event) => setFullDetails(event.target.value)} placeholder={postType === "article" ? "Write the complete article. Use blank lines to separate ideas." : "Explain how it could work, the first test, business direction or risks."} maxLength={12000} className="min-h-44 resize-y border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
            </div>
            <div className={cn("grid gap-4", postType === "idea" && "sm:grid-cols-2")}>
              <div className="grid gap-2"><Label className="text-xs text-white/45">Sector</Label><Select value={category} onValueChange={(value) => setCategory(value ?? "AI")}><SelectTrigger className="w-full border-white/10 bg-white/[0.035] text-white"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#121416] text-white">{CATEGORIES.slice(1).map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}</SelectContent></Select></div>
              {postType === "idea" && <div className="grid gap-2"><Label className="text-xs text-white/45">Stage</Label><Select value={stage} onValueChange={(value) => setStage(value ?? "Concept")}><SelectTrigger className="w-full border-white/10 bg-white/[0.035] text-white"><SelectValue /></SelectTrigger><SelectContent className="border-white/10 bg-[#121416] text-white">{STAGES.slice(1).map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}</SelectContent></Select></div>}
            </div>
            {postType === "idea" && <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Who or what would help? (optional)" value={ask} onChange={setAsk} placeholder="Engineer, investor, pilot users…" />
              <FormField label="Strongest proof (optional)" value={evidence} onChange={setEvidence} placeholder="Interviews, waitlist, prototype…" />
            </div>}
            {postType === "idea" && <AccessModePicker mode={accessMode} threshold={trustThreshold} onMode={(mode) => { setAccessMode(mode); setDisclosure(mode === "public" ? "open" : "tiered"); }} onThreshold={setTrustThreshold} />}
          </div>
        )}

        <div className="grid gap-2 border-t border-white/[0.07] pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-white/45">Images & video <span className="text-white/22">(optional)</span></Label>
            <span className="font-mono text-[9px] text-white/24">{media.length}/4</span>
          </div>
          <label className="ph-media-uploader">
            <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"><ImageIcon /></span>
            <span><strong>Add image or video</strong><small>Up to four files in this local demo.</small></span>
            <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(event) => { void addMedia(event.target.files); event.target.value = ""; }} />
          </label>
          {!!media.length && (
            <div className="space-y-2">
              {media.map((item) => (
                <div key={item.id} className="ph-media-draft-row">
                  <span className="ph-media-draft-preview">{item.kind === "image" ? <NextImage src={item.url} alt="" fill unoptimized sizes="42px" /> : <Video />}</span>
                  <span className="min-w-0 flex-1"><strong>{item.name}</strong><small>{item.kind}</small></span>
                  {postType === "idea" && disclosure === "tiered" && (
                    <div className="ph-privacy-toggle">
                      <button type="button" className={item.visibility === "public" ? "active" : ""} onClick={() => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, visibility: "public" } : entry))}><Globe2 /> Public</button>
                      <button type="button" className={item.visibility === "private" ? "active" : ""} onClick={() => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, visibility: "private" } : entry))}><Lock /> Private</button>
                    </div>
                  )}
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMedia((current) => current.filter((entry) => entry.id !== item.id))} className="text-white/30 hover:bg-white/10 hover:text-white"><X /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/55 hover:bg-white/10 hover:text-white">Cancel</Button>
          <Button
            type="button"
            disabled={postType === "post" ? quickBody.trim().length < 3 : !ideaReady}
            onClick={publish}
            className="bg-white text-black hover:bg-white/85"
          >
            {postType === "post" ? <Send /> : postType === "article" ? <BookOpen /> : <Rocket />}
            {postType === "post" ? "Post publicly" : postType === "article" ? "Publish article" : "Publish idea"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccessModePicker({
  mode,
  threshold,
  onMode,
  onThreshold,
}: {
  mode: AccessMode;
  threshold: number;
  onMode: (mode: AccessMode) => void;
  onThreshold: (value: number) => void;
}) {
  const choices: Array<{ value: AccessMode; title: string; detail: string; icon: React.ElementType }> = [
    { value: "public", title: "Open to everyone", detail: "Every written section is public", icon: Globe2 },
    { value: "trust", title: "Unlock with trust", detail: "Credible builders enter free", icon: ShieldCheck },
    { value: "paid", title: "Paid builder tiers", detail: "Unlock Builder Kit or Execution Room", icon: CreditCard },
    { value: "hybrid", title: "Trust or paid", detail: "Qualify by credibility or choose a plan", icon: KeyRound },
  ];
  return (
    <div>
      <Label className="text-xs text-white/45">Who can read the deeper builder material?</Label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {choices.map(({ value, title, detail, icon: Icon }) => (
          <button type="button" key={value} onClick={() => onMode(value)} className={cn("ph-disclosure-choice", mode === value && "active")}>
            <Icon /><span><strong>{title}</strong><small>{detail}</small></span>{mode === value && <CheckCircle2 />}
          </button>
        ))}
      </div>
      {(mode === "trust" || mode === "hybrid") && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <ShieldCheck className="size-4 text-white/45" />
          <span className="min-w-0 flex-1"><strong className="block text-xs text-white/65">Trust score required</strong><small className="mt-1 block text-[10px] text-white/30">Builders at or above this credibility unlock the Builder Kit free.</small></span>
          <select value={threshold} onChange={(event) => onThreshold(Number(event.target.value))} className="rounded-lg border border-white/10 bg-black px-3 py-2 text-xs text-white outline-none">
            {[65, 70, 75, 78, 80, 85, 90].map((score) => <option key={score} value={score}>{score}+</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
