import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { trackEvent } from "../utils/analytics.ts";
import { PageTransition } from "../components/motion";
import { TicketCode } from "../components/TicketCode";
import { copyToClipboard } from "../utils/clipboard";

export function ShareSheet({
  hexId,
  groupName,
  votingClosesAt,
  onContinue,
}: {
  hexId: string;
  groupName: string;
  votingClosesAt?: string | null;
  onContinue: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const rallyUrl = `${window.location.origin}/${hexId}`;
  const shareUrl = `${window.location.origin}/rally-api/preview/${hexId}`;

  const formattedDeadline = votingClosesAt
    ? new Date(votingClosesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.4 }, colors: ["#F5B800", "#1A1A1A", "#10B981", "#E5AB00"], scalar: 0.8 });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = async () => {
    await copyToClipboard(rallyUrl);
    setCopied(true);
    trackEvent("rally.shared", { method: "copy", hexId });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      const deadlineText = formattedDeadline ? ` Voting closes at ${formattedDeadline}.` : "";
      await navigator.share({ title: `${groupName} — Rally`, text: `Vote on what to do for ${groupName}!${deadlineText}`, url: shareUrl });
      trackEvent("rally.shared", { method: "native_share", hexId });
    } catch {}
  };

  const handleSmsShare = () => {
    trackEvent("rally.shared", { method: "sms", hexId });
    const deadlineText = formattedDeadline ? ` Voting closes at ${formattedDeadline}.` : "";
    const body = encodeURIComponent(`Join my Rally "${groupName}" and vote on what to do!${deadlineText} ${shareUrl}`);
    window.open(`sms:?&body=${body}`, "_self");
  };

  const canNativeShare = typeof navigator.share === "function";

  return (
    <PageTransition scale className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
      <div className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/50 mb-3">
          Rally created
        </p>
        <h1 className="text-5xl font-black tracking-tight mb-2">{groupName}</h1>
        {formattedDeadline && (
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/40 mb-8">
            Voting closes at {formattedDeadline}
          </p>
        )}
        {!formattedDeadline && <div className="mb-8" />}

        <div className="bg-white rounded-2xl p-6 mb-6">
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-tertiary)] mb-3">Share this code</p>
          <div className="flex justify-center mb-4">
            <TicketCode code={hexId} size="lg" />
          </div>

          <div className="flex items-center gap-3 bg-[var(--color-surface)] rounded-xl px-4 py-3">
            <span className="flex-1 text-sm font-mono truncate text-[var(--color-text)]">{rallyUrl}</span>
            <button onClick={handleCopy}
              className="shrink-0 bg-[var(--color-text)] text-white text-sm font-bold px-4 py-1.5 rounded-lg transition-colors hover:bg-[var(--color-text)]/80">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {canNativeShare && (
            <button onClick={handleNativeShare}
              className="w-full bg-[var(--color-text)] text-white font-bold py-3.5 rounded-xl text-base transition-colors hover:bg-[var(--color-text)]/80">
              Share with friends
            </button>
          )}
          <button onClick={handleSmsShare}
            className={`w-full font-bold py-3.5 rounded-xl text-base transition-colors ${
              canNativeShare
                ? "bg-white/30 text-[var(--color-text)] hover:bg-white/50"
                : "bg-[var(--color-text)] text-white hover:bg-[var(--color-text)]/80"
            }`}>
            Send via text
          </button>
        </div>

        <button onClick={onContinue} className="w-full text-center text-[var(--color-text)]/50 text-sm hover:text-[var(--color-text)] transition-colors">
          Continue to rally &rarr;
        </button>
      </div>
    </PageTransition>
  );
}
