"use client";

import * as React from "react";
import {
  Bell, CircleDollarSign, FileText, Handshake, Inbox, LayoutGrid, LogOut, Menu,
  Plus, Radio, RefreshCcw, ShieldCheck, UserSearch, UserRound, Users, X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { AccessRequestDialog, PostIdeaDialog, ProposalDialog, type AccessSubmission, type PostSubmission } from "@/components/passionhouse/composer-dialogs";
import { DealsView, ProposalsView, RequestsView } from "@/components/passionhouse/collaboration-views";
import { DiscoverView, IdeaDetailSheet } from "@/components/passionhouse/discovery";
import { FundingPitchDialog, FundingView, type FundingSubmission } from "@/components/passionhouse/funding";
import { AuthDialog, PeopleView, ProfileView, PublicProfileSheet } from "@/components/passionhouse/people-views";
import { TipDialog, type TipSubmission } from "@/components/passionhouse/support-dialogs";
import {
  AmbientCursor, Brand, FloatingPostButton, ScoreRing, TIER_LABELS, UserAvatar, VIEW_LABELS,
  hashPassword, stateId,
} from "@/components/passionhouse/passionhouse-ui";
import { freshDemoState } from "@/lib/passionhouse-demo";
import { localRepository } from "@/lib/passionhouse-repository";
import type {
  AccessTier, FundingRequest, Idea, PassionHouseState, Proposal, SocialPlatform,
  UserProfile, ViewKey,
} from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";

type WebMCPContext = {
  registerTool: (
    tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema: object;
      annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
      execute: (input: unknown) => unknown | Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => void | Promise<void>;
};

export function PassionHouseApp() {
  const [state, setState] = React.useState<PassionHouseState>(() => freshDemoState());
  const [hydrated, setHydrated] = React.useState(false);
  const [view, setView] = React.useState<ViewKey>("discover");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("All sectors");
  const [stage, setStage] = React.useState("All stages");
  const [sort, setSort] = React.useState("signal");
  const [selectedIdeaId, setSelectedIdeaId] = React.useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = React.useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = React.useState<string | null>("deal-nightjar");
  const [postOpen, setPostOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [requestIdeaId, setRequestIdeaId] = React.useState<string | null>(null);
  const [proposalIdeaId, setProposalIdeaId] = React.useState<string | null>(null);
  const [fundingIdeaId, setFundingIdeaId] = React.useState<string | null>(null);
  const [tipTarget, setTipTarget] = React.useState<{ userId: string; ideaId?: string; kind?: "tip" | "backing" } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    const loaded = localRepository.load();
    setState(loaded);
    stateRef.current = loaded;
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    stateRef.current = state;
    if (hydrated) localRepository.save(state);
  }, [state, hydrated]);

  React.useEffect(() => {
    const doc = document as Document & { modelContext?: WebMCPContext };
    const context = doc.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await context.registerTool(
        {
          name: "search_ideas",
          title: "Search ideas",
          description: "Search the PassionHouse idea marketplace and show matching ideas in the visible Discover view.",
          inputSchema: {
            type: "object",
            properties: { query: { type: "string", minLength: 1 } },
            required: ["query"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute(input) {
            const query =
              typeof input === "object" && input && "query" in input
                ? String((input as { query: unknown }).query).trim()
                : "";
            if (!query) throw new Error("A non-empty query is required.");
            setSearch(query);
            setView("discover");
            const matches = stateRef.current.ideas.filter((idea) =>
              [idea.title, idea.oneLiner, idea.category, ...idea.tags]
                .join(" ")
                .toLowerCase()
                .includes(query.toLowerCase()),
            );
            return { count: matches.length, ideaIds: matches.map((idea) => idea.id) };
          },
        },
        { signal: lifecycle.signal },
      );
      await context.registerTool(
        {
          name: "start_idea_submission",
          title: "Start an idea submission",
          description: "Open the same Post an idea flow available in the PassionHouse interface.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute() {
            setPostOpen(true);
            return { status: "submission_opened" };
          },
        },
        { signal: lifecycle.signal },
      );
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  const currentUser = state.users.find((user) => user.id === state.currentUserId) ?? null;
  const selectedIdea = state.ideas.find((idea) => idea.id === selectedIdeaId) ?? null;
  const selectedProfile = state.users.find((user) => user.id === selectedProfileId) ?? null;
  const requestIdea = state.ideas.find((idea) => idea.id === requestIdeaId) ?? null;
  const proposalIdea = state.ideas.find((idea) => idea.id === proposalIdeaId) ?? null;
  const fundingIdea = state.ideas.find((idea) => idea.id === fundingIdeaId) ?? null;
  const tipRecipient = state.users.find((user) => user.id === tipTarget?.userId) ?? null;
  const tipIdea = state.ideas.find((idea) => idea.id === tipTarget?.ideaId) ?? null;
  const selectedDeal = state.dealRooms.find((deal) => deal.id === selectedDealId) ?? state.dealRooms[0] ?? null;

  const usersById = React.useMemo(
    () => Object.fromEntries(state.users.map((user) => [user.id, user])),
    [state.users],
  );

  const ownedIdeaIds = React.useMemo(
    () => new Set(state.ideas.filter((idea) => idea.creatorId === state.currentUserId).map((idea) => idea.id)),
    [state.ideas, state.currentUserId],
  );

  const pendingRequests = state.accessRequests.filter(
    (request) => ownedIdeaIds.has(request.ideaId) && request.status === "pending",
  );
  const receivedProposals = state.proposals.filter((proposal) => proposal.toUserId === state.currentUserId);
  const activeDeals = state.dealRooms.filter((deal) => deal.participantIds.includes(state.currentUserId ?? ""));

  const filteredIdeas = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = state.ideas.filter((idea) => {
      const creator = state.users.find((user) => user.id === idea.creatorId);
      const haystack = [idea.title, idea.oneLiner, idea.description, idea.category, creator?.name ?? "", creator?.handle ?? "", ...idea.tags, ...idea.asks]
        .join(" ")
        .toLowerCase();
      return (
        (!query || haystack.includes(query)) &&
        (category === "All sectors" || idea.category === category) &&
        (stage === "All stages" || idea.stage === stage)
      );
    });
    return next.sort((a, b) => {
      if (sort === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === "interest") return b.interested - a.interested;
      return b.signal - a.signal;
    });
  }, [state.ideas, state.users, search, category, stage, sort]);

  function requireUser() {
    if (currentUser) return true;
    setAuthOpen(true);
    toast.info("Choose or create a local profile to continue.");
    return false;
  }

  function switchView(next: ViewKey) {
    setView(next);
    setMobileNavOpen(false);
  }

  function toggleReaction(ideaId: string, reaction: "like" | "dislike") {
    if (!requireUser() || !state.currentUserId) return;
    const key = ideaId + ":" + state.currentUserId;
    setState((previous) => {
      const existing = previous.reactions[key];
      const nextReactions = { ...previous.reactions };
      if (existing === reaction) delete nextReactions[key];
      else nextReactions[key] = reaction;
      return {
        ...previous,
        reactions: nextReactions,
        ideas: previous.ideas.map((idea) => {
          if (idea.id !== ideaId) return idea;
          let likes = idea.likes;
          let dislikes = idea.dislikes;
          if (existing === "like") likes -= 1;
          if (existing === "dislike") dislikes -= 1;
          if (existing !== reaction && reaction === "like") likes += 1;
          if (existing !== reaction && reaction === "dislike") dislikes += 1;
          return { ...idea, likes, dislikes };
        }),
      };
    });
  }

  function toggleInterest(ideaId: string) {
    if (!requireUser() || !state.currentUserId) return;
    const key = ideaId + ":" + state.currentUserId;
    setState((previous) => {
      const active = previous.interests.includes(key);
      return {
        ...previous,
        interests: active
          ? previous.interests.filter((item) => item !== key)
          : [...previous.interests, key],
        ideas: previous.ideas.map((idea) =>
          idea.id === ideaId
            ? { ...idea, interested: Math.max(0, idea.interested + (active ? -1 : 1)) }
            : idea,
        ),
      };
    });
  }

  function addComment(ideaId: string, body: string) {
    if (!requireUser() || !state.currentUserId || !body.trim()) return;
    setState((previous) => ({
      ...previous,
      comments: [
        ...previous.comments,
        {
          id: stateId("comment"),
          ideaId,
          userId: previous.currentUserId as string,
          body: body.trim(),
          createdAt: new Date().toISOString(),
        },
      ],
      ideas: previous.ideas.map((idea) =>
        idea.id === ideaId ? { ...idea, commentsCount: idea.commentsCount + 1 } : idea,
      ),
    }));
    toast.success("Comment added");
  }

  function openTip(userId: string, ideaId?: string, kind: "tip" | "backing" = "tip") {
    if (!requireUser() || !state.currentUserId) return;
    if (userId === state.currentUserId) {
      toast.info("Choose another creator or builder to support in this demo.");
      return;
    }
    setTipTarget({ userId, ideaId, kind });
  }

  function submitTip(recipient: UserProfile, idea: Idea | null, input: TipSubmission) {
    if (!state.currentUserId) return;
    setState((previous) => ({
      ...previous,
      tips: [
        {
          id: stateId("tip"),
          fromUserId: previous.currentUserId as string,
          toUserId: recipient.id,
          ideaId: idea?.id,
          amount: input.amount,
          note: input.note,
          kind: input.kind,
          createdAt: new Date().toISOString(),
        },
        ...previous.tips,
      ],
      ideas: idea
        ? previous.ideas.map((item) => item.id === idea.id ? {
            ...item,
            tipsTotal: item.tipsTotal + input.amount,
            tipCount: item.tipCount + 1,
            backerCount: item.backerCount + (input.kind === "backing" ? 1 : 0),
          } : item)
        : previous.ideas,
    }));
    setTipTarget(null);
    toast.success(input.kind === "backing" ? `You backed ${idea?.title ?? recipient.name} with $${input.amount}` : `$${input.amount} demo tip sent to ${recipient.name}`);
  }

  function submitAccessRequest(idea: Idea, input: AccessSubmission) {
    if (!requireUser() || !state.currentUserId) return;
    const existing = state.accessRequests.find(
      (request) =>
        request.ideaId === idea.id &&
        request.userId === state.currentUserId &&
        request.status !== "declined",
    );
    const rank: Record<AccessTier, number> = { context: 1, build: 2, full: 3 };
    if (existing?.grantedTier && rank[existing.grantedTier] >= rank[input.tier]) {
      toast.info("This access tier is already unlocked.");
      setRequestIdeaId(null);
      return;
    }
    setState((previous) => {
      const access = {
        id: existing?.id ?? stateId("request"),
        ideaId: idea.id,
        userId: previous.currentUserId as string,
        requestedTier: input.tier,
        grantedTier: input.tier,
        role: input.role.trim(),
        note: input.note.trim(),
        status: "approved" as const,
        accessMethod: input.method,
        amountPaid: input.amountPaid,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      return {
        ...previous,
        accessRequests: existing
          ? previous.accessRequests.map((request) => request.id === existing.id ? access : request)
          : [...previous.accessRequests, access],
      };
    });
    setRequestIdeaId(null);
    toast.success(
      input.method === "paid"
        ? TIER_LABELS[input.tier] + " unlocked through demo checkout"
        : input.method === "trust"
          ? "Builder Kit unlocked through your credibility"
          : "Execution Room unlocked — MVP auto-approval from " + usersById[idea.creatorId].name,
    );
  }

  function resolveRequest(requestId: string, status: "approved" | "declined", grantedTier?: AccessTier) {
    setState((previous) => ({
      ...previous,
      accessRequests: previous.accessRequests.map((request) =>
        request.id === requestId ? { ...request, status, grantedTier } : request,
      ),
    }));
    toast.success(status === "approved" ? "Access granted" : "Request declined");
  }

  function submitProposal(idea: Idea, data: Omit<Proposal, "id" | "ideaId" | "fromUserId" | "toUserId" | "status" | "createdAt">) {
    if (!requireUser() || !state.currentUserId) return;
    setState((previous) => ({
      ...previous,
      proposals: [
        ...previous.proposals,
        {
          id: stateId("proposal"),
          ideaId: idea.id,
          fromUserId: previous.currentUserId as string,
          toUserId: idea.creatorId,
          status: "sent",
          createdAt: new Date().toISOString(),
          ...data,
        },
      ],
    }));
    setProposalIdeaId(null);
    toast.success("Proposal sent");
  }

  function acceptProposal(proposal: Proposal) {
    const existingDeal = state.dealRooms.find(
      (deal) =>
        deal.ideaId === proposal.ideaId &&
        deal.participantIds.includes(proposal.fromUserId) &&
        deal.participantIds.includes(proposal.toUserId),
    );
    const dealId = existingDeal?.id ?? stateId("deal");
    setState((previous) => ({
      ...previous,
      proposals: previous.proposals.map((item) =>
        item.id === proposal.id ? { ...item, status: "accepted" } : item,
      ),
      dealRooms: existingDeal
        ? previous.dealRooms
        : [
            ...previous.dealRooms,
            {
              id: dealId,
              ideaId: proposal.ideaId,
              participantIds: [proposal.fromUserId, proposal.toUserId],
              status: "active",
              agreement: {
                title: proposal.title,
                budget: proposal.budget,
                timeline: proposal.timeline,
                ownership: "Creator retains product IP; contributor scope governed by the agreed terms.",
                platformEquity: "0% — PassionHouse takes no equity",
              },
              milestones: [
                { id: stateId("milestone"), title: "Kickoff and working brief", due: "Week 1", amount: "20%", status: "active" },
                { id: stateId("milestone"), title: "Core delivery", due: "Midpoint", amount: "40%", status: "upcoming" },
                { id: stateId("milestone"), title: "Final handoff", due: proposal.timeline, amount: "40%", status: "upcoming" },
              ],
              messages: [],
              documents: [],
            },
          ],
    }));
    setSelectedDealId(dealId);
    setView("deals");
    toast.success("Proposal accepted — deal room opened");
  }

  function sendMessage(dealId: string, body: string) {
    if (!state.currentUserId || !body.trim()) return;
    setState((previous) => ({
      ...previous,
      dealRooms: previous.dealRooms.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              messages: [
                ...deal.messages,
                {
                  id: stateId("message"),
                  userId: previous.currentUserId as string,
                  body: body.trim(),
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : deal,
      ),
    }));
  }

  function advanceMilestone(dealId: string, milestoneId: string) {
    setState((previous) => ({
      ...previous,
      dealRooms: previous.dealRooms.map((deal) => {
        if (deal.id !== dealId) return deal;
        const milestoneIndex = deal.milestones.findIndex((milestone) => milestone.id === milestoneId);
        return {
          ...deal,
          milestones: deal.milestones.map((milestone, index) => {
            if (milestone.id === milestoneId) return { ...milestone, status: "complete" };
            if (index === milestoneIndex + 1 && milestone.status === "upcoming") {
              return { ...milestone, status: "active" };
            }
            return milestone;
          }),
        };
      }),
    }));
    toast.success("Milestone marked complete");
  }

  function attachDocument(dealId: string, file: File) {
    setState((previous) => ({
      ...previous,
      dealRooms: previous.dealRooms.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              documents: [
                ...deal.documents,
                {
                  id: stateId("document"),
                  name: file.name,
                  size: file.size < 1024 * 1024 ? Math.ceil(file.size / 1024) + " KB" : (file.size / 1024 / 1024).toFixed(1) + " MB",
                  uploadedBy: previous.currentUserId as string,
                },
              ],
            }
          : deal,
      ),
    }));
    toast.success(file.name + " attached");
  }

  function postIdea(input: PostSubmission) {
    if (!requireUser() || !state.currentUserId) return;
    const ideaId = stateId(input.postType);
    const isQuickPost = input.postType === "post";
    const isArticle = input.postType === "article";
    const isIdea = input.postType === "idea";
    const disclosure = isIdea ? input.disclosure : "open";
    const completeCopy = input.fullDetails.trim() || input.description.trim();
    const readingTime = isQuickPost ? 1 : Math.max(3, Math.ceil((input.description + " " + completeCopy).split(/\s+/).length / 180));
    const sections: Idea["sections"] = isQuickPost
      ? []
      : isArticle
        ? [
            { id: ideaId + "-article", label: "Article", title: input.oneLiner.trim(), body: completeCopy, access: "public" },
            { id: ideaId + "-takeaway", label: "Takeaway", title: "What to carry forward", body: input.description.trim(), access: "public" },
          ]
        : [
            { id: ideaId + "-public", label: "The opportunity", title: "Why this idea should exist", body: input.description.trim(), access: "public" },
            { id: ideaId + "-build", label: "Builder Kit", title: "How it could work", body: completeCopy, access: input.accessMode === "public" ? "public" : "build" },
            { id: ideaId + "-full", label: "Execution Room", title: "The first path from idea to project", body: "Turn the strongest assumption into one test, recruit the smallest useful team and publish what the first milestone proves. Add the commercial plan, risks and protected materials here as the idea develops.", access: input.accessMode === "public" ? "public" : "full", bullets: ["Define the riskiest assumption", "Choose one measurable milestone", "Invite the first complementary builder"] },
          ];
    const idea: Idea = {
      id: ideaId,
      creatorId: state.currentUserId,
      title: input.title.trim(),
      oneLiner: input.oneLiner.trim(),
      description: input.description.trim(),
      fullDetails: completeCopy,
      postType: input.postType,
      disclosure,
      accessMode: isIdea ? input.accessMode : "public",
      trustThreshold: isIdea ? input.trustThreshold : 0,
      category: input.category,
      stage: input.stage,
      createdAt: new Date().toISOString(),
      signal: isQuickPost ? 62 : isArticle ? 66 : 68,
      tags: isQuickPost ? [input.category, "Quick post"] : isArticle ? [input.category, "Article"] : [input.category, input.stage],
      asks: input.ask.trim() ? [input.ask.trim()] : [],
      validation: !isIdea
        ? []
        : [
            { label: "Evidence", value: input.evidence.trim() ? "Added" : "Open", detail: input.evidence.trim() || "Add proof later" },
            { label: "Interested", value: "0", detail: "New public signal" },
            { label: "Visibility", value: disclosure === "open" ? "Open" : "Preview", detail: disclosure === "open" ? "Completely public" : "Instant MVP unlock" },
          ],
      likes: 0,
      dislikes: 0,
      interested: 0,
      commentsCount: 0,
      visibility: "public",
      media: disclosure === "open"
        ? input.media.map((item) => ({ ...item, visibility: "public" as const }))
        : input.media,
      accessTiers: {
        context: "Problem framing and non-sensitive research.",
        build: "Product brief, workflow and validation detail.",
        full: "Execution plan, commercial detail and private materials.",
      },
      accessPricing: { currency: "USD", context: 0, build: 19, full: 49 },
      readingTime,
      sections,
      buildNeeds: input.ask.trim() ? [{ role: input.ask.trim(), contribution: "Help turn the strongest assumption into a working test.", commitment: "Start with one focused sprint" }] : [],
      tipsTotal: 0,
      tipCount: 0,
      backerCount: 0,
      progress: isIdea ? 8 : 100,
    };

    setState((previous) => ({ ...previous, ideas: [idea, ...previous.ideas] }));
    setPostOpen(false);
    setView("discover");
    setSelectedIdeaId(idea.id);
    toast.success(isQuickPost ? "Post published" : isArticle ? "Article published" : "Idea published — add funding whenever the milestone is clear");
  }

  function submitFundingPitch(
    idea: Idea,
    input: FundingSubmission,
  ) {
    if (!requireUser() || !state.currentUserId) return;
    if (idea.creatorId !== state.currentUserId) {
      toast.error("Only the idea creator can submit its funding pitch.");
      return;
    }
    setState((previous) => ({
      ...previous,
      fundingRequests: [
        {
          id: stateId("funding"),
          ideaId: idea.id,
          userId: previous.currentUserId as string,
          ...input,
          raisedAmount: 0,
          backerCount: 0,
          status: "under-review",
          createdAt: new Date().toISOString(),
        },
        ...previous.fundingRequests.filter((request) => request.ideaId !== idea.id),
      ],
    }));
    setFundingIdeaId(null);
    setSelectedIdeaId(null);
    setView("funding");
    toast.success(input.fundingType === "milestone" ? "Milestone backing page published" : input.fundingType === "grant" ? "PassionHouse grant ask submitted" : "Investor funding ask published");
  }

  async function createAccount(name: string, email: string, password: string, title: string) {
    const normalizedEmail = email.trim().toLowerCase();
    if (state.localAccounts.some((account) => account.email === normalizedEmail)) {
      toast.error("An account with this email already exists.");
      return;
    }
    const userId = stateId("user");
    const account = {
      userId,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
    };
    const palette = ["#f5f5f5", "#5b8cff", "#9b6cff", "#ff7f66", "#ff5fa2"];
    const profile: UserProfile = {
      id: userId,
      name: name.trim(),
      handle: "@" + name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16),
      email: normalizedEmail,
      title: title.trim() || "Independent builder",
      bio: "New to PassionHouse and ready to build.",
      location: "Remote",
      skills: ["Collaboration"],
      avatarTone: palette[state.users.length % palette.length],
      credibility: 35,
      credibilityBreakdown: { external: 20, execution: 35, community: 40, responsiveness: 45 },
      verifications: ["Email verified locally"],
      projectsBuilt: 0,
      collaborations: 0,
      responseRate: 0,
      joinedAt: new Date().toISOString(),
      availableFor: ["Collaboration", "Feedback"],
      socials: [
        { platform: "X", handle: "Not connected", url: "https://x.com", connected: false, followers: 0, growth30d: 0, trustContribution: 16 },
        { platform: "LinkedIn", handle: "Not connected", url: "https://linkedin.com", connected: false, followers: 0, growth30d: 0, trustContribution: 12 },
        { platform: "GitHub", handle: "Not connected", url: "https://github.com", connected: false, followers: 0, growth30d: 0, trustContribution: 14 },
      ],
    };
    setState((previous) => ({
      ...previous,
      currentUserId: userId,
      users: [...previous.users, profile],
      localAccounts: [...previous.localAccounts, account],
    }));
    setAuthOpen(false);
    toast.success("Local account created");
  }

  async function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const account = state.localAccounts.find((item) => item.email === normalizedEmail);
    if (!account || account.passwordHash !== (await hashPassword(password))) {
      toast.error("Email or password does not match a local account.");
      return;
    }
    setState((previous) => ({ ...previous, currentUserId: account.userId }));
    setAuthOpen(false);
    toast.success("Welcome back");
  }

  function chooseDemoUser(userId: string) {
    setState((previous) => ({ ...previous, currentUserId: userId }));
    setAuthOpen(false);
    setView("discover");
    const profile = state.users.find((user) => user.id === userId);
    toast.success(profile ? "Connected with X as " + profile.handle : "Demo persona switched");
  }

  function connectSocial(platform: SocialPlatform) {
    if (!state.currentUserId) return;
    setState((previous) => ({
      ...previous,
      users: previous.users.map((user) => {
        if (user.id !== previous.currentUserId) return user;
        const account = user.socials.find((social) => social.platform === platform);
        if (!account || account.connected) return user;
        const externalLift = Math.max(2, Math.round(account.trustContribution / 3));
        const communityLift = Math.max(1, Math.round(account.trustContribution / 5));
        return {
          ...user,
          credibility: Math.min(99, user.credibility + Math.max(2, Math.round(account.trustContribution / 6))),
          credibilityBreakdown: {
            ...user.credibilityBreakdown,
            external: Math.min(99, user.credibilityBreakdown.external + externalLift),
            community: Math.min(99, user.credibilityBreakdown.community + communityLift),
          },
          verifications: [...user.verifications, platform + " connected"],
          socials: user.socials.map((social) =>
            social.platform === platform
              ? { ...social, connected: true, handle: user.handle, followers: social.followers || 1240, growth30d: social.growth30d || 3.8 }
              : social,
          ),
        };
      }),
    }));
    toast.success(platform + " connected — credibility updated");
  }

  function openProfile(userId: string) {
    setSelectedProfileId(userId);
  }

  function resetDemo() {
    const next = localRepository.reset();
    setState(next);
    setView("discover");
    setSelectedIdeaId(null);
    toast.success("Demo data restored");
  }

  const navItems: Array<{ key: ViewKey; icon: React.ElementType; badge?: number }> = [
    { key: "discover", icon: LayoutGrid },
    { key: "funding", icon: CircleDollarSign, badge: state.fundingRequests.filter((request) => request.status === "open").length },
    { key: "people", icon: UserSearch },
    { key: "requests", icon: Inbox, badge: pendingRequests.length },
    { key: "proposals", icon: FileText, badge: receivedProposals.filter((proposal) => proposal.status === "sent").length },
    { key: "deals", icon: Handshake, badge: activeDeals.length },
    { key: "profile", icon: UserRound },
  ];

  return (
    <div className="min-h-svh bg-black text-white">
      <AmbientCursor />
      <div className="ph-atmosphere" aria-hidden="true">
        <div className="ph-orbit ph-orbit-one" />
        <div className="ph-orbit ph-orbit-two" />
        <span className="ph-binary ph-binary-one">01010000 01001000</span>
        <span className="ph-binary ph-binary-two">01001001 01000100 01000101 01000001</span>
        <span className="ph-binary ph-binary-three">01000010 01010101 01001001 01001100 01000100</span>
        <span className="ph-meteor ph-meteor-one" />
        <span className="ph-meteor ph-meteor-two" />
        <div className="ph-noise" />
      </div>

      <header className="ph-topbar">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-white/70 lg:hidden"
            onClick={() => setMobileNavOpen((open) => !open)}
            aria-label="Open navigation"
          >
            {mobileNavOpen ? <X /> : <Menu />}
          </Button>
          <Brand compact />
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-white/45 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f5f5f5] shadow-[0_0_12px_#f5f5f5]" />
          <Radio className="size-3" />
          Public idea signal
          <span className="ml-1 text-white/75">{state.ideas.length} live</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            onClick={() => setPostOpen(true)}
          >
            <Plus />
            Create post
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" className="text-white/55 hover:bg-white/10 hover:text-white">
            <Bell />
            <span className="sr-only">Notifications</span>
          </Button>
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2.5 text-left transition hover:bg-white/[0.08]">
                  <UserAvatar user={currentUser} className="size-7" />
                  <span className="hidden text-xs font-medium text-white/75 sm:block">{currentUser.name.split(" ")[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 border-white/10 bg-[#121416] text-white">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <p className="mt-0.5 text-xs text-white/40">{currentUser.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onSelect={() => switchView("profile")} className="focus:bg-white/10 focus:text-white">
                  <UserRound />
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setAuthOpen(true)} className="focus:bg-white/10 focus:text-white">
                  <Users />
                  Switch demo persona
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={resetDemo} className="focus:bg-white/10 focus:text-white">
                  <RefreshCcw />
                  Reset demo data
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onSelect={() => {
                    setState((previous) => ({ ...previous, currentUserId: null }));
                    setAuthOpen(true);
                  }}
                  className="focus:bg-white/10 focus:text-white"
                >
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button type="button" size="sm" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </header>

      <div className="ph-shell">
        <aside className={cn("ph-sidebar", mobileNavOpen && "ph-sidebar-open")}>
          <nav aria-label="Primary navigation" className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => switchView(item.key)}
                  className={cn("ph-nav-item", view === item.key && "ph-nav-item-active")}
                >
                  <Icon />
                  <span>{VIEW_LABELS[item.key]}</span>
                  {!!item.badge && <em>{item.badge}</em>}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto">
            {currentUser && (
              <button type="button" className="ph-identity-card" onClick={() => switchView("profile")}>
                <div className="flex items-center gap-3">
                  <UserAvatar user={currentUser} className="size-9" />
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-medium text-white">{currentUser.name}</p>
                    <p className="truncate text-xs text-white/35">{currentUser.handle}</p>
                  </div>
                  <ScoreRing value={currentUser.credibility} size="sm" />
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-white/30">
                  <span>Credibility</span>
                  <span className="text-[#f5f5f5]">Ethos verified</span>
                </div>
              </button>
            )}
            <div className="mt-3 flex items-center gap-2 px-2 text-[10px] uppercase tracking-[0.14em] text-white/22">
              <ShieldCheck className="size-3" />
              Platform takes 0% equity
            </div>
          </div>
        </aside>

        <main className="ph-main">
          {view === "discover" && (
            <DiscoverView
              ideas={filteredIdeas}
              allIdeas={state.ideas}
              usersById={usersById}
              currentUserId={state.currentUserId}
              state={state}
              search={search}
              category={category}
              stage={stage}
              sort={sort}
              onSearch={setSearch}
              onCategory={setCategory}
              onStage={setStage}
              onSort={setSort}
              onOpenIdea={setSelectedIdeaId}
              onPost={() => setPostOpen(true)}
              onReaction={toggleReaction}
              onInterest={toggleInterest}
              onTip={(ideaId, userId, kind) => openTip(userId, ideaId, kind)}
              onOpenProfile={openProfile}
            />
          )}
          {view === "funding" && (
            <FundingView
              requests={state.fundingRequests}
              ideas={state.ideas}
              usersById={usersById}
              currentUserId={state.currentUserId}
              onOpenIdea={setSelectedIdeaId}
              onPitch={setFundingIdeaId}
              onBack={(ideaId, userId) => openTip(userId, ideaId, "backing")}
            />
          )}
          {view === "people" && (
            <PeopleView
              users={state.users}
              ideas={state.ideas}
              currentUserId={state.currentUserId}
              onOpenProfile={openProfile}
              onTip={(userId) => openTip(userId)}
            />
          )}
          {view === "requests" && (
            <RequestsView
              requests={state.accessRequests.filter((request) => ownedIdeaIds.has(request.ideaId))}
              ideas={state.ideas}
              usersById={usersById}
              onResolve={resolveRequest}
              onOpenIdea={setSelectedIdeaId}
            />
          )}
          {view === "proposals" && (
            <ProposalsView
              proposals={state.proposals}
              ideas={state.ideas}
              usersById={usersById}
              currentUserId={state.currentUserId}
              onAccept={acceptProposal}
              onOpenIdea={setSelectedIdeaId}
            />
          )}
          {view === "deals" && (
            <DealsView
              deals={activeDeals}
              selectedDeal={selectedDeal}
              ideas={state.ideas}
              usersById={usersById}
              currentUserId={state.currentUserId}
              onSelect={setSelectedDealId}
              onSendMessage={sendMessage}
              onAdvanceMilestone={advanceMilestone}
              onAttachDocument={attachDocument}
            />
          )}
          {view === "profile" && currentUser && (
            <ProfileView
              user={currentUser}
              ideas={state.ideas.filter((idea) => idea.creatorId === currentUser.id)}
              proposals={state.proposals.filter(
                (proposal) => proposal.fromUserId === currentUser.id || proposal.toUserId === currentUser.id,
              )}
              onOpenIdea={setSelectedIdeaId}
              isSelf
              onConnectSocial={connectSocial}
            />
          )}
        </main>
      </div>

      <IdeaDetailSheet
        idea={selectedIdea}
        creator={selectedIdea ? usersById[selectedIdea.creatorId] : null}
        currentUser={currentUser}
        state={state}
        usersById={usersById}
        onOpenChange={(open) => !open && setSelectedIdeaId(null)}
        onReaction={toggleReaction}
        onInterest={toggleInterest}
        onComment={addComment}
        onRequestAccess={(ideaId) => setRequestIdeaId(ideaId)}
        onProposal={(ideaId) => setProposalIdeaId(ideaId)}
        onFunding={(ideaId) => {
          const existing = state.fundingRequests.some((request) => request.ideaId === ideaId);
          if (existing) {
            setSelectedIdeaId(null);
            setView("funding");
          } else {
            setFundingIdeaId(ideaId);
          }
        }}
        onTip={(ideaId, userId, kind) => openTip(userId, ideaId, kind)}
        onOpenProfile={(userId) => {
          setSelectedIdeaId(null);
          openProfile(userId);
        }}
      />
      <PublicProfileSheet
        user={selectedProfile}
        ideas={selectedProfile ? state.ideas.filter((idea) => idea.creatorId === selectedProfile.id) : []}
        onOpenChange={(open) => !open && setSelectedProfileId(null)}
        onOpenIdea={(ideaId) => {
          setSelectedProfileId(null);
          setSelectedIdeaId(ideaId);
        }}
        onTip={(userId) => openTip(userId)}
      />
      <AccessRequestDialog
        idea={requestIdea}
        creator={requestIdea ? usersById[requestIdea.creatorId] : null}
        currentUser={currentUser}
        onClose={() => setRequestIdeaId(null)}
        onSubmit={submitAccessRequest}
      />
      <ProposalDialog idea={proposalIdea} onClose={() => setProposalIdeaId(null)} onSubmit={submitProposal} />
      <FundingPitchDialog idea={fundingIdea} onClose={() => setFundingIdeaId(null)} onSubmit={submitFundingPitch} />
      <TipDialog recipient={tipRecipient} idea={tipIdea} initialKind={tipTarget?.kind} onClose={() => setTipTarget(null)} onSubmit={submitTip} />
      <PostIdeaDialog open={postOpen} onClose={() => setPostOpen(false)} onSubmit={postIdea} />
      <AuthDialog
        open={authOpen || !currentUser}
        canClose={!!currentUser}
        users={state.users}
        onClose={() => setAuthOpen(false)}
        onChooseDemo={chooseDemoUser}
        onCreate={createAccount}
        onLogin={login}
      />
      <FloatingPostButton onClick={() => setPostOpen(true)} />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}
