"use client";

import * as React from "react";
import NextImage from "next/image";
import { AtSign, Globe2, Lock, Play, Plus, Video } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AccessTier,
  FundingAudience,
  MediaAttachment,
  SocialPlatform,
  UserProfile,
  ViewKey,
} from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";

export const TIER_LABELS: Record<AccessTier, string> = {
  context: "Context",
  build: "Build brief",
  full: "Full idea",
};

export const VIEW_LABELS: Record<ViewKey, string> = {
  discover: "Discover",
  funding: "Funding",
  people: "People",
  requests: "Access requests",
  proposals: "Proposals",
  deals: "Deal rooms",
  profile: "Profile",
};

export const CATEGORIES = [
  "All sectors",
  "AI",
  "Web3",
  "Climate",
  "Civic",
  "Health",
  "Fintech",
  "Consumer",
  "Creator economy",
  "Education",
  "Future of work",
];

export const STAGES = ["All stages", "Concept", "Prototype", "Validated", "Early traction", "Pilot"];

export function relativeDate(value: string) {
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(Math.max(0, Date.now() - new Date(value).getTime()) / day);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return days + "d ago";
}

export function compactNumber(value?: number) {
  if (!value) return "0";
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1) + "M";
  if (value >= 1_000) return (value / 1_000).toFixed(value >= 10_000 ? 0 : 1) + "K";
  return value.toString();
}

export function socialIcon(platform: SocialPlatform, className = "size-4") {
  if (platform === "GitHub") return <span className="ph-social-letter" aria-hidden="true">GH</span>;
  if (platform === "LinkedIn") return <span className="ph-social-letter" aria-hidden="true">in</span>;
  if (platform === "Website") return <Globe2 className={className} />;
  if (platform === "Instagram") return <AtSign className={className} />;
  return <span className="ph-x-glyph" aria-hidden="true">𝕏</span>;
}

export function fundingAudienceLabel(audience: FundingAudience) {
  if (audience === "passionhouse") return "PassionHouse Fund";
  if (audience === "investors") return "Investor network";
  return "Investors + PassionHouse";
}

export function stateId(prefix: string) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export async function hashPassword(password: string) {
  const digest = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function UserAvatar({ user, className }: { user: UserProfile; className?: string }) {
  return (
    <Avatar className={cn("bg-black ring-1 ring-white/10", className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} className="object-cover" />}
      <AvatarFallback
        style={{ background: `linear-gradient(145deg, ${user.avatarTone} 0%, #17181b 115%)`, color: "#08090a" }}
        className="font-bold text-[11px]"
      >
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SignalMark({ compact = false }: { compact?: boolean }) {
  return <div className={cn("ph-mark", compact && "ph-mark-compact")} aria-hidden="true"><span /><i /></div>;
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <SignalMark compact={compact} />
      <div className={cn("leading-none", compact && "hidden sm:block")}>
        <p className="ph-wordmark">PassionHouse</p>
        {!compact && <p className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.19em] text-white/32">Signal into motion</p>}
      </div>
    </div>
  );
}

export function ScoreRing({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  return (
    <div
      className={cn("ph-score-ring", size === "sm" && "ph-score-ring-sm", size === "lg" && "ph-score-ring-lg")}
      style={{ "--score": value } as React.CSSProperties}
      aria-label={"Credibility score " + value}
    >
      <div><strong>{value}</strong>{size !== "sm" && <span>cred</span>}</div>
    </div>
  );
}

export function MediaGrid({ media, canViewPrivate = false, compact = false }: { media: MediaAttachment[]; canViewPrivate?: boolean; compact?: boolean }) {
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
            {locked && <div className="ph-media-lock"><Lock /><span>Private media</span><small>Request full idea to reveal</small></div>}
            {!locked && item.kind === "video" && <span className="ph-media-kind"><Video /> Video</span>}
          </div>
        );
      })}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="ph-eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-[clamp(1.7rem,4vw,2.55rem)] font-medium leading-[1.02] tracking-[-0.055em] text-white">{title}</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-6 text-white/48">{detail}</p>
      </div>
      {action}
    </div>
  );
}

export function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  const id = React.useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs text-white/45">{label}</Label>
      <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
    </div>
  );
}

export function ProfileStat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-xl font-medium tracking-[-0.04em] text-white">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-white/28">{label}</p></div>;
}

export function MiniProof({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3"><p className="text-lg font-medium text-white">{value}</p><p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/28">{label}</p></div>;
}

export function CompactEmpty({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-5 text-sm text-white/35"><Icon className="size-4" />{title}</div>;
}

export function AmbientCursor() {
  const dotRef = React.useRef<HTMLSpanElement>(null);
  const ringRef = React.useRef<HTMLSpanElement>(null);
  const progressRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("ph-has-cursor");
    const move = (event: PointerEvent) => {
      dotRef.current?.style.setProperty("transform", `translate3d(${event.clientX}px, ${event.clientY}px, 0)`);
      ringRef.current?.style.setProperty("transform", `translate3d(${event.clientX}px, ${event.clientY}px, 0)`);
    };
    const scroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current?.style.setProperty("transform", `scaleX(${max > 0 ? window.scrollY / max : 0})`);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    scroll();
    return () => {
      document.documentElement.classList.remove("ph-has-cursor");
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
    };
  }, []);

  return <><span ref={progressRef} className="ph-scroll-progress" /><span ref={ringRef} className="ph-cursor-ring" /><span ref={dotRef} className="ph-cursor-dot" /></>;
}

export function FloatingPostButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" onClick={onClick} className="ph-floating-post" aria-label="Create a new post or idea">
      <Plus />
      <span>Post</span>
    </Button>
  );
}
