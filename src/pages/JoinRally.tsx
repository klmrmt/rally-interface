import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";

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
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const checkedRef = useRef(false);

  const { data: rallyInfo, isLoading } = useQuery({
    queryKey: ["rally-info", hexId],
    queryFn: () => api.getRallyInfo(hexId!),
    enabled: !!hexId,
  });

  useEffect(() => {
    if (!hexId || !user || checkedRef.current) return;
    checkedRef.current = true;

    api.joinRally(hexId).then((result) => {
      sessionStorage.setItem("participantToken", result.token);
      sessionStorage.setItem("participantId", result.participant.id);
      sessionStorage.setItem("displayName", result.participant.displayName);

      if (result.alreadyJoined) {
        navigateByStatus(navigate, hexId, result.rally.status, result.hasVoted);
      }
    }).catch(() => {
      // Not yet joined — show the join form
    });
  }, [hexId, user, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hexId) return;

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
      setError(err.message || "Failed to join");
    } finally {
      setJoining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-muted)]">Loading rally...</div>
      </div>
    );
  }

  if (!rallyInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-[var(--color-muted)] text-lg mb-4">Rally not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-[var(--color-sand)] underline"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const scheduledDate = new Date(rallyInfo.scheduledTime);
  const dateStr = scheduledDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen flex flex-col px-6">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <div className="w-24 h-24 bg-[var(--color-sand)] rounded-[28px] mx-auto mb-8" />

          <h1 className="text-3xl font-bold mb-2">
            {rallyInfo.groupName}
          </h1>
          <p className="text-[var(--color-muted)] mb-1">
            {rallyInfo.callToAction || "Help decide what to do together"}
          </p>
          <div className="flex items-center justify-center gap-3 text-sm text-[var(--color-muted)] mt-3">
            <span>{dateStr} at {timeStr}</span>
            {rallyInfo.location && (
              <>
                <span className="opacity-40">|</span>
                <span>{rallyInfo.location}</span>
              </>
            )}
          </div>
          <div className="mt-2 text-sm text-[var(--color-muted)]">
            {rallyInfo.participantCount} people joined
          </div>

          <form onSubmit={handleJoin} className="mt-8 flex flex-col gap-4">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              className="w-full text-center text-lg bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-4 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
            />

            {error && (
              <p className="text-[var(--color-error)] text-sm text-center">{error}</p>
            )}
          </form>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pb-10">
        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
        >
          {joining ? "Joining..." : "Vote on what to do"}
        </button>
      </div>
    </div>
  );
}
