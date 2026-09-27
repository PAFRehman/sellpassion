"use client";

import * as React from "react";
import {
  BriefcaseBusiness, Check, CheckCircle2, ChevronRight, Clock3, FileText, Handshake,
  Inbox, MoreHorizontal, Paperclip, Send, ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccessRequest, AccessTier, DealRoom, Idea, Proposal, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import { CompactEmpty, SectionHeading, TIER_LABELS, UserAvatar, relativeDate } from "@/components/passionhouse/passionhouse-ui";

export function RequestsView({
  requests,
  ideas,
  usersById,
  onResolve,
  onOpenIdea,
}: {
  requests: AccessRequest[];
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  onResolve: (requestId: string, status: "approved" | "declined", grantedTier?: AccessTier) => void;
  onOpenIdea: (id: string) => void;
}) {
  const pending = requests.filter((request) => request.status === "pending");
  const resolved = requests.filter((request) => request.status !== "pending");
  return (
    <>
      <SectionHeading
        eyebrow="Creator control"
        title="Reveal with intention."
        detail="Review who is asking, why they fit, and exactly how much context they need. You can approve a smaller tier than requested."
      />
      {!requests.length ? (
        <div className="ph-empty">
          <Inbox />
          <h3>No access requests yet</h3>
          <p>Requests for ideas you publish will arrive here with the requester’s credibility.</p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            {pending.map((request) => {
              const user = usersById[request.userId];
              const idea = ideas.find((item) => item.id === request.ideaId);
              if (!user || !idea) return null;
              return (
                <article key={request.id} className="ph-request-card">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                    <div className="flex gap-3.5">
                      <UserAvatar user={user} className="size-11" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-medium text-white">{user.name}</h2>
                          <Badge className="border-[#f5f5f5]/20 bg-[#f5f5f5]/10 text-[#f5f5f5]">
                            <ShieldCheck />
                            {user.credibility}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-white/42">{user.title}</p>
                        <button type="button" onClick={() => onOpenIdea(idea.id)} className="mt-2 text-xs text-white/30 hover:text-white">
                          For <span className="text-white/65">{idea.title}</span> · requested {TIER_LABELS[request.requestedTier]}
                        </button>
                      </div>
                    </div>
                    <span className="text-[11px] text-white/25">{relativeDate(request.createdAt)}</span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-[150px_minmax(0,1fr)]">
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-white/27">Intended role</p>
                      <p className="mt-2 text-sm text-white/66">{request.role}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                      <p className="text-[10px] uppercase tracking-[0.13em] text-white/27">Why them</p>
                      <p className="mt-2 text-sm leading-6 text-white/52">{request.note}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
                    <span className="mr-1 text-xs text-white/30">Grant:</span>
                    {(["context", "build", "full"] as AccessTier[]).map((tier) => (
                      <Button
                        type="button"
                        key={tier}
                        size="sm"
                        variant="outline"
                        onClick={() => onResolve(request.id, "approved", tier)}
                        className={cn(
                          "border-white/10 bg-white/[0.035] text-white/58 hover:bg-white/10 hover:text-white",
                          tier === request.requestedTier && "border-[#f5f5f5]/25 text-[#f5f5f5]",
                        )}
                      >
                        {TIER_LABELS[tier]}
                      </Button>
                    ))}
                    <Button type="button" variant="ghost" size="sm" onClick={() => onResolve(request.id, "declined")} className="ml-auto text-white/32 hover:bg-white/10 hover:text-white">
                      Decline
                    </Button>
                  </div>
                </article>
              );
            })}
            {!pending.length && (
              <div className="ph-empty">
                <CheckCircle2 />
                <h3>You are caught up</h3>
                <p>Every current request has been reviewed.</p>
              </div>
            )}
          </div>
          <aside className="ph-rail-card h-fit">
            <p className="ph-eyebrow">Recent decisions</p>
            <div className="mt-4 space-y-4">
              {resolved.map((request) => {
                const user = usersById[request.userId];
                const idea = ideas.find((item) => item.id === request.ideaId);
                if (!user || !idea) return null;
                return (
                  <div key={request.id} className="flex gap-3">
                    <UserAvatar user={user} className="size-7" />
                    <div>
                      <p className="text-xs text-white/62">
                        {request.status === "approved" ? "Granted " + TIER_LABELS[request.grantedTier ?? "context"] : "Declined"} to {user.name}
                      </p>
                      <p className="mt-1 text-[10px] text-white/27">{idea.title} · {relativeDate(request.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function ProposalsView({
  proposals,
  ideas,
  usersById,
  currentUserId,
  onAccept,
  onOpenIdea,
}: {
  proposals: Proposal[];
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  currentUserId: string | null;
  onAccept: (proposal: Proposal) => void;
  onOpenIdea: (id: string) => void;
}) {
  const received = proposals.filter((proposal) => proposal.toUserId === currentUserId);
  const sent = proposals.filter((proposal) => proposal.fromUserId === currentUserId);
  return (
    <>
      <SectionHeading
        eyebrow="Structured collaboration"
        title="Turn fit into terms."
        detail="Compare concrete outcomes, scope, timing and budget before deciding to open a shared execution room."
      />
      <Tabs defaultValue="received">
        <TabsList variant="line" className="mb-5 border-b border-white/[0.07] text-white/40">
          <TabsTrigger value="received" className="px-4 text-white/45 data-[state=active]:text-white">Received ({received.length})</TabsTrigger>
          <TabsTrigger value="sent" className="px-4 text-white/45 data-[state=active]:text-white">Sent ({sent.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="received" className="space-y-4">
          {received.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} idea={ideas.find((idea) => idea.id === proposal.ideaId)} person={usersById[proposal.fromUserId]} received onAccept={() => onAccept(proposal)} onOpenIdea={onOpenIdea} />
          ))}
          {!received.length && <CompactEmpty icon={FileText} title="No proposals received" />}
        </TabsContent>
        <TabsContent value="sent" className="space-y-4">
          {sent.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} idea={ideas.find((idea) => idea.id === proposal.ideaId)} person={usersById[proposal.toUserId]} onOpenIdea={onOpenIdea} />
          ))}
          {!sent.length && <CompactEmpty icon={Send} title="No proposals sent" />}
        </TabsContent>
      </Tabs>
    </>
  );
}

function ProposalCard({
  proposal,
  idea,
  person,
  received,
  onAccept,
  onOpenIdea,
}: {
  proposal: Proposal;
  idea?: Idea;
  person: UserProfile;
  received?: boolean;
  onAccept?: () => void;
  onOpenIdea: (id: string) => void;
}) {
  return (
    <article className="ph-proposal-card">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-2">
            <Badge className={cn("border-white/10 bg-white/[0.05] text-white/50", proposal.status === "accepted" && "border-[#f5f5f5]/20 bg-[#f5f5f5]/10 text-[#f5f5f5]")}>
              {proposal.status}
            </Badge>
            {idea && <button type="button" onClick={() => onOpenIdea(idea.id)} className="text-xs text-white/32 hover:text-white">{idea.title}</button>}
          </div>
          <h2 className="mt-4 text-xl font-medium tracking-[-0.035em] text-white">{proposal.title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">{proposal.summary}</p>
        </div>
        <div className="flex items-center gap-2 sm:items-start">
          <UserAvatar user={person} className="size-8" />
          <div>
            <p className="text-xs font-medium text-white/65">{received ? "From " : "To "}{person.name}</p>
            <p className="mt-1 text-[10px] text-white/28">{person.credibility} credibility</p>
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_130px_140px]">
        <div className="ph-proposal-field">
          <span>Scope</span>
          <p>{proposal.scope}</p>
        </div>
        <div className="ph-proposal-field">
          <span>Timeline</span>
          <p>{proposal.timeline}</p>
        </div>
        <div className="ph-proposal-field">
          <span>Budget</span>
          <p>{proposal.budget}</p>
        </div>
      </div>
      {received && proposal.status === "sent" && (
        <div className="mt-4 flex justify-end gap-2 border-t border-white/[0.07] pt-4">
          <Button type="button" variant="ghost" className="text-white/38 hover:bg-white/10 hover:text-white">Discuss</Button>
          <Button type="button" onClick={onAccept} className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]">
            <Handshake />
            Accept & open deal room
          </Button>
        </div>
      )}
    </article>
  );
}

export function DealsView({
  deals,
  selectedDeal,
  ideas,
  usersById,
  currentUserId,
  onSelect,
  onSendMessage,
  onAdvanceMilestone,
  onAttachDocument,
}: {
  deals: DealRoom[];
  selectedDeal: DealRoom | null;
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  currentUserId: string | null;
  onSelect: (id: string) => void;
  onSendMessage: (dealId: string, body: string) => void;
  onAdvanceMilestone: (dealId: string, milestoneId: string) => void;
  onAttachDocument: (dealId: string, file: File) => void;
}) {
  const [message, setMessage] = React.useState("");
  if (!deals.length || !selectedDeal) {
    return (
      <>
        <SectionHeading eyebrow="Private execution" title="Build in one room." detail="Accepted proposals become focused workspaces for chat, milestones, documents and agreed terms." />
        <div className="ph-empty">
          <Handshake />
          <h3>No active deal rooms</h3>
          <p>Accept a proposal to open a private execution room.</p>
        </div>
      </>
    );
  }
  const idea = ideas.find((item) => item.id === selectedDeal.ideaId);
  const partnerIds = selectedDeal.participantIds.filter((id) => id !== currentUserId);
  const completion = Math.round(
    (selectedDeal.milestones.filter((milestone) => milestone.status === "complete").length / selectedDeal.milestones.length) * 100,
  );
  return (
    <>
      <SectionHeading
        eyebrow="Private execution"
        title="Build in one room."
        detail="Chat, milestones, documents and the accepted terms stay attached to the work—not scattered across tools."
      />
      <div className="ph-deal-layout">
        <aside className="ph-deal-list">
          <p className="px-3 pb-3 text-[10px] uppercase tracking-[0.13em] text-white/25">Active rooms</p>
          {deals.map((deal) => {
            const dealIdea = ideas.find((item) => item.id === deal.ideaId);
            return (
              <button type="button" key={deal.id} onClick={() => onSelect(deal.id)} className={cn("ph-deal-list-item", selectedDeal.id === deal.id && "ph-deal-list-item-active")}>
                <div className="flex items-center justify-between gap-2">
                  <strong>{dealIdea?.title ?? "Deal room"}</strong>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#f5f5f5]" />
                </div>
                <span>{deal.agreement.title}</span>
              </button>
            );
          })}
        </aside>
        <section className="ph-deal-room">
          <header className="ph-deal-header">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f5f5f5] shadow-[0_0_12px_#f5f5f5]" />
                <p className="text-[10px] uppercase tracking-[0.14em] text-[#f5f5f5]">Active collaboration</p>
              </div>
              <h2 className="mt-2 text-2xl font-medium tracking-[-0.045em] text-white">{idea?.title}</h2>
              <p className="mt-1 text-sm text-white/38">{selectedDeal.agreement.title}</p>
            </div>
            <div className="flex -space-x-2">
              {selectedDeal.participantIds.map((id) => usersById[id] && <UserAvatar key={id} user={usersById[id]} className="size-9 ring-2 ring-[#0c0e10]" />)}
            </div>
          </header>
          <Tabs defaultValue="room" className="min-h-0 flex-1">
            <TabsList variant="line" className="w-full justify-start border-b border-white/[0.07] px-5 text-white/40">
              <TabsTrigger value="room" className="px-3 text-white/45 data-[state=active]:text-white">Room</TabsTrigger>
              <TabsTrigger value="milestones" className="px-3 text-white/45 data-[state=active]:text-white">Milestones</TabsTrigger>
              <TabsTrigger value="documents" className="px-3 text-white/45 data-[state=active]:text-white">Documents</TabsTrigger>
              <TabsTrigger value="terms" className="px-3 text-white/45 data-[state=active]:text-white">Terms</TabsTrigger>
            </TabsList>
            <TabsContent value="room" className="flex min-h-[500px] flex-col p-5">
              <div className="mb-5 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/45">Current milestone</span>
                  <span className="text-[#f5f5f5]">{completion}% complete</span>
                </div>
                <Progress value={completion} className="mt-3 h-1 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#f5f5f5]" />
              </div>
              <div className="flex-1 space-y-4">
                {selectedDeal.messages.map((item) => {
                  const author = usersById[item.userId];
                  const mine = item.userId === currentUserId;
                  return (
                    <div key={item.id} className={cn("flex gap-2.5", mine && "flex-row-reverse")}>
                      <UserAvatar user={author} className="mt-1 size-7" />
                      <div className={cn("max-w-[78%]", mine && "text-right")}>
                        <div className={cn("rounded-2xl px-4 py-3 text-left text-sm leading-6", mine ? "rounded-tr-sm bg-white text-black" : "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-white/58")}>
                          {item.body}
                        </div>
                        <span className="mt-1 inline-block text-[10px] text-white/22">{author.name} · {relativeDate(item.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  onSendMessage(selectedDeal.id, message);
                  setMessage("");
                }}
              >
                <Input value={message} onChange={(event) => setMessage(event.target.value)} placeholder={"Message " + partnerIds.map((id) => usersById[id]?.name.split(" ")[0]).join(", ")} className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
                <Button type="submit" size="icon" disabled={!message.trim()} className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]"><Send /><span className="sr-only">Send</span></Button>
              </form>
            </TabsContent>
            <TabsContent value="milestones" className="space-y-3 p-5">
              {selectedDeal.milestones.map((milestone, index) => (
                <div key={milestone.id} className={cn("ph-milestone", milestone.status === "active" && "ph-milestone-active")}>
                  <div className={cn("ph-milestone-state", milestone.status === "complete" && "ph-milestone-state-complete")}>
                    {milestone.status === "complete" ? <Check /> : <span>0{index + 1}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white/72">{milestone.title}</p>
                    <p className="mt-1 text-xs text-white/30">{milestone.due} · {milestone.amount}</p>
                  </div>
                  {milestone.status === "active" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => onAdvanceMilestone(selectedDeal.id, milestone.id)} className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">
                      Mark complete
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
            <TabsContent value="documents" className="p-5">
              <div className="space-y-2">
                {selectedDeal.documents.map((document) => (
                  <div key={document.id} className="ph-document-row">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/[0.05]"><FileText className="size-4 text-white/40" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white/68">{document.name}</p>
                      <p className="mt-0.5 text-[10px] text-white/26">{document.size} · {usersById[document.uploadedBy]?.name}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-sm" className="text-white/25 hover:bg-white/10 hover:text-white"><MoreHorizontal /></Button>
                  </div>
                ))}
              </div>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/38 transition hover:border-white/20 hover:bg-white/[0.03] hover:text-white">
                <Paperclip className="size-4" />
                Attach a document
                <input
                  type="file"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onAttachDocument(selectedDeal.id, file);
                    event.target.value = "";
                  }}
                />
              </label>
            </TabsContent>
            <TabsContent value="terms" className="p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Agreed scope", selectedDeal.agreement.title],
                  ["Budget", selectedDeal.agreement.budget],
                  ["Timeline", selectedDeal.agreement.timeline],
                  ["Ownership", selectedDeal.agreement.ownership],
                ].map(([label, value]) => (
                  <div key={label} className="ph-term-card">
                    <span>{label}</span>
                    <p>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-xl border border-[#f5f5f5]/15 bg-[#f5f5f5]/[0.04] p-4">
                <p className="text-xs font-medium text-[#f5f5f5]">Platform position</p>
                <p className="mt-2 text-sm text-white/55">{selectedDeal.agreement.platformEquity}</p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </>
  );
}

