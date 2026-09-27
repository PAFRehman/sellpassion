"use client";

import * as React from "react";
import {
  ArrowDown, ArrowUp, CheckCircle2, ChevronRight, CircleDollarSign, Command, Eye, FileText, Gauge, Globe2, Image as ImageIcon,
  KeyRound, Layers3, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Search, Send,
  ShieldCheck, SlidersHorizontal, Sparkles, TrendingUp, UserSearch, Users, Video,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AccessTier, Idea, PassionHouseState, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import {
  CATEGORIES, STAGES, TIER_LABELS, MediaGrid, ScoreRing, SectionHeading, UserAvatar, relativeDate,
} from "@/components/passionhouse/passionhouse-ui";

export function DiscoverView({
  ideas,
  allIdeas,
  usersById,
  currentUserId,
  state,
  search,
  category,
  stage,
  sort,
  onSearch,
  onCategory,
  onStage,
  onSort,
  onOpenIdea,
  onPost,
  onReaction,
  onInterest,
  onOpenProfile,
}: {
  ideas: Idea[];
  allIdeas: Idea[];
  usersById: Record<string, UserProfile>;
  currentUserId: string | null;
  state: PassionHouseState;
  search: string;
  category: string;
  stage: string;
  sort: string;
  onSearch: (value: string) => void;
  onCategory: (value: string) => void;
  onStage: (value: string) => void;
  onSort: (value: string) => void;
  onOpenIdea: (id: string) => void;
  onPost: () => void;
  onReaction: (id: string, reaction: "like" | "dislike") => void;
  onInterest: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const [feedMode, setFeedMode] = React.useState<"for-you" | "ideas" | "posts" | "latest">("for-you");
  const feedIdeas = feedMode === "latest"
    ? [...ideas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : feedMode === "ideas"
      ? ideas.filter((idea) => idea.postType === "idea")
      : feedMode === "posts"
        ? ideas.filter((idea) => idea.postType === "post")
        : ideas;
  const currentUser = currentUserId ? usersById[currentUserId] : null;
  return (
    <>
      <SectionHeading
        eyebrow="Public frequency · live"
        title="The idea feed for people who build."
        detail="Share a quick thought or a complete venture idea. Find credible people, unlock context, pitch funding and move strong signals into execution."
        action={
          <Button type="button" onClick={onPost} className="bg-[#f5f5f5] text-black hover:bg-[#ffffff] sm:hidden">
            <Plus />
            Create post
          </Button>
        }
      />

      <button type="button" className="ph-composer" onClick={onPost}>
        {currentUser && <UserAvatar user={currentUser} className="size-10" />}
        <span className="flex-1 text-left">
          <strong>Share an idea, update or question…</strong>
          <small>One sentence is enough · full ideas are welcome too</small>
        </span>
        <span className="ph-composer-media"><ImageIcon /><Video /></span>
        <span className="ph-composer-action">Publish</span>
      </button>

      <div className="ph-filterbar">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/30" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search ideas, sectors or builders"
            className="h-10 border-0 bg-transparent pl-10 text-[14px] text-white shadow-none placeholder:text-white/25 focus-visible:ring-0"
          />
        </label>
        <div className="hidden h-5 w-px bg-white/10 sm:block" />
        <Select value={category} onValueChange={(value) => onCategory(value ?? "All sectors")}>
          <SelectTrigger className="h-10 border-0 bg-transparent text-white/65 shadow-none hover:text-white focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white">
            {CATEGORIES.map((item) => (
              <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={(value) => onStage(value ?? "All stages")}>
          <SelectTrigger className="hidden h-10 border-0 bg-transparent text-white/65 shadow-none hover:text-white focus-visible:ring-0 md:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white">
            {STAGES.map((item) => (
              <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSort(value ?? "signal")}>
          <SelectTrigger className="hidden h-10 border-0 bg-transparent text-white/65 shadow-none hover:text-white focus-visible:ring-0 lg:flex">
            <SlidersHorizontal className="size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white">
            <SelectItem value="signal" className="focus:bg-white/10 focus:text-white">Highest signal</SelectItem>
            <SelectItem value="newest" className="focus:bg-white/10 focus:text-white">Newest</SelectItem>
            <SelectItem value="interest" className="focus:bg-white/10 focus:text-white">Most interested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5 grid justify-center gap-5 xl:grid-cols-[minmax(0,720px)_310px]">
        <div>
          <div className="ph-feed-tabs">
            <button type="button" className={feedMode === "for-you" ? "active" : ""} onClick={() => setFeedMode("for-you")}>For you</button>
            <button type="button" className={feedMode === "ideas" ? "active" : ""} onClick={() => setFeedMode("ideas")}>Ideas</button>
            <button type="button" className={feedMode === "posts" ? "active" : ""} onClick={() => setFeedMode("posts")}>Quick posts</button>
            <button type="button" className={feedMode === "latest" ? "active" : ""} onClick={() => setFeedMode("latest")}>Latest</button>
            <span>{feedIdeas.length} public posts</span>
          </div>
          <div className="mb-3 mt-4 flex items-center justify-between">
            <p className="text-xs text-white/35">
              <span className="font-medium text-white/65">{feedIdeas.length}</span> posts matched
            </p>
            <div className="flex items-center gap-2 text-[11px] text-white/28">
              <Command className="size-3" />
              Signal blends validation, activity and creator credibility
            </div>
          </div>
          {feedIdeas.length ? (
            <div className="ph-feed">
              {feedIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  creator={usersById[idea.creatorId]}
                  reaction={currentUserId ? state.reactions[idea.id + ":" + currentUserId] : undefined}
                  interested={currentUserId ? state.interests.includes(idea.id + ":" + currentUserId) : false}
                  canViewPrivate={idea.disclosure === "open" || currentUserId === idea.creatorId}
                  onOpen={() => onOpenIdea(idea.id)}
                  onReaction={(reaction) => onReaction(idea.id, reaction)}
                  onInterest={() => onInterest(idea.id)}
                  onOpenProfile={() => onOpenProfile(idea.creatorId)}
                />
              ))}
            </div>
          ) : (
            <div className="ph-empty">
              <Search />
              <h3>No ideas match this signal</h3>
              <p>Clear one of the filters or search a broader problem space.</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onSearch("");
                  onCategory("All sectors");
                  onStage("All stages");
                }}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        <DiscoverRail ideas={allIdeas} usersById={usersById} onOpenIdea={onOpenIdea} onOpenProfile={onOpenProfile} />
      </div>
    </>
  );
}

function IdeaCard({
  idea,
  creator,
  reaction,
  interested,
  canViewPrivate,
  onOpen,
  onReaction,
  onInterest,
  onOpenProfile,
}: {
  idea: Idea;
  creator: UserProfile;
  reaction?: "like" | "dislike";
  interested: boolean;
  canViewPrivate: boolean;
  onOpen: () => void;
  onReaction: (reaction: "like" | "dislike") => void;
  onInterest: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <article className={cn("ph-idea-card group", idea.postType === "post" && "ph-quick-post-card")}>
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          className="flex min-w-0 items-center gap-3 text-left"
          onClick={onOpenProfile}
        >
          <UserAvatar user={creator} className="size-10" />
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <strong className="truncate text-sm font-semibold text-white/88">{creator.name}</strong>
              <ShieldCheck className="size-3 text-white/65" />
            </span>
            <span className="mt-0.5 block truncate text-xs text-white/34">{creator.handle} · {relativeDate(idea.createdAt)}</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <span className="ph-public-pill"><Globe2 />{idea.postType === "post" ? "Quick post" : idea.disclosure === "open" ? "Fully public" : "Public preview"}</span>
          <Button type="button" variant="ghost" size="icon-sm" className="text-white/25 hover:bg-white/10 hover:text-white" aria-label="More options"><MoreHorizontal /></Button>
        </div>
      </div>

      <button type="button" className="mt-5 block w-full text-left" onClick={onOpen}>
        <div className="mb-3 flex items-center gap-2.5">
          <Badge className="border-white/10 bg-white/[0.05] text-[9px] uppercase tracking-[0.12em] text-white/52">{idea.category}</Badge>
          <span className="text-[11px] text-white/28">{idea.stage}</span>
          <span className="ml-auto font-mono text-[10px] text-white/30">SIGNAL {idea.signal}</span>
        </div>
        {idea.postType === "post" ? (
          <p className="max-w-xl whitespace-pre-line text-[16px] leading-7 text-white/72">{idea.description}</p>
        ) : (
          <>
            <h2 className="text-[1.6rem] font-semibold tracking-[-0.05em] text-white">{idea.title}</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/57">{idea.oneLiner}</p>
            <p className="mt-4 line-clamp-4 whitespace-pre-line text-[14px] leading-6 text-white/42">{idea.description}</p>
            <span className="mt-2 inline-flex text-xs font-medium text-white/68">{idea.disclosure === "open" ? "Read complete idea" : "Open public preview"}</span>
          </>
        )}
      </button>

      <div className="mt-4" onClick={(event) => event.stopPropagation()}>
        <MediaGrid media={idea.media} canViewPrivate={canViewPrivate} compact />
      </div>

      {!!idea.validation.length && (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {idea.validation.map((metric) => (
            <div key={metric.label} className="ph-metric"><strong>{metric.value}</strong><span>{metric.label}</span></div>
          ))}
        </div>
      )}

      {!!idea.asks.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {idea.asks.map((ask) => <span key={ask} className="ph-ask"><Sparkles />Seeking {ask}</span>)}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-3">
        <div className="flex items-center gap-0.5">
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-white/35 hover:bg-white/10 hover:text-white" onClick={onOpen}>
            <MessageCircle /> {idea.commentsCount}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 px-2.5 text-white/35 hover:bg-white/10 hover:text-white", reaction === "like" && "bg-white/10 text-[#f5f5f5]")}
            onClick={(event) => {
              event.stopPropagation();
              onReaction("like");
            }}
          >
            <ArrowUp />
            {idea.likes}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn("text-white/25 hover:bg-white/10 hover:text-white", reaction === "dislike" && "bg-white/10 text-white")}
            onClick={(event) => {
              event.stopPropagation();
              onReaction("dislike");
            }}
            aria-label="Dislike idea"
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn("h-8 px-2.5 text-white/35 hover:bg-white/10 hover:text-white", interested && "bg-[#f5f5f5]/10 text-[#f5f5f5]")}
            onClick={(event) => {
              event.stopPropagation();
              onInterest();
            }}
          >
            <Users />
            {idea.interested}
          </Button>
        </div>
        <button type="button" onClick={onOpenProfile} className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-white/28 hover:text-white/70">
          <ShieldCheck className="size-3" /> {creator.credibility} credibility
        </button>
      </div>
    </article>
  );
}

function DiscoverRail({
  ideas,
  usersById,
  onOpenIdea,
  onOpenProfile,
}: {
  ideas: Idea[];
  usersById: Record<string, UserProfile>;
  onOpenIdea: (id: string) => void;
  onOpenProfile: (id: string) => void;
}) {
  const totalInterest = ideas.reduce((sum, idea) => sum + idea.interested, 0);
  return (
    <aside className="hidden space-y-4 xl:block">
      <section className="ph-rail-card ph-rail-card-highlight">
        <div className="flex items-center justify-between">
          <p className="ph-eyebrow">House pulse</p>
          <Gauge className="size-4 text-[#f5f5f5]" />
        </div>
        <p className="mt-5 text-4xl font-medium tracking-[-0.06em] text-white">{totalInterest}</p>
        <p className="mt-1 text-sm text-white/40">builder signals this week</p>
        <div className="mt-5 h-12">
          <div className="ph-sparkline" aria-hidden="true">
            {[20, 35, 29, 48, 43, 67, 78, 72, 90, 96].map((height, index) => (
              <span key={index} style={{ height: height + "%" }} />
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-[#f5f5f5]">
          <TrendingUp className="size-3" />
          18.4% from last week
        </div>
      </section>

      <section className="ph-rail-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/75">People worth knowing</p>
          <UserSearch className="size-4 text-white/25" />
        </div>
        <div className="mt-3 space-y-1">
          {Array.from(new Set(ideas.map((idea) => idea.creatorId))).slice(0, 3).map((userId) => {
            const user = usersById[userId];
            if (!user) return null;
            return (
              <button key={userId} type="button" onClick={() => onOpenProfile(userId)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.05]">
                <UserAvatar user={user} className="size-8" />
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs font-medium text-white/70">{user.name}</strong>
                  <small className="mt-0.5 block truncate text-[10px] text-white/30">{user.title}</small>
                </span>
                <span className="font-mono text-[10px] text-white/45">{user.credibility}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ph-rail-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-white/75">High-conviction asks</p>
          <MoreHorizontal className="size-4 text-white/25" />
        </div>
        <div className="mt-4 space-y-1">
          {ideas.filter((idea) => idea.asks.length).slice(0, 3).map((idea, index) => (
            <button
              type="button"
              key={idea.id}
              onClick={() => onOpenIdea(idea.id)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/[0.05]"
            >
              <span className="w-4 text-xs text-white/22">0{index + 1}</span>
              <UserAvatar user={usersById[idea.creatorId]} className="size-7" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/70">{idea.asks[0]}</p>
                <p className="truncate text-[10px] text-white/30">{idea.title}</p>
              </div>
              <span className="text-xs font-medium text-[#f5f5f5]">{idea.signal}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ph-rail-card">
        <LockKeyhole className="size-4 text-white/35" />
        <h3 className="mt-4 text-sm font-medium text-white/75">Public by default</h3>
        <p className="mt-2 text-xs leading-5 text-white/35">
          Creators can publish everything openly. If they choose a protected preview, full access unlocks instantly in this MVP.
        </p>
        <div className="mt-4 flex gap-1.5">
          {(["Context", "Build", "Full"] as const).map((tier, index) => (
            <span key={tier} className={cn("ph-tier-dot", index === 0 && "ph-tier-dot-active")}>
              {tier}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}

export function IdeaDetailSheet({
  idea,
  creator,
  currentUser,
  state,
  usersById,
  onOpenChange,
  onReaction,
  onInterest,
  onComment,
  onRequestAccess,
  onProposal,
  onFunding,
  onOpenProfile,
}: {
  idea: Idea | null;
  creator: UserProfile | null;
  currentUser: UserProfile | null;
  state: PassionHouseState;
  usersById: Record<string, UserProfile>;
  onOpenChange: (open: boolean) => void;
  onReaction: (id: string, reaction: "like" | "dislike") => void;
  onInterest: (id: string) => void;
  onComment: (ideaId: string, body: string) => void;
  onRequestAccess: (ideaId: string) => void;
  onProposal: (ideaId: string) => void;
  onFunding: (ideaId: string) => void;
  onOpenProfile: (userId: string) => void;
}) {
  const [comment, setComment] = React.useState("");
  if (!idea || !creator) return <Sheet open={false} />;

  const reaction = currentUser ? state.reactions[idea.id + ":" + currentUser.id] : undefined;
  const interested = currentUser ? state.interests.includes(idea.id + ":" + currentUser.id) : false;
  const access = currentUser
    ? state.accessRequests.find(
        (request) => request.ideaId === idea.id && request.userId === currentUser.id && request.status === "approved",
      )
    : undefined;
  const comments = state.comments.filter((item) => item.ideaId === idea.id);
  const funding = state.fundingRequests.find((request) => request.ideaId === idea.id);
  const isOwner = currentUser?.id === idea.creatorId;
  const tierRank: Record<AccessTier, number> = { context: 1, build: 2, full: 3 };
  const accessRank = access?.grantedTier ? tierRank[access.grantedTier] : 0;
  const canReadComplete = idea.disclosure === "open" || isOwner || accessRank >= 2;
  const canViewPrivate = isOwner || accessRank >= 3;
  const hasFullProject = isOwner || accessRank >= 3;
  const isQuickPost = idea.postType === "post";

  return (
    <Sheet open={!!idea} onOpenChange={onOpenChange}>
      <SheetContent className="ph-detail-sheet w-full overflow-y-auto border-white/10 bg-[#070707] p-0 text-white sm:max-w-[720px]">
        <SheetHeader className="border-b border-white/[0.07] px-6 py-5 pr-14 sm:px-8">
          <div className="flex items-center gap-2">
            <Badge className="border-white/10 bg-white/[0.05] text-white/55">{isQuickPost ? "Quick post" : idea.category}</Badge>
            <span className="text-xs text-white/30">{relativeDate(idea.createdAt)}</span>
            {!isQuickPost && <span className="ph-public-pill"><Globe2 />{idea.disclosure === "open" ? "Fully public" : "Public preview"}</span>}
          </div>
          {!isQuickPost && <SheetTitle className="mt-4 text-3xl font-medium tracking-[-0.055em] text-white">{idea.title}</SheetTitle>}
          {!isQuickPost && <SheetDescription className="text-[15px] leading-6 text-white/52">{idea.oneLiner}</SheetDescription>}
        </SheetHeader>

        <div className="space-y-7 px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" className="flex items-center gap-3" onClick={() => onOpenProfile(creator.id)}>
              <UserAvatar user={creator} className="size-10" />
              <div className="text-left">
                <p className="flex items-center gap-1.5 text-sm font-medium text-white">{creator.name}<ShieldCheck className="size-3 text-white/60" /></p>
                <p className="mt-0.5 text-xs text-white/35">{creator.handle} · {creator.credibility} credibility</p>
              </div>
            </button>
            {!isQuickPost && <div className="ph-signal-pill ph-signal-pill-large"><TrendingUp /><strong>{idea.signal}</strong><span>signal</span></div>}
          </div>

          {isQuickPost ? (
            <section className="ph-quick-post-detail">
              <p className="whitespace-pre-line text-[18px] leading-8 text-white/76">{idea.description}</p>
            </section>
          ) : (
            <>
              <section>
                <p className="ph-eyebrow">Public overview</p>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-white/62">{idea.description}</p>
              </section>

              <section className={cn("ph-complete-idea", !canReadComplete && "locked")}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="ph-eyebrow">Complete idea</p>
                    <h3 className="mt-2 text-lg font-medium tracking-[-0.03em] text-white">
                      {canReadComplete ? "The full thinking, visible." : "There is more behind this preview."}
                    </h3>
                  </div>
                  {canReadComplete ? <Eye className="size-5 text-white/60" /> : <LockKeyhole className="size-5 text-white/28" />}
                </div>
                {canReadComplete ? (
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-white/58">{idea.fullDetails}</p>
                ) : (
                  <>
                    <div className="ph-locked-copy mt-4" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                    <Button type="button" onClick={() => onRequestAccess(idea.id)} className="mt-5 w-full bg-white text-black hover:bg-white/85">
                      <KeyRound />Request complete idea · instant in MVP
                    </Button>
                  </>
                )}
                {canReadComplete && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="ph-access-chip"><Globe2 />{idea.disclosure === "open" ? "Creator made the core idea public" : accessRank >= 3 ? "Full Project unlocked" : "Build Plan unlocked"}</span>
                    {access?.accessMethod === "paid" && <span className="ph-access-chip"><CheckCircle2 />Paid demo access {access.amountPaid}</span>}
                  </div>
                )}
              </section>
            </>
          )}

          {!!idea.media.length && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="ph-eyebrow">Media & materials</p>
                <span className="text-[11px] text-white/25">{idea.media.filter((item) => item.visibility === "private").length} protected</span>
              </div>
              <MediaGrid media={idea.media} canViewPrivate={canViewPrivate} />
            </section>
          )}

          {!isQuickPost && !!idea.validation.length && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="ph-eyebrow">Proof so far</p>
                <span className="text-[11px] text-white/25">Creator supplied · community visible</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {idea.validation.map((metric) => <div key={metric.label} className="ph-detail-metric"><strong>{metric.value}</strong><span>{metric.label}</span><small>{metric.detail}</small></div>)}
              </div>
            </section>
          )}

          {!isQuickPost && (
            <section className="ph-project-plans">
              <div className="flex items-center justify-between gap-3">
                <div><p className="ph-eyebrow">Project access plans</p><h3 className="mt-2 text-lg font-medium tracking-[-0.03em] text-white">Go from context to execution.</h3></div>
                <Layers3 className="size-5 text-white/30" />
              </div>
              <div className="mt-4 space-y-2">
                {(["context", "build", "full"] as AccessTier[]).map((tier, index) => {
                  const unlocked = isOwner || tier === "context" || accessRank >= index + 1;
                  const price = idea.accessPricing[tier];
                  return (
                    <div key={tier} className={cn("ph-plan-row", unlocked && "unlocked")}>
                      <span className="ph-access-index">0{index + 1}</span>
                      <span className="min-w-0 flex-1"><strong>{TIER_LABELS[tier]}</strong><small>{idea.accessTiers[tier]}</small></span>
                      <span className="ph-plan-price"><strong>{price === 0 ? "Free" : "$" + price}</strong><small>{price === 0 ? "public" : "one-time"}</small></span>
                      {unlocked ? <CheckCircle2 /> : <LockKeyhole />}
                    </div>
                  );
                })}
              </div>
              {!isOwner && !hasFullProject && (
                <Button type="button" onClick={() => onRequestAccess(idea.id)} className="mt-4 w-full bg-white text-black hover:bg-white/85">
                  <KeyRound />{accessRank ? "Upgrade project access" : "Request or pay for access"}
                </Button>
              )}
              {hasFullProject && !isOwner && <p className="mt-4 flex items-center gap-2 text-xs text-white/40"><CheckCircle2 className="size-4 text-white/65" />Full Project access is active.</p>}
            </section>
          )}

          {!isQuickPost && funding && (
            <button type="button" onClick={() => onFunding(idea.id)} className="ph-detail-funding">
              <span className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"><CircleDollarSign /></span>
              <span className="min-w-0 flex-1 text-left"><small>Funding pitch · {funding.status.replace("-", " ")}</small><strong>{funding.amount} requested</strong><em>{funding.summary}</em></span>
              <ChevronRight className="size-4 text-white/25" />
            </button>
          )}

          {!isQuickPost && !!idea.asks.length && (
            <section>
              <p className="ph-eyebrow">What moves this forward</p>
              <div className="mt-3 flex flex-wrap gap-2">{idea.asks.map((ask) => <span key={ask} className="ph-ask ph-ask-large"><Sparkles />{ask}</span>)}</div>
            </section>
          )}

          {!isQuickPost && canReadComplete && (
            <div className="grid gap-2 sm:grid-cols-2">
              {!isOwner && <Button type="button" variant="outline" className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white" onClick={() => onProposal(idea.id)}><FileText />Pitch how you can help</Button>}
              {isOwner && <Button type="button" className="bg-white text-black hover:bg-white/85" onClick={() => onFunding(idea.id)}><CircleDollarSign />{funding ? "Review funding pitch" : "Pitch for funding"}</Button>}
            </div>
          )}

          <div className="flex items-center gap-2 border-y border-white/[0.07] py-3">
            <Button type="button" variant="ghost" size="sm" className={cn("text-white/45 hover:bg-white/10 hover:text-white", reaction === "like" && "bg-white/10 text-white")} onClick={() => onReaction(idea.id, "like")}><ArrowUp />{idea.likes} useful</Button>
            <Button type="button" variant="ghost" size="sm" className={cn("text-white/45 hover:bg-white/10 hover:text-white", interested && "bg-white/10 text-white")} onClick={() => onInterest(idea.id)}><Users />{interested ? "Interested" : "Mark interested"}</Button>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-white/30"><MessageCircle className="size-3.5" />{idea.commentsCount}</span>
          </div>

          <section>
            <p className="ph-eyebrow">Conversation</p>
            <div className="mt-4 space-y-4">
              {comments.map((item) => {
                const author = usersById[item.userId];
                if (!author) return null;
                return (
                  <div key={item.id} className="flex gap-3">
                    <UserAvatar user={author} className="mt-0.5 size-7" />
                    <div><div className="flex items-center gap-2"><p className="text-xs font-medium text-white/70">{author.name}</p><span className="text-[10px] text-white/24">{relativeDate(item.createdAt)}</span></div><p className="mt-1 text-sm leading-6 text-white/45">{item.body}</p></div>
                  </div>
                );
              })}
              {!comments.length && <p className="text-sm text-white/28">Start the useful conversation.</p>}
            </div>
            <form className="mt-5 flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); onComment(idea.id, comment); setComment(""); }}>
              <Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder={isQuickPost ? "Reply to this post" : "Add a useful question or observation"} className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
              <Button type="submit" size="icon" className="bg-white text-black hover:bg-white/85" disabled={!comment.trim()}><Send /><span className="sr-only">Send comment</span></Button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
