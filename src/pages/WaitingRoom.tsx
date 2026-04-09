import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { PageTransition, StaggerContainer, StaggerItem } from "../components/motion";

function useCountdown(targetDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) { setTimeLeft(""); return; }

    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Closed"); return; }
      const hrs = Math.floor(diff / 3_600_000);
      const mins = Math.floor((diff % 3_600_000) / 60_000);
      const secs = Math.floor((diff % 60_000) / 1000);
      if (hrs > 0) {
        setTimeLeft(`${hrs}h ${mins}m left`);
      } else if (mins > 0) {
        setTimeLeft(`${mins}m ${secs}s left`);
      } else {
        setTimeLeft(`${secs}s left`);
      }
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

export function WaitingRoom() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ["vote-status", hexId],
    queryFn: () => api.getVoteStatus(hexId!),
    enabled: !!hexId,
    refetchInterval: 3000,
  });

  const { data: recsData } = useQuery({
    queryKey: ["recommendations-check", hexId],
    queryFn: () => api.getRecommendations(hexId!),
    enabled: !!hexId && (data?.status === "picking" || data?.status === "recommending"),
    refetchInterval: 3000,
  });

  if (recsData && recsData.recommendations.length > 0) {
    navigate(`/${hexId}/recommendations`, { replace: true });
    return null;
  }

  if (data?.status === "picking" && !recsData) {
    // Status is picking but recs haven't loaded yet — go to recommendations page
    // which handles owner vs non-owner rendering
    navigate(`/${hexId}/recommendations`, { replace: true });
    return null;
  }

  if (data?.status === "decided" || data?.status === "completed") {
    navigate(`/${hexId}/result`, { replace: true });
    return null;
  }

  const participantCount = data?.participantCount ?? 0;
  const showInvitePrompt = data?.status === "voting" && participantCount <= 2;
  const countdown = useCountdown(data?.votingClosesAt);

  const shareUrl = `${window.location.origin}/rally-api/preview/${hexId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Join my Rally!", text: "Vote on what to do!", url: shareUrl });
      } catch {}
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col bg-[var(--color-warm)]">
      <div className="px-6 pt-12">
        <div className="w-full max-w-sm mx-auto">
          <button onClick={() => navigate("/dashboard")}
            className="text-[var(--color-text)]/30 text-sm hover:text-[var(--color-text)] transition-colors font-medium">
            &larr; Back
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            {data?.status === "recommending" ? "Crunching picks" : "Waiting for votes"}
          </p>

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-9xl font-black tracking-tight leading-none">
              {data?.voteCount ?? 0}
            </span>
            <span className="text-3xl font-black text-[var(--color-text)]/20">
              / {data?.participantCount ?? 0}
            </span>
          </div>
          <p className="text-[var(--color-text)]/50 text-base mb-4">
            {data?.status === "recommending"
              ? "Finding the perfect plan..."
              : "votes locked in"}
          </p>
          {countdown && data?.status === "voting" && (
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 font-medium mb-14">
              {countdown === "Closed" ? "Voting closed" : countdown + " to vote"}
            </p>
          )}
          {(!countdown || data?.status !== "voting") && <div className="mb-14" />}

          {showInvitePrompt && (
            <>
              <hr className="rule mb-8" />
              <p className="font-black text-lg mb-1">
                Only {participantCount} {participantCount === 1 ? "person" : "people"} so far
              </p>
              <p className="text-[var(--color-text)]/40 text-sm mb-5">
                Share the link so more friends can join
              </p>
              <div className="flex gap-3 mb-10">
                {typeof navigator.share === "function" && (
                  <button onClick={handleNativeShare}
                    className="flex-1 bg-[var(--color-text)] text-white font-bold py-3.5 rounded-xl text-sm transition-colors hover:bg-[var(--color-text)]/80">
                    Share link
                  </button>
                )}
                <button onClick={handleCopyLink}
                  className={`flex-1 font-bold py-3.5 rounded-xl text-sm transition-colors ${
                    typeof navigator.share === "function"
                      ? "bg-[var(--color-text)]/5 text-[var(--color-text)] hover:bg-[var(--color-text)]/10"
                      : "bg-[var(--color-text)] text-white hover:bg-[var(--color-text)]/80"
                  }`}>
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </>
          )}

          {data?.participants && data.participants.length > 0 && (
            <>
              <hr className="rule mb-6" />
              <StaggerContainer className="space-y-0">
                {data.participants.map((p, i) => (
                  <StaggerItem key={p.id}>
                    <div className={`flex items-center justify-between py-4 ${
                      i < data.participants!.length - 1 ? "border-b border-[var(--color-text)]/8" : ""
                    }`}>
                      <span className="font-black text-base">{p.displayName}</span>
                      <span className="text-xs text-[var(--color-text)]/30 uppercase tracking-wider font-medium">joined</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
