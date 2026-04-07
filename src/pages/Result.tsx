import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { LocationMap } from "../components/LocationMap.tsx";

const FEEDBACK_TAGS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "too_crowded", label: "Too crowded" },
  { value: "fun_vibe", label: "Great vibe" },
  { value: "great_pick", label: "Would go again" },
] as const;

export function Result() {
  const { hexId } = useParams<{ hexId: string }>();
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["result", hexId],
    queryFn: () => api.getResult(hexId!),
    enabled: !!hexId,
  });

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleFeedback = async () => {
    if (!hexId || liked === null) return;
    setSending(true);
    try {
      await api.submitFeedback(hexId, liked, tags);
      setFeedbackSent(true);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-muted)] animate-pulse">Loading result...</div>
      </div>
    );
  }

  const winner = data?.winner;

  if (!winner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-bold mb-2">No winner yet</h2>
          <p className="text-[var(--color-muted)]">
            Votes are still being tallied. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  if (feedbackSent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-[var(--color-success)] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Thanks for the feedback!</h2>
          <p className="text-[var(--color-muted)]">
            This helps us improve future recommendations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      <div className="w-full max-w-sm mx-auto flex-1">
        {/* Result section (design 06) */}
        <div className="mb-10">
          <div className="w-14 h-14 bg-[var(--color-success)] rounded-full flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold mb-1">It's decided!</h1>
          <p className="text-[var(--color-muted)] mb-6">Your group chose this activity</p>

          <div className="bg-[var(--color-card)] rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-2">{winner.name}</h3>
            {winner.whyItFits && (
              <p className="text-[var(--color-muted)] text-sm mb-2">{winner.whyItFits}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
              {winner.priceLevel && <span>{winner.priceLevel} &middot; Moderately priced</span>}
              {winner.rating && <span>&middot; &#9733; {winner.rating}</span>}
            </div>
          </div>

          {winner.latitude && winner.longitude && (
            <LocationMap
              latitude={winner.latitude}
              longitude={winner.longitude}
              name={winner.name}
              className="h-48 mt-4"
            />
          )}
        </div>

        {/* Action buttons (design 06) */}
        <div className="space-y-3 mb-12">
          {winner.mapsUrl && (
            <a
              href={winner.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-[var(--color-sand)] text-white font-semibold py-4 rounded-full text-lg hover:bg-[var(--color-sand-dark)] transition-colors"
            >
              Open in Maps
            </a>
          )}
          <button className="w-full text-center bg-[var(--color-card)] text-[var(--color-brown)] font-semibold py-4 rounded-full text-lg hover:bg-[var(--color-card-hover)] transition-colors">
            View details
          </button>
        </div>

        {/* Feedback section (design 07) */}
        <div>
          <h2 className="text-3xl font-bold mb-1">How was it?</h2>
          <p className="text-[var(--color-muted)] mb-6">Help improve future recommendations</p>

          <div className="bg-[var(--color-card)] rounded-2xl px-5 py-3 mb-6">
            <p className="font-semibold text-center">{winner.name}</p>
          </div>

          <h3 className="font-semibold mb-3">Overall experience</h3>
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setLiked(true)}
              className={`w-16 h-16 rounded-full transition-all ${
                liked === true
                  ? "bg-[var(--color-success)] scale-110"
                  : "bg-[var(--color-chip)] hover:bg-[var(--color-card-hover)]"
              }`}
            />
            <button
              onClick={() => setLiked(false)}
              className={`w-16 h-16 rounded-full transition-all ${
                liked === false
                  ? "bg-[var(--color-error)] scale-110"
                  : "bg-[var(--color-chip)] hover:bg-[var(--color-card-hover)]"
              }`}
            />
          </div>

          <h3 className="font-semibold mb-3">Tell us more (optional)</h3>
          <div className="flex flex-wrap gap-2.5 mb-8">
            {FEEDBACK_TAGS.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleTag(t.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  tags.includes(t.value)
                    ? "bg-[var(--color-sand)] text-white"
                    : "bg-[var(--color-chip)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pb-4">
        <button
          onClick={handleFeedback}
          disabled={liked === null || sending}
          className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
        >
          {sending ? "Sending..." : "Submit feedback"}
        </button>
      </div>
    </div>
  );
}
