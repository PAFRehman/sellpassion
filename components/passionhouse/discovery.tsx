"use client";

import * as React from "react";
import {
  ArrowUp, BookOpen, CheckCircle2, CircleDollarSign, Coffee, FileText,
  Heart, KeyRound, Lightbulb, LockKeyhole, MessageCircle, Plus, Search, Send,
  ShieldCheck, Sparkles, TrendingUp, Users, X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccessTier, ContentSection, Idea, PassionHouseState, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import {
  CATEGORIES, STAGES, MediaGrid, UserAvatar, compactNumber, relativeDate,
} from "@/components/passionhouse/passionhouse-ui";

type FeedMode = "for-you" | "ideas" | "articles" | "posts";

export function DiscoverView({
  ideas,
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
  onTip,
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
  onTip: (ideaId: string, userId: string, kind?: "tip" | "backing") => void;
  onOpenProfile: (id: string) => void;
}) {
  const [feedMode, setFeedMode] = React.useState<FeedMode>("for-you");
  const feedIdeas = ideas.filter((idea) => {
    if (feedMode === "ideas") return idea.postType === "idea";
    if (feedMode === "articles") return idea.postType === "article";
    if (feedMode === "posts") return idea.postType === "post";
    return true;
  });
  const currentUser = currentUserId ? usersById[currentUserId] : null;

  return (
    <div className="ph-discover-simple">
      <section className="ph-discover-intro">
        <div>
          <p className="ph-eyebrow">Ideas worth building</p>
          <h1>Find the thought you want to help make real.</h1>
          <p>Share an idea, write an article, or post a quick update. Builders can understand it, support it and offer to help.</p>
        </div>
        <Button type="button" onClick={onPost} className="bg-white text-black hover:bg-white/85"><Plus />Share something</Button>
      </section>

      <button type="button" className="ph-composer ph-composer-simple" onClick={onPost}>
        {currentUser ? <UserAvatar user={currentUser} className="size-10" /> : <span className="size-10 rounded-full bg-white/[0.06]" />}
        <span className="flex-1 text-left"><strong>What idea is on your mind?</strong><small>A sentence is enough. Add depth only when it helps.</small></span>
        <span className="ph-composer-action">Post</span>
      </button>

      <div className="ph-stream-tools">
        <div className="ph-stream-tabs" role="tablist" aria-label="Feed type">
          {([
            ["for-you", "For you"],
            ["ideas", "Ideas"],
            ["articles", "Articles"],
            ["posts", "Posts"],
          ] as Array<[FeedMode, string]>).map(([value, label]) => (
            <button type="button" key={value} className={feedMode === value ? "active" : ""} onClick={() => setFeedMode(value)}>{label}</button>
          ))}
        </div>
        <label className="ph-stream-search">
          <Search />
          <Input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search ideas or people" />
        </label>
      </div>

      <div className="ph-stream-filters">
        <Select value={category} onValueChange={(value) => onCategory(value ?? "All sectors")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white">{CATEGORIES.map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={stage} onValueChange={(value) => onStage(value ?? "All stages")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white">{STAGES.map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(value) => onSort(value ?? "signal")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent className="border-white/10 bg-[#121416] text-white"><SelectItem value="signal">Recommended</SelectItem><SelectItem value="newest">Newest</SelectItem><SelectItem value="interest">Most discussed</SelectItem></SelectContent>
        </Select>
        <span>{feedIdeas.length} results</span>
      </div>

      {feedIdeas.length ? (
        <div className="ph-stream">
          {feedIdeas.map((idea) => (
            <FeedItem
              key={idea.id}
              idea={idea}
              creator={usersById[idea.creatorId]}
              reaction={currentUserId ? state.reactions[idea.id + ":" + currentUserId] : undefined}
              interested={currentUserId ? state.interests.includes(idea.id + ":" + currentUserId) : false}
              onOpen={() => onOpenIdea(idea.id)}
              onProfile={() => onOpenProfile(idea.creatorId)}
              onLike={() => onReaction(idea.id, "like")}
              onInterest={() => onInterest(idea.id)}
              onTip={() => onTip(idea.id, idea.creatorId)}
            />
          ))}
        </div>
      ) : (
        <div className="ph-empty"><Search /><h3>Nothing matched</h3><p>Try another topic or clear the filters.</p><Button type="button" variant="outline" onClick={() => { onSearch(""); onCategory("All sectors"); onStage("All stages"); }}>Clear filters</Button></div>
      )}
    </div>
  );
}

function FeedItem({
  idea,
  creator,
  reaction,
  interested,
  onOpen,
  onProfile,
  onLike,
  onInterest,
  onTip,
}: {
  idea: Idea;
  creator: UserProfile;
  reaction?: "like" | "dislike";
  interested: boolean;
  onOpen: () => void;
  onProfile: () => void;
  onLike: () => void;
  onInterest: () => void;
  onTip: () => void;
}) {
  const isPost = idea.postType === "post";
  const isArticle = idea.postType === "article";
  return (
    <article className={cn("ph-stream-card", isPost && "ph-stream-card-post", isArticle && "ph-stream-card-article")}>
      <div className="ph-stream-author">
        <button type="button" onClick={onProfile}><UserAvatar user={creator} className="size-9" /><span><strong>{creator.name}<ShieldCheck /></strong><small>{creator.handle} · {relativeDate(idea.createdAt)}</small></span></button>
        <ContentBadge idea={idea} />
      </div>

      <button type="button" className="ph-stream-content" onClick={onOpen}>
        {isPost ? (
          <p className="ph-stream-post-copy">{idea.description}</p>
        ) : isArticle ? (
          <>
            <div className="ph-article-kicker"><BookOpen />{idea.category}<span>{idea.readingTime} min read</span></div>
            <h2>{idea.title}</h2>
            <p className="ph-stream-thesis">{idea.oneLiner}</p>
            <span className="ph-read-link">Read article <span>→</span></span>
          </>
        ) : (
          <>
            <div className="ph-idea-kicker"><Lightbulb />{idea.category}<span>{idea.stage}</span></div>
            <h2>{idea.title}</h2>
            <p className="ph-stream-thesis">{idea.oneLiner}</p>
            <p className="ph-stream-preview">{idea.description}</p>
            {!!idea.validation.length && <div className="ph-one-proof"><TrendingUp /><span><strong>{idea.validation[0].value}</strong>{idea.validation[0].label}</span><span className="ml-auto">{accessModeLabel(idea)}</span></div>}
          </>
        )}
      </button>

      {!isPost && !!idea.media.length && <div className="mt-4"><MediaGrid media={idea.media.filter((item) => item.visibility === "public").slice(0, 1)} compact /></div>}

      <div className="ph-stream-actions">
        <button type="button" className={reaction === "like" ? "active" : ""} onClick={onLike}><ArrowUp />{compactNumber(idea.likes)}</button>
        <button type="button" onClick={onOpen}><MessageCircle />{idea.commentsCount}</button>
        <button type="button" onClick={onTip}><Coffee />Tip <span>${compactNumber(idea.tipsTotal)}</span></button>
        {idea.postType === "idea" && <button type="button" className={interested ? "active" : ""} onClick={onInterest}><Users />{interested ? "Joined" : "I can help"}</button>}
        <button type="button" className="ph-open-post" onClick={onOpen}>{isArticle ? "Read" : isPost ? "Open" : "View idea"}<span>→</span></button>
      </div>
    </article>
  );
}

function ContentBadge({ idea }: { idea: Idea }) {
  if (idea.postType === "article") return <span className="ph-content-badge article"><BookOpen />Article</span>;
  if (idea.postType === "post") return <span className="ph-content-badge post"><MessageCircle />Post</span>;
  return <span className="ph-content-badge idea"><Lightbulb />Idea</span>;
}

function accessModeLabel(idea: Idea) {
  if (idea.accessMode === "public") return "Fully public";
  if (idea.accessMode === "trust") return "Trust unlock";
  if (idea.accessMode === "paid") return "Paid tiers";
  return "Trust or paid";
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
  onTip,
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
  onTip: (ideaId: string, userId: string, kind?: "tip" | "backing") => void;
  onOpenProfile: (userId: string) => void;
}) {
  const [comment, setComment] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (idea && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [idea?.id]);

  if (!idea || !creator) return <Dialog open={false} />;

  const reaction = currentUser ? state.reactions[idea.id + ":" + currentUser.id] : undefined;
  const interested = currentUser ? state.interests.includes(idea.id + ":" + currentUser.id) : false;
  const access = currentUser ? state.accessRequests.find((request) => request.ideaId === idea.id && request.userId === currentUser.id && request.status === "approved") : undefined;
  const tierRank: Record<AccessTier, number> = { context: 1, build: 2, full: 3 };
  const accessRank = access?.grantedTier ? tierRank[access.grantedTier] : 0;
  const isOwner = currentUser?.id === idea.creatorId;
  const isPublic = idea.accessMode === "public" || idea.postType !== "idea";
  const comments = state.comments.filter((item) => item.ideaId === idea.id);
  const funding = state.fundingRequests.find((request) => request.ideaId === idea.id);
  const canViewPrivate = isOwner || accessRank >= 3;
  const amountTarget = funding ? Number(funding.amount.replace(/[^0-9]/g, "")) : 0;
  const fundingProgress = funding && amountTarget ? Math.min(100, Math.round(((funding.raisedAmount ?? 0) / amountTarget) * 100)) : 0;

  function canRead(section: ContentSection) {
    if (section.access === "public" || isPublic || isOwner) return true;
    if (section.access === "build") return accessRank >= 2;
    return accessRank >= 3;
  }

  return (
    <Dialog open={!!idea} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} fullScreen className="ph-reader-dialog">
        <header className="ph-reader-topbar">
          <button type="button" className="ph-reader-brand" onClick={() => onOpenChange(false)}><span>PH</span><strong>PassionHouse</strong></button>
          <div className="ph-reader-progress"><span style={{ width: idea.progress + "%" }} /></div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onTip(idea.id, creator.id)} className="ph-reader-btn-tip text-white/60 hover:bg-white/10 hover:text-white"><Coffee />Tip</Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} className="ph-reader-btn-close text-white/55 hover:bg-white/10 hover:text-white" aria-label="Close reader"><X /></Button>
          </div>
        </header>

        <div className="ph-reader-scroll" ref={scrollRef}>
          <main className="ph-reader-layout">
            <article className="ph-reader-article">
              <div className="ph-reader-meta"><ContentBadge idea={idea} /><span>{idea.category}</span><span>{idea.postType === "post" ? "1 min" : idea.readingTime + " min read"}</span>{idea.postType === "idea" && <span>{accessModeLabel(idea)}</span>}</div>
              {idea.postType === "post" ? (
                <DialogTitle className="ph-reader-post-title">{idea.description}</DialogTitle>
              ) : (
                <>
                  <DialogTitle className="ph-reader-title">{idea.title}</DialogTitle>
                  <DialogDescription className="ph-reader-deck">{idea.oneLiner}</DialogDescription>
                </>
              )}

              <div className="ph-reader-author-row">
                <button type="button" onClick={() => onOpenProfile(creator.id)}><UserAvatar user={creator} className="size-11" /><span><strong>{creator.name}<ShieldCheck /></strong><small>{creator.title} · {relativeDate(idea.createdAt)}</small></span></button>
                <div><button type="button" className={reaction === "like" ? "active" : ""} onClick={() => onReaction(idea.id, "like")}><ArrowUp />{idea.likes}</button><button type="button" onClick={() => onTip(idea.id, creator.id)}><Heart />Support</button></div>
              </div>

              {!!idea.media.length && <MediaGrid media={idea.media} canViewPrivate={canViewPrivate} />}

              {idea.postType === "post" && <p className="ph-reader-lead">Join the conversation below, tip the creator, or open their profile to see what else they are building.</p>}

              {idea.postType !== "post" && (
                <div className="ph-reader-sections">
                  {idea.sections.map((section, index) => canRead(section) ? (
                    <section key={section.id} className="ph-reader-section">
                      <div className="ph-reader-section-number">{String(index + 1).padStart(2, "0")}</div>
                      <div><p className="ph-eyebrow">{section.label}</p><h2>{section.title}</h2>{section.body.split("\n\n").map((paragraph) => <p key={paragraph.slice(0, 36)}>{paragraph}</p>)}{!!section.bullets?.length && <ul>{section.bullets.map((bullet) => <li key={bullet}><CheckCircle2 />{bullet}</li>)}</ul>}</div>
                    </section>
                  ) : (
                    <section key={section.id} className="ph-reader-section ph-reader-section-locked">
                      <div className="ph-reader-section-number"><LockKeyhole /></div>
                      <div><p className="ph-eyebrow">{section.access === "build" ? "Builder Kit" : "Execution Room"}</p><h2>{section.title}</h2><p>This section contains the real {section.access === "build" ? "product workflow, validation and builder brief" : "roadmap, commercial direction, risks and protected materials"}.</p><Button type="button" onClick={() => onRequestAccess(idea.id)} className="mt-4 bg-white text-black hover:bg-white/85"><KeyRound />See access options</Button></div>
                    </section>
                  ))}
                </div>
              )}

              {idea.postType === "idea" && !!idea.validation.length && (
                <section className="ph-reader-proof"><p className="ph-eyebrow">Evidence so far</p><div>{idea.validation.map((metric) => <span key={metric.label}><strong>{metric.value}</strong><small>{metric.label}</small><em>{metric.detail}</em></span>)}</div></section>
              )}

              <section className="ph-reader-comments">
                <div className="flex items-center justify-between"><div><p className="ph-eyebrow">Discussion</p><h2>{comments.length} thoughtful responses</h2></div><MessageCircle /></div>
                <form onSubmit={(event) => { event.preventDefault(); if (!comment.trim()) return; onComment(idea.id, comment); setComment(""); }}><Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a useful thought, question or offer…" /><Button type="submit" size="icon"><Send /></Button></form>
                <div className="space-y-3">{comments.map((item) => { const author = usersById[item.userId]; return author ? <div key={item.id} className="ph-reader-comment"><UserAvatar user={author} className="size-8" /><span><strong>{author.name}<small>{relativeDate(item.createdAt)}</small></strong><p>{item.body}</p></span></div> : null; })}</div>
              </section>
            </article>

            <aside className="ph-reader-rail">
              <section className="ph-reader-action-card">
                <p className="ph-eyebrow">Support this {idea.postType}</p>
                <h3>${compactNumber(idea.tipsTotal)} sent by {idea.tipCount} people</h3>
                <p>Reward useful thinking or help this work move forward.</p>
                <Button type="button" onClick={() => onTip(idea.id, creator.id)} className="w-full bg-white text-black hover:bg-white/85"><Coffee />Tip or back</Button>
              </section>

              {idea.postType === "idea" && (
                <section className="ph-reader-action-card">
                  <div className="flex items-center justify-between"><p className="ph-eyebrow">Idea access</p><ShieldCheck className="size-4 text-white/35" /></div>
                  <h3>{accessRank >= 3 || isOwner || isPublic ? "Complete idea available" : accessRank >= 2 ? "Builder Kit unlocked" : accessModeLabel(idea)}</h3>
                  <p>{isPublic ? "The creator made every written section public." : idea.accessMode === "trust" ? `Builders with ${idea.trustThreshold}+ credibility can unlock the Builder Kit free.` : idea.accessMode === "paid" ? "Choose a one-time Builder Kit or Execution Room plan." : `Qualify with ${idea.trustThreshold}+ credibility or choose a paid plan.`}</p>
                  {!isOwner && !isPublic && accessRank < 3 && <Button type="button" onClick={() => onRequestAccess(idea.id)} variant="outline" className="w-full border-white/12 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"><KeyRound />{accessRank >= 2 ? "Unlock Execution Room" : "View access options"}</Button>}
                </section>
              )}

              {idea.postType === "idea" && !!idea.buildNeeds.length && (
                <section className="ph-reader-action-card"><p className="ph-eyebrow">People needed</p><div className="ph-builder-needs">{idea.buildNeeds.map((need) => <div key={need.role}><Sparkles /><span><strong>{need.role}</strong><small>{need.commitment}</small></span></div>)}</div>{!isOwner && <Button type="button" onClick={() => onProposal(idea.id)} variant="outline" className="w-full border-white/12 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"><FileText />Offer to help build</Button>}</section>
              )}

              {idea.postType === "idea" && funding && (
                <section className="ph-reader-action-card ph-reader-funding-card"><p className="ph-eyebrow">Funding the next milestone</p><h3>{funding.amount} target</h3><p>{funding.summary}</p><div className="ph-fund-progress"><span style={{ width: fundingProgress + "%" }} /></div><div className="flex justify-between text-[10px] text-white/35"><span>${compactNumber(funding.raisedAmount)} raised</span><span>{funding.backerCount ?? 0} backers</span></div><Button type="button" onClick={() => onTip(idea.id, creator.id, "backing")} className="w-full bg-white text-black hover:bg-white/85"><CircleDollarSign />Back this milestone</Button></section>
              )}

              {idea.postType === "idea" && isOwner && <Button type="button" onClick={() => onFunding(idea.id)} variant="outline" className="w-full border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white"><CircleDollarSign />{funding ? "Manage funding" : "Create a funding ask"}</Button>}
              {idea.postType === "idea" && !isOwner && <Button type="button" onClick={() => onInterest(idea.id)} variant="ghost" className={cn("w-full text-white/55 hover:bg-white/10 hover:text-white", interested && "bg-white/[0.06] text-white")}><Users />{interested ? "You joined the builder list" : "I am interested"}</Button>}
            </aside>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
