import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useReward } from "react-rewards";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import { ScrollSnapContainer, ScrollHint } from "../components/motion";

const BUDGET_OPTIONS = [
  { value: "$", label: "$" },
  { value: "$$", label: "$$" },
  { value: "$$$", label: "$$$" },
] as const;

const VIBE_OPTIONS = [
  { value: "chill", label: "Chill" },
  { value: "drinks", label: "Drinks" },
  { value: "food", label: "Food" },
  { value: "active", label: "Active" },
  { value: "outdoors", label: "Outdoors" },
] as const;

const DISTANCE_OPTIONS = [
  { value: "walk", label: "Nearby" },
  { value: "short_drive", label: "Short drive" },
  { value: "anywhere", label: "Anywhere" },
] as const;

export function Vote() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [budget, setBudget] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [distance, setDistance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkedRef = useRef(false);
  const claimAttempted = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollTo = (index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const sections = container.querySelectorAll(".snap-section");
    sections[index]?.scrollIntoView({ behavior: "smooth" });
  };
  const { reward: rewardConfetti } = useReward("voteReward", "confetti", {
    elementCount: 30,
    spread: 60,
    lifetime: 150,
    colors: ["#F5B800", "#1A1A1A", "#10B981"],
  });

  const { data: rallyInfo } = useQuery({
    queryKey: ["rally-info", hexId],
    queryFn: () => api.getRallyInfo(hexId!),
    enabled: !!hexId,
  });

  const votingDeadline = rallyInfo?.votingClosesAt
    ? new Date(rallyInfo.votingClosesAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : null;

  useEffect(() => {
    if (!hexId || !isAuthenticated || claimAttempted.current) return;
    const pendingVote = sessionStorage.getItem("pendingVote");
    if (pendingVote) {
      claimAttempted.current = true;
      const vote = JSON.parse(pendingVote);
      sessionStorage.removeItem("pendingVote");
      const pendingName = sessionStorage.getItem("pendingDisplayName");
      sessionStorage.removeItem("pendingDisplayName");
      (async () => {
        try {
          const joinResult = await api.joinRally(hexId, pendingName || undefined);
          sessionStorage.setItem("participantToken", joinResult.token);
          sessionStorage.setItem("participantId", joinResult.participant.id);
          sessionStorage.setItem("displayName", joinResult.participant.displayName);
          await api.submitVote(hexId, vote);
          navigate(`/${hexId}/waiting`, { replace: true });
        } catch (err: any) {
          setError(err.message || "Failed to submit vote");
          setBudget(vote.budget);
          setVibes(vote.vibes);
          setDistance(vote.distance);
        }
      })();
      return;
    }
  }, [hexId, isAuthenticated, navigate]);

  useEffect(() => {
    if (!hexId || checkedRef.current || !isAuthenticated) return;
    checkedRef.current = true;
    const participantToken = sessionStorage.getItem("participantToken");
    if (!participantToken) return;
    api.getVoteStatus(hexId).then((data) => {
      if (data.hasVoted) {
        if (data.status === "voting" || data.status === "recommending") navigate(`/${hexId}/waiting`, { replace: true });
        else if (data.status === "picking") navigate(`/${hexId}/recommendations`, { replace: true });
        else navigate(`/${hexId}/result`, { replace: true });
      }
    }).catch(() => {});
  }, [hexId, navigate, isAuthenticated]);

  const toggleVibe = (vibe: string) => {
    setVibes((prev) => {
      const next = prev.includes(vibe)
        ? prev.filter((v) => v !== vibe)
        : prev.length >= 2 ? prev : [...prev, vibe];
      if (!prev.includes(vibe) && next.length === 2) {
        setTimeout(() => scrollTo(2), 400);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!hexId || !budget || vibes.length === 0 || !distance) return;
    const voteData = { budget, vibes, distance };
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingVote", JSON.stringify(voteData));
      navigate(`/login?redirect=/${hexId}/vote`);
      return;
    }
    rewardConfetti();
    setSubmitting(true);
    setError("");
    try {
      const participantToken = sessionStorage.getItem("participantToken");
      if (!participantToken) {
        const pendingName = sessionStorage.getItem("pendingDisplayName");
        sessionStorage.removeItem("pendingDisplayName");
        const joinResult = await api.joinRally(hexId, pendingName || undefined);
        sessionStorage.setItem("participantToken", joinResult.token);
        sessionStorage.setItem("participantId", joinResult.participant.id);
        sessionStorage.setItem("displayName", joinResult.participant.displayName);
      }
      await api.submitVote(hexId, voteData);
      navigate(`/${hexId}/waiting`);
    } catch (err: any) {
      setError(err.message || "Failed to submit vote");
      setSubmitting(false);
    }
  };

  const canSubmit = budget && vibes.length > 0 && distance;

  const chipClass = (active: boolean) =>
    `px-5 py-3 rounded-xl font-bold text-sm transition-all border ${
      active
        ? "bg-[var(--color-text)] text-white border-[var(--color-text)]"
        : "bg-transparent text-[var(--color-text)] border-[var(--color-text)]/15 hover:border-[var(--color-text)]/40"
    }`;

  return (
    <ScrollSnapContainer ref={containerRef}>
      {votingDeadline && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-4 pointer-events-none">
          <span className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 font-medium">
            Voting closes at {votingDeadline}
          </span>
        </div>
      )}
      {/* Budget */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">
            Step 1 of 3
          </p>
          <h1 className="text-6xl font-black tracking-tight leading-none mb-10">
            Budget
          </h1>
          <div className="flex gap-3">
            {BUDGET_OPTIONS.map((opt) => (
              <motion.button key={opt.value} onClick={() => { setBudget(opt.value); setTimeout(() => scrollTo(1), 400); }} whileTap={{ scale: 0.95 }}
                className={`flex-1 py-4 text-lg ${chipClass(budget === opt.value)}`}>
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
        <ScrollHint label="Next" />
      </section>

      {/* Vibe */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <button type="button" onClick={() => scrollTo(0)}
            className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-6">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-text)]/40">
              <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">
            Step 2 of 3
          </p>
          <h1 className="text-6xl font-black tracking-tight leading-none mb-3">
            Vibe
          </h1>
          <p className="text-[var(--color-text)]/40 text-sm mb-10">Pick up to 2</p>
          <div className="flex flex-wrap gap-3">
            {VIBE_OPTIONS.map((opt) => (
              <motion.button key={opt.value} onClick={() => toggleVibe(opt.value)} whileTap={{ scale: 0.95 }}
                className={chipClass(vibes.includes(opt.value))}>
                {opt.label}
              </motion.button>
            ))}
          </div>
        </div>
        <ScrollHint label="Next" />
      </section>

      {/* Distance */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <button type="button" onClick={() => scrollTo(1)}
            className="flex items-center gap-1 text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-6">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--color-text)]/40">
              <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">
            Step 3 of 3
          </p>
          <h1 className="text-6xl font-black tracking-tight leading-none mb-10">
            Distance
          </h1>
          <div className="flex gap-3">
            {DISTANCE_OPTIONS.map((opt) => (
              <motion.button key={opt.value} onClick={() => setDistance(opt.value)} whileTap={{ scale: 0.95 }}
                className={`flex-1 py-4 ${chipClass(distance === opt.value)}`}>
                {opt.label}
              </motion.button>
            ))}
          </div>

          {error && <p className="text-[var(--color-error)] text-sm text-center mt-6">{error}</p>}

          <div className="mt-14">
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors relative">
              <span id="voteReward" className="absolute left-1/2 top-1/2" />
              {submitting ? "Sending..." : "Lock it in"}
            </button>
          </div>
        </div>
      </section>
    </ScrollSnapContainer>
  );
}
