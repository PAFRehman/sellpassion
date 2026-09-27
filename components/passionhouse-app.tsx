"use client";

import * as React from "react";
import NextImage from "next/image";
import {
  AtSign,
  ArrowDown,
  ArrowUp,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Command,
  Eye,
  ExternalLink,
  FileText,
  Gauge,
  Globe2,
  Handshake,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers3,
  LayoutGrid,
  Link2,
  Lock,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Play,
  Plus,
  Radio,
  RefreshCcw,
  Rocket,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UserSearch,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { freshDemoState } from "@/lib/passionhouse-demo";
import { localRepository } from "@/lib/passionhouse-repository";
import type {
  AccessRequest,
  AccessTier,
  DealRoom,
  Idea,
  MediaAttachment,
  PassionHouseState,
  Proposal,
  SocialPlatform,
  UserProfile,
  ViewKey,
} from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<AccessTier, string> = {
  context: "Context",
  build: "Build brief",
  full: "Full room",
};

const VIEW_LABELS: Record<ViewKey, string> = {
  discover: "Discover",
  people: "People",
  requests: "Access requests",
  proposals: "Proposals",
  deals: "Deal rooms",
  profile: "Profile",
};

const CATEGORIES = ["All sectors", "AI", "Climate", "Civic", "Health", "Fintech", "Future of work"];
const STAGES = ["All stages", "Concept", "Prototype", "Validated", "Early traction", "Pilot"];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function relativeDate(value: string) {
  const day = 24 * 60 * 60 * 1000;
  const distance = Math.max(0, Date.now() - new Date(value).getTime());
  const days = Math.floor(distance / day);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + "d ago";
}

function compactNumber(value?: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(value >= 10_000 ? 0 : 1) + "K";
  return value.toString();
}

function socialIcon(platform: SocialPlatform, className = "size-4") {
  if (platform === "GitHub") return <span className="ph-social-letter" aria-hidden="true">GH</span>;
  if (platform === "LinkedIn") return <span className="ph-social-letter" aria-hidden="true">in</span>;
  if (platform === "Website") return <Globe2 className={className} />;
  if (platform === "Instagram") return <AtSign className={className} />;
  return <span className="ph-x-glyph" aria-hidden="true">𝕏</span>;
}

function avatarStyle(user: UserProfile): React.CSSProperties {
  return {
    background: "linear-gradient(145deg, " + user.avatarTone + " 0%, #17181b 115%)",
    color: "#08090a",
  };
}

function stateId(prefix: string) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

async function hashPassword(password: string) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function UserAvatar({
  user,
  className,
}: {
  user: UserProfile;
  className?: string;
}) {
  return (
    <Avatar className={cn("ring-1 ring-white/10", className)}>
      <AvatarFallback style={avatarStyle(user)} className="font-bold text-[11px]">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SignalMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("ph-mark", compact && "ph-mark-compact")} aria-hidden="true">
      <span />
      <i />
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SignalMark compact={compact} />
      <div className={cn("leading-none", compact && "hidden sm:block")}>
        <p className="ph-wordmark">PassionHouse</p>
        {!compact && (
          <p className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.19em] text-white/32">
            Signal into motion
          </p>
        )}
      </div>
    </div>
  );
}

function ScoreRing({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn("ph-score-ring", size === "sm" && "ph-score-ring-sm", size === "lg" && "ph-score-ring-lg")}
      style={{ "--score": value } as React.CSSProperties}
      aria-label={"Credibility score " + value}
    >
      <div>
        <strong>{value}</strong>
        {size !== "sm" && <span>cred</span>}
      </div>
    </div>
  );
}

