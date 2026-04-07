import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api.ts";

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
  const [budget, setBudget] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [distance, setDistance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!hexId || checkedRef.current) return;
    checkedRef.current = true;

    api.getVoteStatus(hexId).then((data) => {
      if (data.hasVoted) {
        if (data.status === "voting" || data.status === "recommending") {
          navigate(`/${hexId}/waiting`, { replace: true });
        } else if (data.status === "picking") {
          navigate(`/${hexId}/recommendations`, { replace: true });
        } else {
          navigate(`/${hexId}/result`, { replace: true });
        }
      }
    }).catch(() => {});
  }, [hexId, navigate]);

  const toggleVibe = (vibe: string) => {
    setVibes((prev) => {
      if (prev.includes(vibe)) return prev.filter((v) => v !== vibe);
      if (prev.length >= 2) return prev;
      return [...prev, vibe];
    });
  };

  const handleSubmit = async () => {
    if (!hexId || !budget || vibes.length === 0 || !distance) return;

    setSubmitting(true);
    setError("");

    try {
      await api.submitVote(hexId, { budget, vibes, distance });
      navigate(`/${hexId}/waiting`);
    } catch (err: any) {
      setError(err.message || "Failed to submit vote");
      setSubmitting(false);
    }
  };

  const canSubmit = budget && vibes.length > 0 && distance;

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <div className="w-full max-w-sm mx-auto flex-1">
        <h1 className="text-3xl font-bold mb-1">What's the vibe?</h1>
        <p className="text-[var(--color-muted)] mb-8">Share your preferences</p>

        {/* Budget */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Budget</h3>
          <div className="flex gap-3">
            {BUDGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBudget(opt.value)}
                className={`flex-1 py-3 rounded-full text-center font-medium transition-all ${
                  budget === opt.value
                    ? "bg-[var(--color-sand)] text-white"
                    : "bg-[var(--color-chip)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Vibe</h3>
          <div className="flex flex-wrap gap-2.5">
            {VIBE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleVibe(opt.value)}
                className={`px-5 py-2.5 rounded-full font-medium transition-all ${
                  vibes.includes(opt.value)
                    ? "bg-[var(--color-sand)] text-white"
                    : "bg-[var(--color-chip)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3">Distance</h3>
          <div className="flex gap-3">
            {DISTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDistance(opt.value)}
                className={`flex-1 py-3 rounded-full text-center font-medium transition-all ${
                  distance === opt.value
                    ? "bg-[var(--color-sand)] text-white"
                    : "bg-[var(--color-chip)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-[var(--color-error)] text-sm text-center mb-4">{error}</p>
        )}
      </div>

      <div className="w-full max-w-sm mx-auto pb-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
        >
          {submitting ? "Submitting..." : "Submit my picks"}
        </button>
      </div>
    </div>
  );
}
