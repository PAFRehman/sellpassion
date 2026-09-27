export type ViewKey = "discover" | "funding" | "people" | "requests" | "proposals" | "deals" | "profile";

export type AccessTier = "context" | "build" | "full";

export type AccessMode = "public" | "trust" | "paid" | "hybrid";

export type ContentType = "post" | "idea" | "article";

export type ContentAccess = "public" | "build" | "full";

export type ContentSection = {
  id: string;
  label: string;
  title: string;
  body: string;
  access: ContentAccess;
  bullets?: string[];
};

export type BuildNeed = {
  role: string;
  contribution: string;
  commitment: string;
};

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
  avatarUrl?: string;
  identityStyle?: "person" | "nft";
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
  fullDetails: string;
  postType: ContentType;
  disclosure: "open" | "tiered";
  accessMode: AccessMode;
  trustThreshold: number;
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
  accessPricing: {
    currency: "USD";
    context: number;
    build: number;
    full: number;
  };
  readingTime: number;
  sections: ContentSection[];
  buildNeeds: BuildNeed[];
  tipsTotal: number;
  tipCount: number;
  backerCount: number;
  progress: number;
};

export type FundingAudience = "community" | "investors" | "passionhouse" | "both";

export type FundingType = "milestone" | "investment" | "grant";

export type FundingRequest = {
  id: string;
  ideaId: string;
  userId: string;
  audience: FundingAudience;
  amount: string;
  summary: string;
  useOfFunds: string;
  fundingType?: FundingType;
  proof?: string;
  timeline?: string;
  raisedAmount?: number;
  backerCount?: number;
  status: "open" | "under-review" | "funded";
  createdAt: string;
};

export type Tip = {
  id: string;
  fromUserId: string;
  toUserId: string;
  ideaId?: string;
  amount: number;
  note: string;
  kind: "tip" | "backing";
  createdAt: string;
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
  accessMethod?: "request" | "paid" | "trust";
  amountPaid?: string;
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
  schemaVersion: 4;
  currentUserId: string | null;
  users: UserProfile[];
  ideas: Idea[];
  comments: Comment[];
  accessRequests: AccessRequest[];
  proposals: Proposal[];
  dealRooms: DealRoom[];
  fundingRequests: FundingRequest[];
  tips: Tip[];
  reactions: Record<string, "like" | "dislike">;
  interests: string[];
  localAccounts: LocalAccount[];
};