function MediaGrid({
  media,
  canViewPrivate = false,
  compact = false,
}: {
  media: MediaAttachment[];
  canViewPrivate?: boolean;
  compact?: boolean;
}) {
  if (!media.length) return null;
  const visible = media.slice(0, compact ? 2 : 4);
  return (
    <div className={cn("ph-media-grid", visible.length === 1 && "ph-media-grid-single", compact && "ph-media-grid-compact")}>
      {visible.map((item) => {
        const locked = item.visibility === "private" && !canViewPrivate;
        return (
          <div key={item.id} className={cn("ph-media-item", locked && "ph-media-item-locked")}>
            {item.kind === "video" && !locked ? (
              <video src={item.url} controls preload="metadata" aria-label={item.name} />
            ) : (
              <NextImage src={item.url} alt={item.name} fill unoptimized sizes={compact ? "(max-width: 768px) 100vw, 700px" : "(max-width: 768px) 100vw, 640px"} />
            )}
            {item.kind === "video" && locked && <Play className="ph-media-play" />}
            {locked && (
              <div className="ph-media-lock">
                <Lock />
                <span>Private media</span>
                <small>Request access to reveal</small>
              </div>
            )}
            {!locked && item.kind === "video" && <span className="ph-media-kind"><Video /> Video</span>}
          </div>
        );
      })}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  action,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="ph-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.55rem)] font-medium leading-[1.02] tracking-[-0.055em] text-white">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-white/48">{detail}</p>
      </div>
      {action}
    </div>
  );
}

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

  function submitAccessRequest(idea: Idea, tier: AccessTier, role: string, note: string) {
    if (!requireUser() || !state.currentUserId) return;
    const duplicate = state.accessRequests.find(
      (request) =>
        request.ideaId === idea.id &&
        request.userId === state.currentUserId &&
        request.status !== "declined",
    );
    if (duplicate) {
      toast.info("You already have an active request for this idea.");
      return;
    }
    setState((previous) => ({
      ...previous,
      accessRequests: [
        ...previous.accessRequests,
        {
          id: stateId("request"),
          ideaId: idea.id,
          userId: previous.currentUserId as string,
          requestedTier: tier,
          role: role.trim(),
          note: note.trim(),
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    setRequestIdeaId(null);
    toast.success("Access request sent to " + usersById[idea.creatorId].name);
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

  function postIdea(input: {
    title: string;
    oneLiner: string;
    description: string;
    category: string;
    stage: string;
    ask: string;
    evidence: string;
    media: MediaAttachment[];
  }) {
    if (!requireUser() || !state.currentUserId) return;
    const idea: Idea = {
      id: stateId("idea"),
      creatorId: state.currentUserId,
      title: input.title.trim(),
      oneLiner: input.oneLiner.trim(),
      description: input.description.trim(),
      category: input.category,
      stage: input.stage,
      createdAt: new Date().toISOString(),
      signal: 68,
      tags: [input.category, input.stage],
      asks: [input.ask.trim()],
      validation: [
        { label: "Evidence", value: "1", detail: input.evidence.trim() || "Creator supplied" },
        { label: "Interested", value: "0", detail: "New listing" },
        { label: "Access", value: "Tiered", detail: "Creator controlled" },
      ],
      likes: 0,
      dislikes: 0,
      interested: 0,
      commentsCount: 0,
      visibility: "public",
      media: input.media,
      accessTiers: {
        context: "Problem framing and non-sensitive research.",
        build: "Product brief, workflow and validation detail.",
        full: "Execution plan, commercial detail and private materials.",
      },
    };
    setState((previous) => ({ ...previous, ideas: [idea, ...previous.ideas] }));
    setPostOpen(false);
    setView("discover");
    setSelectedIdeaId(idea.id);
    toast.success("Idea published to Discover");
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
    const palette = ["#f5f5f5", "#89c7ff", "#c6a8ff", "#ff9f87", "#78e5d1"];
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
    { key: "people", icon: UserSearch },
    { key: "requests", icon: Inbox, badge: pendingRequests.length },
    { key: "proposals", icon: FileText, badge: receivedProposals.filter((proposal) => proposal.status === "sent").length },
    { key: "deals", icon: Handshake, badge: activeDeals.length },
    { key: "profile", icon: UserRound },
  ];

  return (
    <div className="min-h-svh bg-black text-white">
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
            Post an idea
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
              onOpenProfile={openProfile}
            />
          )}
          {view === "people" && (
            <PeopleView
              users={state.users}
              ideas={state.ideas}
              currentUserId={state.currentUserId}
              onOpenProfile={openProfile}
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
      />
      <AccessRequestDialog
        idea={requestIdea}
        creator={requestIdea ? usersById[requestIdea.creatorId] : null}
        onClose={() => setRequestIdeaId(null)}
        onSubmit={submitAccessRequest}
      />
      <ProposalDialog idea={proposalIdea} onClose={() => setProposalIdeaId(null)} onSubmit={submitProposal} />
      <PostIdeaDialog open={postOpen} onClose={() => setPostOpen(false)} onSubmit={postIdea} />
      <AuthDialog
        open={authOpen || !currentUser}
        canClose={!!currentUser}
        users={state.users.slice(0, 4)}
        onClose={() => setAuthOpen(false)}
        onChooseDemo={chooseDemoUser}
        onCreate={createAccount}
        onLogin={login}
      />
      <Toaster position="bottom-right" richColors />
    </div>
  );
}

function DiscoverView({
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
  const [feedMode, setFeedMode] = React.useState<"for-you" | "latest">("for-you");
  const feedIdeas = feedMode === "latest"
    ? [...ideas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : ideas;
  const currentUser = currentUserId ? usersById[currentUserId] : null;
  return (
    <>
      <SectionHeading
        eyebrow="Public frequency · live"
        title="The idea feed for people who build."
        detail="Publish the full thought, show the evidence, find credible collaborators, then move the work into private execution when the fit is real."
        action={
          <Button type="button" onClick={onPost} className="bg-[#f5f5f5] text-black hover:bg-[#ffffff] sm:hidden">
            <Plus />
            Post an idea
          </Button>
        }
      />

      <button type="button" className="ph-composer" onClick={onPost}>
        {currentUser && <UserAvatar user={currentUser} className="size-10" />}
        <span className="flex-1 text-left">
          <strong>What should exist?</strong>
          <small>Post a public idea, long-form thesis, image or video</small>
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
            <button type="button" className={feedMode === "latest" ? "active" : ""} onClick={() => setFeedMode("latest")}>Latest</button>
            <span>{ideas.length} public ideas</span>
          </div>
          <div className="mb-3 mt-4 flex items-center justify-between">
            <p className="text-xs text-white/35">
              <span className="font-medium text-white/65">{ideas.length}</span> ideas matched
            </p>
            <div className="flex items-center gap-2 text-[11px] text-white/28">
              <Command className="size-3" />
              Signal blends validation, activity and creator credibility
            </div>
          </div>
          {ideas.length ? (
            <div className="ph-feed">
              {feedIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  creator={usersById[idea.creatorId]}
                  reaction={currentUserId ? state.reactions[idea.id + ":" + currentUserId] : undefined}
                  interested={currentUserId ? state.interests.includes(idea.id + ":" + currentUserId) : false}
                  canViewPrivate={currentUserId === idea.creatorId}
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
    <article className="ph-idea-card group">
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
          <span className="ph-public-pill"><Globe2 /> Public</span>
          <Button type="button" variant="ghost" size="icon-sm" className="text-white/25 hover:bg-white/10 hover:text-white" aria-label="More options"><MoreHorizontal /></Button>
        </div>
      </div>

      <button type="button" className="mt-5 block w-full text-left" onClick={onOpen}>
        <div className="mb-3 flex items-center gap-2.5">
          <Badge className="border-white/10 bg-white/[0.05] text-[9px] uppercase tracking-[0.12em] text-white/52">{idea.category}</Badge>
          <span className="text-[11px] text-white/28">{idea.stage}</span>
          <span className="ml-auto font-mono text-[10px] text-white/30">SIGNAL {idea.signal}</span>
        </div>
        <h2 className="text-[1.6rem] font-semibold tracking-[-0.05em] text-white">{idea.title}</h2>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/57">{idea.oneLiner}</p>
        <p className="mt-4 line-clamp-4 whitespace-pre-line text-[14px] leading-6 text-white/42">{idea.description}</p>
        <span className="mt-2 inline-flex text-xs font-medium text-white/68">Read the full idea</span>
      </button>

      <div className="mt-4" onClick={(event) => event.stopPropagation()}>
        <MediaGrid media={idea.media} canViewPrivate={canViewPrivate} compact />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {idea.validation.map((metric) => (
          <div key={metric.label} className="ph-metric">
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {idea.asks.map((ask) => (
          <span key={ask} className="ph-ask">
            <Sparkles />
            Seeking {ask}
          </span>
        ))}
      </div>

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
          {ideas.slice(0, 3).map((idea, index) => (
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
        <h3 className="mt-4 text-sm font-medium text-white/75">Disclosure stays earned</h3>
        <p className="mt-2 text-xs leading-5 text-white/35">
          Creators decide who sees context, the build brief, or the full execution room.
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

function IdeaDetailSheet({
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
  const isOwner = currentUser?.id === idea.creatorId;

  return (
    <Sheet open={!!idea} onOpenChange={onOpenChange}>
      <SheetContent className="ph-detail-sheet w-full overflow-y-auto border-white/10 bg-[#070707] p-0 text-white sm:max-w-[720px]">
        <SheetHeader className="border-b border-white/[0.07] px-6 py-5 pr-14 sm:px-8">
          <div className="flex items-center gap-2">
            <Badge className="border-white/10 bg-white/[0.05] text-white/55">{idea.category}</Badge>
            <span className="text-xs text-white/30">{idea.stage}</span>
          </div>
          <SheetTitle className="mt-4 text-3xl font-medium tracking-[-0.055em] text-white">{idea.title}</SheetTitle>
          <SheetDescription className="text-[15px] leading-6 text-white/52">{idea.oneLiner}</SheetDescription>
        </SheetHeader>

        <div className="space-y-7 px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button type="button" className="flex items-center gap-3" onClick={() => onOpenProfile(creator.id)}>
              <UserAvatar user={creator} className="size-10" />
              <div className="text-left">
                <p className="text-sm font-medium text-white">{creator.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-white/35">
                  <ShieldCheck className="size-3 text-[#f5f5f5]" />
                  {creator.credibility} credibility · {creator.title}
                </p>
              </div>
            </button>
            <div className="ph-signal-pill ph-signal-pill-large">
              <TrendingUp />
              <strong>{idea.signal}</strong>
              <span>signal</span>
            </div>
          </div>

          <section>
            <p className="ph-eyebrow">Public thesis</p>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-white/62">{idea.description}</p>
          </section>

          {!!idea.media.length && (
            <section>
              <div className="mb-3 flex items-center justify-between">
                <p className="ph-eyebrow">Media & materials</p>
                <span className="text-[11px] text-white/25">{idea.media.filter((item) => item.visibility === "private").length} private</span>
              </div>
              <MediaGrid media={idea.media} canViewPrivate={isOwner || !!access} />
            </section>
          )}

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="ph-eyebrow">Validation</p>
              <span className="text-[11px] text-white/25">Creator supplied · community visible</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {idea.validation.map((metric) => (
                <div key={metric.label} className="ph-detail-metric">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="ph-access-map">
            <div className="flex items-center justify-between">
              <div>
                <p className="ph-eyebrow">Disclosure map</p>
                <h3 className="mt-2 text-lg font-medium tracking-[-0.03em] text-white">See more as trust compounds.</h3>
              </div>
              <Layers3 className="size-5 text-white/30" />
            </div>
            <div className="mt-5 space-y-2">
              {(["context", "build", "full"] as AccessTier[]).map((tier, index) => {
                const unlocked =
                  isOwner ||
                  (!!access &&
                    (access.grantedTier === "full" ||
                      (access.grantedTier === "build" && index <= 1) ||
                      (access.grantedTier === "context" && index === 0)));
                return (
                  <div key={tier} className={cn("ph-access-row", unlocked && "ph-access-row-unlocked")}>
                    <span className="ph-access-index">0{index + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white/78">{TIER_LABELS[tier]}</p>
                      <p className="mt-1 text-xs leading-5 text-white/34">{idea.accessTiers[tier]}</p>
                    </div>
                    {unlocked ? <Eye className="size-4 text-[#f5f5f5]" /> : <LockKeyhole className="size-4 text-white/20" />}
                  </div>
                );
              })}
            </div>
            {!isOwner && !access && (
              <Button
                type="button"
                className="mt-4 w-full bg-[#f5f5f5] text-black hover:bg-[#ffffff]"
                onClick={() => onRequestAccess(idea.id)}
              >
                <KeyRound />
                Request access
              </Button>
            )}
            {!isOwner && access && (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white"
                onClick={() => onProposal(idea.id)}
              >
                <FileText />
                Submit a proposal
              </Button>
            )}
          </section>

          <section>
            <p className="ph-eyebrow">What moves this forward</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {idea.asks.map((ask) => (
                <span key={ask} className="ph-ask ph-ask-large">
                  <Sparkles />
                  {ask}
                </span>
              ))}
            </div>
          </section>

          <div className="flex items-center gap-2 border-y border-white/[0.07] py-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("text-white/45 hover:bg-white/10 hover:text-white", reaction === "like" && "bg-white/10 text-[#f5f5f5]")}
              onClick={() => onReaction(idea.id, "like")}
            >
              <ArrowUp />
              {idea.likes} useful
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("text-white/45 hover:bg-white/10 hover:text-white", interested && "bg-[#f5f5f5]/10 text-[#f5f5f5]")}
              onClick={() => onInterest(idea.id)}
            >
              <Users />
              {interested ? "Interested" : "Mark interested"}
            </Button>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-white/30">
              <MessageCircle className="size-3.5" />
              {idea.commentsCount}
            </span>
          </div>

          <section>
            <p className="ph-eyebrow">Builder conversation</p>
            <div className="mt-4 space-y-4">
              {comments.map((item) => {
                const author = usersById[item.userId];
                if (!author) return null;
                return (
                  <div key={item.id} className="flex gap-3">
                    <UserAvatar user={author} className="mt-0.5 size-7" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-white/70">{author.name}</p>
                        <span className="text-[10px] text-white/24">{relativeDate(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-white/45">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <form
              className="mt-5 flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                onComment(idea.id, comment);
                setComment("");
              }}
            >
              <Input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a useful question or observation"
                className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25"
              />
              <Button type="submit" size="icon" className="bg-white text-black hover:bg-white/85" disabled={!comment.trim()}>
                <Send />
                <span className="sr-only">Send comment</span>
              </Button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AccessRequestDialog({
  idea,
  creator,
  onClose,
  onSubmit,
}: {
  idea: Idea | null;
  creator: UserProfile | null;
  onClose: () => void;
  onSubmit: (idea: Idea, tier: AccessTier, role: string, note: string) => void;
}) {
  const [tier, setTier] = React.useState<AccessTier>("build");
  const [role, setRole] = React.useState("");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (idea) {
      setTier("build");
      setRole("");
      setNote("");
    }
  }, [idea]);
  return (
    <Dialog open={!!idea} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0f1113] text-white sm:max-w-[620px]">
        <DialogHeader>
          <p className="ph-eyebrow">Creator-controlled disclosure</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">Request access to {idea?.title}</DialogTitle>
          <DialogDescription className="text-white/42">
            {creator?.name} will see your credibility, intended role and note before approving a tier.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label className="text-xs text-white/45">Choose the smallest tier you need</Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(["context", "build", "full"] as AccessTier[]).map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setTier(item)}
                  className={cn("ph-tier-choice", tier === item && "ph-tier-choice-active")}
                >
                  {tier === item ? <CheckCircle2 /> : <CircleDashed />}
                  <strong>{TIER_LABELS[item]}</strong>
                  <span>{item === "context" ? "Understand" : item === "build" ? "Evaluate + build" : "Enter execution"}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="access-role" className="text-xs text-white/45">How do you want to contribute?</Label>
            <Input
              id="access-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="e.g. Founding engineer, design partner"
              className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="access-note" className="text-xs text-white/45">Why are you a strong fit?</Label>
            <Textarea
              id="access-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Be specific about relevant experience, access or the first thing you would test."
              className="min-h-28 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/55 hover:bg-white/10 hover:text-white">
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!idea || role.trim().length < 3 || note.trim().length < 12}
            className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]"
            onClick={() => idea && onSubmit(idea, tier, role, note)}
          >
            Send request
            <ChevronRight />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProposalDialog({
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

function PostIdeaDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    oneLiner: string;
    description: string;
    category: string;
    stage: string;
    ask: string;
    evidence: string;
    media: MediaAttachment[];
  }) => void;
}) {
  const [step, setStep] = React.useState(1);
  const [title, setTitle] = React.useState("");
  const [oneLiner, setOneLiner] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("AI");
  const [stage, setStage] = React.useState("Concept");
  const [ask, setAsk] = React.useState("");
  const [evidence, setEvidence] = React.useState("");
  const [media, setMedia] = React.useState<MediaAttachment[]>([]);
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setTitle("");
      setOneLiner("");
      setDescription("");
      setCategory("AI");
      setStage("Concept");
      setAsk("");
      setEvidence("");
      setMedia([]);
    }
  }, [open]);

  async function addMedia(files: FileList | null) {
    if (!files?.length) return;
    const slots = Math.max(0, 4 - media.length);
    const selected = Array.from(files).slice(0, slots);
    const accepted = selected.filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const totalBytes = accepted.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes > 3_000_000) {
      toast.error("For this local demo, keep each upload batch under 3 MB.");
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
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-white/10 bg-[#080808] text-white sm:max-w-[740px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <p className="ph-eyebrow">Post an idea</p>
            <span className="text-[11px] text-white/30">Step {step} of 2</span>
          </div>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">
            {step === 1 ? "Make the opportunity legible." : "Show the evidence and the opening."}
          </DialogTitle>
          <DialogDescription className="text-white/42">
            Every idea is public. You choose which images and videos are visible in the feed and which stay behind creator-approved access.
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid gap-4 py-2">
            <FormField label="Idea name" value={title} onChange={setTitle} placeholder="A short, ownable name" />
            <FormField label="One-line thesis" value={oneLiner} onChange={setOneLiner} placeholder="What is changing, for whom, and why now?" />
            <div className="grid gap-2">
              <Label htmlFor="idea-public-description" className="text-xs text-white/45">Public description</Label>
              <Textarea
                id="idea-public-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Write the full idea: the problem, insight, approach, evidence, open questions and why now. Long-form is welcome."
                maxLength={10000}
                className="min-h-48 resize-y border-white/10 bg-white/[0.035] text-white placeholder:text-white/25"
              />
              <span className="text-right font-mono text-[9px] text-white/24">{description.length.toLocaleString()} / 10,000</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-xs text-white/45">Sector</Label>
                <Select value={category} onValueChange={(value) => setCategory(value ?? "AI")}>
                  <SelectTrigger className="w-full border-white/10 bg-white/[0.035] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121416] text-white">
                    {CATEGORIES.slice(1).map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs text-white/45">Stage</Label>
                <Select value={stage} onValueChange={(value) => setStage(value ?? "Concept")}>
                  <SelectTrigger className="w-full border-white/10 bg-white/[0.035] text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121416] text-white">
                    {STAGES.slice(1).map((item) => <SelectItem key={item} value={item} className="focus:bg-white/10 focus:text-white">{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-2">
            <FormField label="The person or access you need now" value={ask} onChange={setAsk} placeholder="e.g. Full-stack engineer, pilot customers" />
            <FormField label="Strongest evidence so far" value={evidence} onChange={setEvidence} placeholder="e.g. 28 interviews, 4 LOIs, working prototype" />
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-white/45">Images & video</Label>
                <span className="font-mono text-[9px] text-white/24">{media.length}/4 · 3 MB per batch</span>
              </div>
              <label className="ph-media-uploader">
                <span className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]"><ImageIcon /></span>
                <span><strong>Add visual proof</strong><small>Upload images or video, then choose public or private for each file.</small></span>
                <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(event) => { void addMedia(event.target.files); event.target.value = ""; }} />
              </label>
              {!!media.length && (
                <div className="space-y-2">
                  {media.map((item) => (
                    <div key={item.id} className="ph-media-draft-row">
                      <span className="ph-media-draft-preview">
                        {item.kind === "image" ? <NextImage src={item.url} alt="" fill unoptimized sizes="42px" /> : <Video />}
                      </span>
                      <span className="min-w-0 flex-1"><strong>{item.name}</strong><small>{item.kind}</small></span>
                      <div className="ph-privacy-toggle">
                        <button type="button" className={item.visibility === "public" ? "active" : ""} onClick={() => setMedia((current) => current.map((mediaItem) => mediaItem.id === item.id ? { ...mediaItem, visibility: "public" } : mediaItem))}><Globe2 /> Public</button>
                        <button type="button" className={item.visibility === "private" ? "active" : ""} onClick={() => setMedia((current) => current.map((mediaItem) => mediaItem.id === item.id ? { ...mediaItem, visibility: "private" } : mediaItem))}><Lock /> Private</button>
                      </div>
                      <Button type="button" variant="ghost" size="icon-sm" onClick={() => setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id))} className="text-white/30 hover:bg-white/10 hover:text-white"><X /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ph-access-map">
              <p className="ph-eyebrow">Disclosure defaults</p>
              <div className="mt-4 space-y-2">
                {(["context", "build", "full"] as AccessTier[]).map((tier, index) => (
                  <div key={tier} className="ph-access-row">
                    <span className="ph-access-index">0{index + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-white/72">{TIER_LABELS[tier]}</p>
                      <p className="mt-1 text-xs text-white/32">
                        {tier === "context" ? "Problem framing and non-sensitive research." : tier === "build" ? "Product brief, workflow and validation detail." : "Execution plan, commercial detail and private materials."}
                      </p>
                    </div>
                    <LockKeyhole className="ml-auto size-4 text-white/20" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => (step === 1 ? onClose() : setStep(1))}
            className="text-white/55 hover:bg-white/10 hover:text-white"
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step === 1 ? (
            <Button
              type="button"
              disabled={title.trim().length < 2 || oneLiner.trim().length < 12 || description.trim().length < 30}
              className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]"
              onClick={() => setStep(2)}
            >
              Continue
              <ChevronRight />
            </Button>
          ) : (
            <Button
              type="button"
              disabled={ask.trim().length < 3 || evidence.trim().length < 3}
              className="bg-[#f5f5f5] text-black hover:bg-[#ffffff]"
              onClick={() => onSubmit({ title, oneLiner, description, category, stage, ask, evidence, media })}
            >
              <Rocket />
              Publish idea
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestsView({
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

function ProposalsView({
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

function DealsView({
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

function PeopleView({
  users,
  ideas,
  currentUserId,
  onOpenProfile,
}: {
  users: UserProfile[];
  ideas: Idea[];
  currentUserId: string | null;
  onOpenProfile: (id: string) => void;
}) {
  const [query, setQuery] = React.useState("");
  const matches = users
    .filter((user) => {
      const needle = query.trim().toLowerCase();
      if (!needle) return true;
      return [user.name, user.handle, user.title, user.location, ...user.skills, ...user.availableFor, ...user.socials.map((social) => social.handle)]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    })
    .sort((a, b) => b.credibility - a.credibility);

  return (
    <>
      <SectionHeading
        eyebrow="People graph · verified signals"
        title="Find the person behind the proof."
        detail="Search builders by name, skill, role or social handle. Every profile shows where its credibility comes from and how to reach the person directly."
      />
      <div className="ph-people-search">
        <Search />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people, skills, roles or @handles" />
        <span>{matches.length} people</span>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {matches.map((user) => {
          const publicSocials = user.socials.filter((social) => social.connected);
          const ideaCount = ideas.filter((idea) => idea.creatorId === user.id).length;
          return (
            <article key={user.id} className="ph-person-card">
              <button type="button" className="block w-full text-left" onClick={() => onOpenProfile(user.id)}>
                <div className="flex items-start gap-4">
                  <UserAvatar user={user} className="size-14" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-lg font-semibold tracking-[-0.035em] text-white">{user.name}</h2>
                      {user.id === currentUserId && <span className="ph-you-pill">You</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-white/34">{user.handle} · {user.location}</p>
                    <p className="mt-2 text-sm leading-5 text-white/55">{user.title}</p>
                  </div>
                  <ScoreRing value={user.credibility} size="sm" />
                </div>
                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-white/38">{user.bio}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {user.skills.slice(0, 4).map((skill) => <span key={skill} className="ph-skill-chip">{skill}</span>)}
                </div>
              </button>
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-1.5">
                  {publicSocials.slice(0, 4).map((social) => (
                    <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className="ph-social-icon" aria-label={social.platform}>
                      {socialIcon(social.platform)}
                    </a>
                  ))}
                </div>
                <div className="flex gap-4 font-mono text-[10px] text-white/30">
                  <span>{ideaCount} ideas</span><span>{user.projectsBuilt} builds</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!matches.length && <div className="ph-empty mt-5"><UserSearch /><h3>No matching people</h3><p>Try a broader role, skill or social handle.</p></div>}
    </>
  );
}

function ProfileView({
  user,
  ideas,
  proposals,
  onOpenIdea,
  isSelf = false,
  onConnectSocial,
}: {
  user: UserProfile;
  ideas: Idea[];
  proposals: Proposal[];
  onOpenIdea: (id: string) => void;
  isSelf?: boolean;
  onConnectSocial?: (platform: SocialPlatform) => void;
}) {
  const breakdown = [
    ["External verification", user.credibilityBreakdown.external],
    ["Execution history", user.credibilityBreakdown.execution],
    ["Community trust", user.credibilityBreakdown.community],
    ["Responsiveness", user.credibilityBreakdown.responsiveness],
  ] as const;
  return (
    <>
      <SectionHeading eyebrow="Builder identity" title={isSelf ? "Your credibility, made legible." : user.name} detail="A living view of connected identity, audience quality, execution evidence and how this person shows up inside the house." />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="ph-profile-hero">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div className="flex gap-4">
                <UserAvatar user={user} className="size-16 ring-2 ring-white/10" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-medium tracking-[-0.045em] text-white">{user.name}</h2>
                    <Badge className="border-white/15 bg-white/[0.07] text-white/75"><ShieldCheck />X identity connected</Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/42">{user.handle} · {user.title}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-white/30"><MapPin className="size-3" />{user.location}</p>
                </div>
              </div>
              <ScoreRing value={user.credibility} size="lg" />
            </div>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-white/55">{user.bio}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/24">Open to</span>
              {user.availableFor.map((item) => <span key={item} className="ph-availability-chip">{item}</span>)}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {user.skills.map((skill) => <span key={skill} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs text-white/45">{skill}</span>)}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-5">
              <ProfileStat value={user.projectsBuilt.toString()} label="Projects built" />
              <ProfileStat value={user.collaborations.toString()} label="Collaborations" />
              <ProfileStat value={user.responseRate + "%"} label="Response rate" />
            </div>
          </section>

          <section className="ph-panel">
            <div className="flex items-center justify-between">
              <div>
                <p className="ph-eyebrow">Current work</p>
                <h3 className="mt-2 text-lg font-medium text-white">Ideas and collaboration</h3>
              </div>
              <BriefcaseBusiness className="size-5 text-white/25" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {ideas.map((idea) => (
                <button type="button" key={idea.id} onClick={() => onOpenIdea(idea.id)} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:bg-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <Badge className="border-white/10 bg-white/[0.05] text-white/45">{idea.stage}</Badge>
                    <span className="text-xs text-[#f5f5f5]">{idea.signal} signal</span>
                  </div>
                  <p className="mt-4 text-base font-medium text-white/78">{idea.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/35">{idea.oneLiner}</p>
                </button>
              ))}
              {!ideas.length && <p className="text-sm text-white/35">No ideas published yet.</p>}
              {proposals.slice(0, 1).map((proposal) => (
                <div key={proposal.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <Badge className="border-[#f5f5f5]/20 bg-[#f5f5f5]/10 text-[#f5f5f5]">{proposal.status}</Badge>
                  <p className="mt-4 text-base font-medium text-white/78">{proposal.title}</p>
                  <p className="mt-1 text-xs text-white/35">{proposal.timeline} · {proposal.budget}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="ph-panel">
            <p className="ph-eyebrow">Credibility blend</p>
            <div className="mt-5 space-y-4">
              {breakdown.map(([label, score]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-white/42">{label}</span>
                    <span className="font-medium text-white/65">{score}</span>
                  </div>
                  <Progress value={score} className="h-1 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#f5f5f5]" />
                </div>
              ))}
            </div>
            <p className="mt-5 text-[11px] leading-5 text-white/28">The score blends external verification with behavior and completed work inside PassionHouse.</p>
          </section>
          <section className="ph-panel">
            <div className="flex items-center justify-between"><p className="ph-eyebrow">Connected identity</p><Link2 className="size-4 text-white/25" /></div>
            <div className="mt-4 space-y-2">
              {user.socials.map((social) => (
                <div key={social.platform} className="ph-social-row">
                  <span className="ph-social-logo">{socialIcon(social.platform)}</span>
                  <span className="min-w-0 flex-1">
                    <strong>{social.platform}</strong>
                    <small>{social.connected ? social.handle : "Not connected"}</small>
                  </span>
                  {social.connected ? (
                    <span className="text-right">
                      <strong>{compactNumber(social.followers)}</strong>
                      <small className="text-white/28">{social.growth30d ? "+" + social.growth30d + "% / 30d" : "Verified"}</small>
                    </span>
                  ) : isSelf && onConnectSocial ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => onConnectSocial(social.platform)} className="border-white/10 bg-white/[0.04] text-white hover:bg-white/10 hover:text-white">Connect</Button>
                  ) : (
                    <Lock className="size-3.5 text-white/20" />
                  )}
                </div>
              ))}
            </div>
            {isSelf && <p className="mt-4 text-[10px] leading-5 text-white/25">Connecting a social adds identity, audience quality and growth signals to your credibility score. Follower count alone never determines trust.</p>}
          </section>
          <section className="ph-panel">
            <p className="ph-eyebrow">Verified signals</p>
            <div className="mt-4 space-y-3">
              {user.verifications.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-white/52">
                  <CheckCircle2 className="size-4 text-white/70" />
                  {item}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}

function PublicProfileSheet({
  user,
  ideas,
  onOpenChange,
  onOpenIdea,
}: {
  user: UserProfile | null;
  ideas: Idea[];
  onOpenChange: (open: boolean) => void;
  onOpenIdea: (ideaId: string) => void;
}) {
  if (!user) return <Sheet open={false} />;
  const connected = user.socials.filter((social) => social.connected);
  const primarySocial = connected.find((social) => social.platform === "X") ?? connected[0];
  return (
    <Sheet open={!!user} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-white/10 bg-[#070707] p-0 text-white sm:max-w-[640px]">
        <div className="ph-public-profile-cover" aria-hidden="true"><span>01010000 01010010 01001111 01000110 01001001 01001100 01000101</span></div>
        <div className="px-6 pb-8 sm:px-8">
          <div className="-mt-9 flex items-end justify-between gap-4">
            <UserAvatar user={user} className="size-[76px] ring-4 ring-black" />
            <ScoreRing value={user.credibility} size="lg" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <h2 className="text-3xl font-semibold tracking-[-0.055em]">{user.name}</h2>
            <ShieldCheck className="size-4 text-white/60" />
          </div>
          <p className="mt-1 text-sm text-white/38">{user.handle} · {user.title}</p>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-white/30"><MapPin className="size-3" />{user.location}</p>
          <p className="mt-5 text-[15px] leading-7 text-white/58">{user.bio}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {user.availableFor.map((item) => <span key={item} className="ph-availability-chip">{item}</span>)}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {primarySocial && (
              <Button asChild className="bg-white text-black hover:bg-white/85">
                <a href={primarySocial.url} target="_blank" rel="noreferrer">Get in touch on {primarySocial.platform}<ExternalLink /></a>
              </Button>
            )}
            <Button asChild variant="outline" className="border-white/10 bg-white/[0.03] text-white hover:bg-white/10 hover:text-white">
              <a href={"mailto:" + user.email}>Email</a>
            </Button>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-2 border-y border-white/[0.07] py-5">
            <ProfileStat value={user.projectsBuilt.toString()} label="Projects built" />
            <ProfileStat value={user.collaborations.toString()} label="Collaborations" />
            <ProfileStat value={user.responseRate + "%"} label="Response rate" />
          </div>

          <section className="mt-7">
            <div className="flex items-center justify-between"><p className="ph-eyebrow">Social proof & contact</p><span className="font-mono text-[10px] text-white/25">{connected.length} CONNECTED</span></div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {connected.map((social) => (
                <a key={social.platform} href={social.url} target="_blank" rel="noreferrer" className="ph-social-profile-link">
                  <span className="ph-social-logo">{socialIcon(social.platform)}</span>
                  <span className="min-w-0 flex-1"><strong>{social.platform}</strong><small>{social.handle}</small></span>
                  <span className="text-right"><strong>{compactNumber(social.followers)}</strong><small>{social.growth30d ? "+" + social.growth30d + "%" : "linked"}</small></span>
                  <ExternalLink />
                </a>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <p className="ph-eyebrow">Public ideas</p>
            <div className="mt-3 space-y-2">
              {ideas.map((idea) => (
                <button type="button" key={idea.id} onClick={() => onOpenIdea(idea.id)} className="ph-profile-idea-row">
                  <span><strong>{idea.title}</strong><small>{idea.oneLiner}</small></span>
                  <span className="font-mono text-[10px] text-white/35">{idea.signal}</span>
                  <ChevronRight />
                </button>
              ))}
              {!ideas.length && <p className="rounded-xl border border-white/[0.07] p-4 text-sm text-white/30">No public ideas yet.</p>}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AuthDialog({
  open,
  canClose,
  users,
  onClose,
  onChooseDemo,
  onCreate,
  onLogin,
}: {
  open: boolean;
  canClose: boolean;
  users: UserProfile[];
  onClose: () => void;
  onChooseDemo: (userId: string) => void;
  onCreate: (name: string, email: string, password: string, title: string) => Promise<void>;
  onLogin: (email: string, password: string) => Promise<void>;
}) {
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [connectingX, setConnectingX] = React.useState(false);
  const featuredIdentity = users[0];

  function continueWithX(userId: string) {
    setConnectingX(true);
    window.setTimeout(() => {
      onChooseDemo(userId);
      setConnectingX(false);
    }, 650);
  }
  return (
    <Dialog open={open} onOpenChange={(next) => !next && canClose && onClose()}>
      <DialogContent showCloseButton={canClose} className="max-h-[94vh] overflow-y-auto border-white/10 bg-[#0d0f11] p-0 text-white sm:max-w-[760px]">
        <div className="grid md:grid-cols-[0.88fr_1.12fr]">
          <div className="relative overflow-hidden border-b border-white/[0.07] p-6 md:border-b-0 md:border-r md:p-8">
            <div className="ph-auth-orbit" aria-hidden="true" />
            <div className="relative">
              <Brand />
              <p className="mt-16 text-3xl font-semibold leading-[1.05] tracking-[-0.06em] text-white">
                Your next idea<br />
                needs the right signal.
              </p>
              <p className="mt-4 max-w-xs text-sm leading-6 text-white/40">
                Connect your X identity, publish in public, earn access in private, and turn the right response into a working relationship.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-2">
                <MiniProof value="6" label="Live ideas" />
                <MiniProof value="3" label="Access tiers" />
                <MiniProof value="0%" label="Platform equity" />
              </div>
            </div>
          </div>
          <div className="p-6 md:p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl tracking-[-0.04em]">Enter PassionHouse</DialogTitle>
              <DialogDescription className="text-white/40">X is the identity layer. This MVP simulates the OAuth handoff without contacting X.</DialogDescription>
            </DialogHeader>
            {featuredIdentity && (
              <Button type="button" disabled={connectingX} onClick={() => continueWithX(featuredIdentity.id)} className="mt-5 h-12 w-full bg-white text-black hover:bg-white/85">
                <span className="text-lg">𝕏</span>
                {connectingX ? "Connecting securely…" : "Continue with X"}
              </Button>
            )}
            <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-[11px] leading-5 text-white/30">
              PassionHouse reads your public identity, audience and growth signals. It never posts without permission.
            </div>
            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.13em] text-white/20">
              <span className="h-px flex-1 bg-white/[0.07]" />
              choose a demo X identity
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {users.map((user) => (
                <button type="button" key={user.id} onClick={() => continueWithX(user.id)} className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.055]">
                  <UserAvatar user={user} className="size-8" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-white/70">{user.name}</p>
                    <p className="mt-0.5 text-[10px] text-white/28">{user.credibility} credibility</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-[0.13em] text-white/20">
              <span className="h-px flex-1 bg-white/[0.07]" />
              or use local demo auth
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>
            <Tabs defaultValue="signin">
              <TabsList className="w-full bg-white/[0.04]">
                <TabsTrigger value="signin" className="text-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white">Sign in</TabsTrigger>
                <TabsTrigger value="create" className="text-white/40 data-[state=active]:bg-white/10 data-[state=active]:text-white">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-4 space-y-3">
                <FormField label="Email" value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com" type="email" />
                <FormField label="Password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" type="password" />
                <Button type="button" className="w-full bg-[#f5f5f5] text-black hover:bg-[#ffffff]" disabled={!loginEmail || loginPassword.length < 6} onClick={() => void onLogin(loginEmail, loginPassword)}>
                  Sign in
                </Button>
              </TabsContent>
              <TabsContent value="create" className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label="Name" value={name} onChange={setName} placeholder="Your name" />
                  <FormField label="Role" value={title} onChange={setTitle} placeholder="Founder, engineer…" />
                </div>
                <FormField label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
                <FormField label="Password" value={password} onChange={setPassword} placeholder="6+ characters" type="password" />
                <Button type="button" className="w-full bg-[#f5f5f5] text-black hover:bg-[#ffffff]" disabled={name.trim().length < 2 || !email.includes("@") || password.length < 6} onClick={() => void onCreate(name, email, password, title)}>
                  Create local account
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs text-white/45">{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
    </div>
  );
}

function ProfileStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-xl font-medium tracking-[-0.04em] text-white">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/28">{label}</p>
    </div>
  );
}

function MiniProof({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
      <p className="text-lg font-medium text-white">{value}</p>
      <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/28">{label}</p>
    </div>
  );
}

function CompactEmpty({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/35">
      <Icon className="size-4" />
      {title}
    </div>
  );
}
