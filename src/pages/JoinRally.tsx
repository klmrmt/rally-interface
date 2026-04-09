import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import { ScrollSnapContainer, ScrollHint } from "../components/motion";

function navigateByStatus(navigate: ReturnType<typeof useNavigate>, hexId: string, status: string, hasVoted: boolean) {
  if (status === "voting") {
    if (hasVoted) {
      navigate(`/${hexId}/waiting`, { replace: true });
    } else {
      navigate(`/${hexId}/vote`, { replace: true });
    }
  } else if (status === "picking" || status === "recommending") {
    navigate(`/${hexId}/recommendations`, { replace: true });
  } else {
    navigate(`/${hexId}/result`, { replace: true });
  }
}

export function JoinRally() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const checkedRef = useRef(false);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
  }, [user?.displayName]);

  const { data: rallyInfo, isLoading, isError, error: queryError } = useQuery({
    queryKey: ["rally-info", hexId],
    queryFn: () => api.getRallyInfo(hexId!),
    enabled: !!hexId,
    retry: (failureCount, err) => {
      if (err instanceof Error && err.message === "Rally not found") return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (!hexId || !isAuthenticated || !user || checkedRef.current) return;
    checkedRef.current = true;

    api.joinRally(hexId).then((result) => {
      sessionStorage.setItem("participantToken", result.token);
      sessionStorage.setItem("participantId", result.participant.id);
      sessionStorage.setItem("displayName", result.participant.displayName);

      if (result.alreadyJoined) {
        navigateByStatus(navigate, hexId, result.rally.status, result.hasVoted);
      }
    }).catch(() => {});
  }, [hexId, isAuthenticated, user, navigate]);

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!hexId) return;

    if (!isAuthenticated) {
      if (displayName.trim()) {
        sessionStorage.setItem("pendingDisplayName", displayName.trim());
      }
      navigate(`/login?redirect=/${hexId}`);
      return;
    }

    setJoining(true);
    setError("");

    try {
      const name = displayName.trim() || undefined;
      const result = await api.joinRally(hexId, name);
      sessionStorage.setItem("participantToken", result.token);
      sessionStorage.setItem("participantId", result.participant.id);
      sessionStorage.setItem("displayName", result.participant.displayName);

      navigateByStatus(navigate, hexId, result.rally.status, result.hasVoted);
    } catch (err: any) {
      const msg = err.message || "Failed to join";
      if (msg.includes("log in again")) {
        localStorage.removeItem("authToken");
        navigate(`/login?redirect=/${hexId}`);
        return;
      }
      setError(msg);
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-warm)]">
        <div className="animate-pulse text-[var(--color-text)]/60">Loading rally...</div>
      </div>
    );
  }

  if (!rallyInfo) {
    const isNotFound = queryError instanceof Error && queryError.message === "Rally not found";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
        <p className="text-[var(--color-text)]/60 text-lg mb-4">
          {isNotFound ? "Rally not found" : "Couldn't load rally — try again in a moment"}
        </p>
        <button onClick={() => isNotFound ? navigate("/") : window.location.reload()} className="text-[var(--color-text)] font-bold underline">
          {isNotFound ? "Back to home" : "Retry"}
        </button>
      </div>
    );
  }

  const scheduledDate = new Date(rallyInfo.scheduledTime);
  const dateStr = scheduledDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const votingDeadline = rallyInfo.votingClosesAt
    ? new Date(rallyInfo.votingClosesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <ScrollSnapContainer className="bg-[var(--color-warm)]">
      {/* Rally info */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            You're invited
          </p>

          <h1 className="text-7xl font-black tracking-tight leading-[0.9] mb-6">
            {rallyInfo.groupName}
          </h1>

          {rallyInfo.callToAction && (
            <p className="text-lg text-[var(--color-text)]/60 mb-8">
              {rallyInfo.callToAction}
            </p>
          )}

          <hr className="rule mb-6" />

          <div className="flex gap-8 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">When</p>
              <p className="font-black text-[var(--color-text)] text-lg">{dateStr}</p>
              <p className="text-[var(--color-text)]/50 text-sm">{timeStr}</p>
            </div>
            {rallyInfo.location && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">Where</p>
                <p className="font-black text-[var(--color-text)] text-lg">{rallyInfo.location}</p>
              </div>
            )}
            {votingDeadline && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">Voting closes</p>
                <p className="font-black text-[var(--color-text)] text-lg">{votingDeadline}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">Joined</p>
              <p className="font-black text-[var(--color-text)] text-3xl leading-none">{rallyInfo.participantCount}</p>
            </div>
          </div>
        </div>
        <ScrollHint label="Join" />
      </section>

      {/* Name + CTA */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            What should we call you?
          </p>
          <h2 className="text-5xl font-black tracking-tight leading-none mb-10">
            Your name
          </h2>

          <form onSubmit={handleJoin}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              maxLength={30}
              className="w-full text-2xl font-bold bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-4 text-[var(--color-text)] placeholder-[var(--color-text)]/20 focus:outline-none focus:border-[var(--color-text)] transition-all"
            />
            {error && <p className="text-[var(--color-error)] text-sm mt-3">{error}</p>}

            <button
              type="submit"
              disabled={joining}
              className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors mt-10"
            >
              {joining ? "Joining..." : "Vote on what to do"}
            </button>
          </form>
        </div>
      </section>
    </ScrollSnapContainer>
  );
}
