"use client";

import * as React from "react";
import { CheckCircle2, Coffee, HandCoins, Heart, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Idea, UserProfile } from "@/lib/passionhouse-types";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/passionhouse/passionhouse-ui";

export type TipSubmission = {
  amount: number;
  note: string;
  kind: "tip" | "backing";
};

export function TipDialog({
  recipient,
  idea,
  initialKind = "tip",
  onClose,
  onSubmit,
}: {
  recipient: UserProfile | null;
  idea: Idea | null;
  initialKind?: "tip" | "backing";
  onClose: () => void;
  onSubmit: (recipient: UserProfile, idea: Idea | null, input: TipSubmission) => void;
}) {
  const [amount, setAmount] = React.useState(10);
  const [note, setNote] = React.useState("");
  const [kind, setKind] = React.useState<"tip" | "backing">("tip");

  React.useEffect(() => {
    if (!recipient) return;
    setAmount(10);
    setNote("");
    setKind(initialKind);
  }, [recipient, idea, initialKind]);

  return (
    <Dialog open={!!recipient} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-white/10 bg-[#090909] text-white sm:max-w-[560px]">
        <DialogHeader>
          <p className="ph-eyebrow">Demo support payment</p>
          <DialogTitle className="mt-2 text-2xl tracking-[-0.04em]">Support work you want to see exist.</DialogTitle>
          <DialogDescription className="text-white/42">A simple simulated payment. No real money is charged in this MVP.</DialogDescription>
        </DialogHeader>

        {recipient && (
          <div className="grid gap-5 py-2">
            <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <UserAvatar user={recipient} className="size-11" />
              <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white/80">{recipient.name}</strong><small className="mt-1 block truncate text-xs text-white/35">{idea ? idea.title : recipient.title}</small></span>
              <Heart className="size-5 text-[#ff7cae]" />
            </div>

            {idea?.postType === "idea" && (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setKind("tip")} className={cn("ph-support-kind", kind === "tip" && "active")}><Coffee /><span><strong>Send a tip</strong><small>Appreciate the creator</small></span>{kind === "tip" && <CheckCircle2 />}</button>
                <button type="button" onClick={() => setKind("backing")} className={cn("ph-support-kind", kind === "backing" && "active")}><Rocket /><span><strong>Back the idea</strong><small>Support its next step</small></span>{kind === "backing" && <CheckCircle2 />}</button>
              </div>
            )}

            <div>
              <Label className="text-xs text-white/45">Choose an amount</Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[5, 10, 25, 50].map((value) => <button type="button" key={value} onClick={() => setAmount(value)} className={cn("ph-tip-amount", amount === value && "active")}>${value}</button>)}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs text-white/45">Add a message <span className="text-white/25">(optional)</span></Label>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={kind === "backing" ? "What part of this idea are you backing?" : "Tell them what was useful."} className="min-h-24 border-white/10 bg-white/[0.035] text-white placeholder:text-white/25" />
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs text-white/35"><HandCoins className="size-4" /><span>Demo total</span><strong className="ml-auto text-base text-white">${amount}.00</strong></div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} className="text-white/50 hover:bg-white/10 hover:text-white">Cancel</Button>
          <Button type="button" disabled={!recipient} onClick={() => recipient && onSubmit(recipient, idea, { amount, note: note.trim(), kind })} className="bg-white text-black hover:bg-white/85"><Heart />{kind === "backing" ? "Back with" : "Tip"} ${amount}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
