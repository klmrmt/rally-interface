import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api.ts";
import { LocationMap } from "../components/LocationMap.tsx";

const CARD_COLORS = [
  "bg-[#D4A574]",
  "bg-[#7BAE7F]",
  "bg-[#B8A0D2]",
  "bg-[#E8B4B4]",
  "bg-[#A0C4E8]",
];

export function Recommendations() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", hexId],
    queryFn: () => api.getRecommendations(hexId!),
    enabled: !!hexId,
    refetchInterval: voted ? 3000 : false,
  });

  if (data?.status === "decided" || data?.status === "completed") {
    navigate(`/${hexId}/result`, { replace: true });
    return null;
  }

  const handlePick = async () => {
    if (!hexId || !selectedId) return;
    setSubmitting(true);
    try {
      await api.submitPick(hexId, selectedId);
      setVoted(true);
      queryClient.invalidateQueries({ queryKey: ["recommendations", hexId] });
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-muted)] animate-pulse">
          Loading recommendations...
        </div>
      </div>
    );
  }

  const recs = data?.recommendations || [];
  const tally = data?.voteTally || [];
  const tallyMap = new Map(tally.map((t) => [t.recommendationId, t.count]));
  const totalFinalVotes = data?.finalVoteCount ?? 0;
  const participantCount = data?.participantCount ?? 0;

  return (
    <div className="min-h-screen flex flex-col px-6 py-8">
      <div className="w-full max-w-sm mx-auto flex-1">
        <h1 className="text-3xl font-bold mb-1">
          {voted ? "Vote for your favorite" : "Perfect for your group"}
        </h1>
        <p className="text-[var(--color-muted)] text-sm mb-6">
          {voted
            ? `${totalFinalVotes} of ${participantCount} friends voted`
            : "Tap to see more details"}
        </p>

        <div className="space-y-5 mb-8">
          {recs.map((rec, index) => {
            const votes = tallyMap.get(rec.id) || 0;
            const isSelected = selectedId === rec.id;
            const colorClass = CARD_COLORS[index % CARD_COLORS.length];

            if (voted) {
              return (
                <div
                  key={rec.id}
                  className={`rounded-2xl overflow-hidden transition-all ${
                    isSelected
                      ? "bg-gradient-to-br from-[var(--color-sand)] to-[var(--color-sand-dark)] text-white"
                      : "bg-[var(--color-card)]"
                  }`}
                >
                  {isSelected && rec.latitude && rec.longitude && (
                    <div className="h-36">
                      <LocationMap
                        latitude={rec.latitude}
                        longitude={rec.longitude}
                        name={rec.name}
                        className="h-full"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-lg">{rec.name}</h3>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-[var(--color-chip)] text-[var(--color-brown)]"
                      }`}>
                        {votes} vote{votes !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {rec.whyItFits && (
                      <p className={`text-sm mt-2 ${isSelected ? "text-white/80" : "text-[var(--color-muted)]"}`}>
                        {rec.whyItFits}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      {rec.priceLevel && (
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          isSelected ? "bg-white/20" : "bg-[var(--color-chip)]"
                        }`}>{rec.priceLevel}</span>
                      )}
                      {rec.distanceLabel && (
                        <span className={`text-xs px-2.5 py-1 rounded-full ${
                          isSelected ? "bg-white/20" : "bg-[var(--color-chip)]"
                        }`}>{rec.distanceLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={rec.id}
                onClick={() => setSelectedId(rec.id)}
                onMouseEnter={() => setHoveredId(rec.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`w-full text-left rounded-2xl overflow-hidden transition-all ${
                  isSelected
                    ? "ring-3 ring-[var(--color-sand)]"
                    : ""
                }`}
              >
                {rec.latitude && rec.longitude && (hoveredId === rec.id || isSelected) ? (
                  <div className="h-36">
                    <LocationMap
                      latitude={rec.latitude}
                      longitude={rec.longitude}
                      name={rec.name}
                      className="h-full"
                    />
                  </div>
                ) : (
                  <div className={`h-28 ${colorClass}`} />
                )}
                <div className="bg-[var(--color-card)] p-5">
                  <h3 className="font-bold text-lg mb-1">{rec.name}</h3>
                  {rec.whyItFits && (
                    <p className="text-[var(--color-muted)] text-sm mb-3">
                      {rec.whyItFits}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {rec.priceLevel && (
                      <span className="text-xs px-2.5 py-1 bg-[var(--color-chip)] rounded-full">
                        {rec.priceLevel}
                      </span>
                    )}
                    {rec.distanceLabel && (
                      <span className="text-xs px-2.5 py-1 bg-[var(--color-chip)] rounded-full">
                        {rec.distanceLabel}
                      </span>
                    )}
                    {rec.category && (
                      <span className="text-xs px-2.5 py-1 bg-[var(--color-chip)] rounded-full">
                        {rec.category}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-sm mx-auto pb-4">
        {!voted ? (
          <button
            onClick={handlePick}
            disabled={!selectedId || submitting}
            className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
          >
            {submitting ? "Submitting..." : "Lock in my pick"}
          </button>
        ) : (
          <button
            onClick={() => navigate(`/${hexId}/result`)}
            className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] text-white font-semibold py-4 rounded-full text-lg transition-colors"
          >
            See Results
          </button>
        )}
      </div>
    </div>
  );
}
