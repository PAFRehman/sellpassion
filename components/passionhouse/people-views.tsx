"use client";

import * as React from "react";
import {
  BriefcaseBusiness, CheckCircle2, ChevronRight, ExternalLink, Link2, Lock, MapPin,
  Search, ShieldCheck, UserSearch,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Idea, Proposal, SocialPlatform, UserProfile } from "@/lib/passionhouse-types";
import {
  Brand, FormField, MiniProof, ProfileStat, ScoreRing, SectionHeading, UserAvatar,
  compactNumber, socialIcon,
} from "@/components/passionhouse/passionhouse-ui";

export function PeopleView({
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
                      {user.identityStyle === "nft" && <span className="ph-you-pill">Web3</span>}
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

export function ProfileView({
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

export function PublicProfileSheet({
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

export function AuthDialog({
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
                Connect your X identity, post in public, unlock project plans, find funding, and turn the right response into a working relationship.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-2">
                <MiniProof value="20+" label="Live posts" />
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

