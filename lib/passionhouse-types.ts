export type ViewKey = "discover" | "people" | "requests" | "proposals" | "deals" | "profile";

export type AccessTier = "context" | "build" | "full";

export type CredibilityBreakdown = {
  external: number;
  execution: number;
  community: number;
  responsiveness: number;
};

export type SocialPlatform = "X" | "LinkedIn" | "GitHub" | "Instagram" | "Website";

export type SocialAccount = {
  platform: SocialPlatform;
  handle: string;
  url: string;
  connected: boolean;
  followers?: number;
  growth30d?: number;
  trustContribution: number;
};

export type UserProfile = {
  id: string;
  name: string;
  handle: string;
  email: string;
  title: string;
  bio: string;
  location: string;
  skills: string[];
  avatarTone: string;
  credibility: number;
  credibilityBreakdown: CredibilityBreakdown;
  verifications: string[];
  projectsBuilt: number;
  collaborations: number;
  responseRate: number;
  joinedAt: string;
  availableFor: string[];
  socials: SocialAccount[];
};

export type MediaAttachment = {
  id: string;
  kind: "image" | "video";
  name: string;
  url: string;
  visibility: "public" | "private";
};

export type ValidationMetric = {
  label: string;
  value: string;
  detail: string;
};

export type Idea = {
  id: string;
  creatorId: string;
  title: string;
  oneLiner: string;
  description: string;
  category: string;
  stage: string;
  createdAt: string;
  signal: number;
  tags: string[];
  asks: string[];
  validation: ValidationMetric[];
  likes: number;
  dislikes: number;
  interested: number;
  commentsCount: number;
  visibility: "public";
  media: MediaAttachment[];
  accessTiers: {
    context: string;
    build: string;
    full: string;
  };
};

export type Comment = {
  id: string;
  ideaId: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type AccessRequest = {
  id: string;
  ideaId: string;
  userId: string;
  requestedTier: AccessTier;
  grantedTier?: AccessTier;
  role: string;
  note: string;
  status: "pending" | "approved" | "declined";
  createdAt: string;
};

export type Proposal = {
  id: string;
  ideaId: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  summary: string;
  scope: string;
  timeline: string;
  budget: string;
  status: "draft" | "sent" | "accepted" | "declined";
  createdAt: string;
};

export type DealMessage = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type Milestone = {
  id: string;
  title: string;
  due: string;
  amount: string;
  status: "upcoming" | "active" | "complete";
};

export type DealDocument = {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
};

export type DealRoom = {
  id: string;
  ideaId: string;
  participantIds: string[];
  status: "active" | "complete";
  agreement: {
    title: string;
    budget: string;
    timeline: string;
    ownership: string;
    platformEquity: string;
  };
  milestones: Milestone[];
  messages: DealMessage[];
  documents: DealDocument[];
};

export type LocalAccount = {
  userId: string;
  email: string;
  passwordHash: string;
};

export type PassionHouseState = {
  schemaVersion: 2;
  currentUserId: string | null;
  users: UserProfile[];
  ideas: Idea[];
  comments: Comment[];
  accessRequests: AccessRequest[];
  proposals: Proposal[];
  dealRooms: DealRoom[];
  reactions: Record<string, "like" | "dislike">;
  interests: string[];
  localAccounts: LocalAccount[];
};
