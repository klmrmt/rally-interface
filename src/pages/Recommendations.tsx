import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../api.ts";
import { LocationMap } from "../components/LocationMap.tsx";
import { PageTransition, StaggerContainer, StaggerItem } from "../components/motion";

export function Recommendations() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["recommendations", hexId],
    queryFn: () => api.getRecommendations(hexId!),
    enabled: !!hexId,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      if (!d.isOwner) return 3000;
      return false;
    },
  });

  if (data?.status === "decided" || data?.status === "completed") {
    navigate(`/${hexId}/result`, { replace: true });
    return null;
  }

  const isOwner = data?.isOwner ?? false;

  const handleSelect = async () => {
    if (!hexId || !selectedId) return;
    setSubmitting(true);
    try {
      await api.selectWinner(hexId, selectedId);
      navigate(`/${hexId}/result`, { replace: true });
    } catch {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--color-text-secondary)] animate-pulse">Loading recommendations...</div>
      </div>
    );
  }

  const recs = data?.recommendations || [];

  if (!isOwner) {
    return (
      <PageTransition className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
        <div className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            Hang tight
          </p>
          <h1 className="text-5xl font-black tracking-tight leading-[0.95] mb-4">
            The organizer is picking the spot
          </h1>
          <p className="text-[var(--color-text)]/50 text-base mb-8">
            You'll be notified once the final location is chosen.
          </p>
          <div className="flex items-center gap-2 text-[var(--color-text)]/30">
            <div className="w-2 h-2 rounded-full bg-[var(--color-text)]/20 animate-pulse" />
            <span className="text-sm">Waiting for selection...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  const selected = recs.find((r) => r.id === selectedId);

  return (
    <PageTransition className="min-h-screen flex flex-col px-6 py-8">
      <div className="w-full max-w-sm mx-auto flex-1">
        <div className="h-1.5 w-full bg-[var(--color-warm)] rounded-full mb-8" />

        <h1 className="text-4xl font-black tracking-tight mb-1">
          Choose the spot
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mb-8">
          Your group's preferences led to these picks
        </p>

        <StaggerContainer className="space-y-0 mb-8">
          {recs.map((rec, index) => {
            const isSelected = selectedId === rec.id;

            return (
              <StaggerItem key={rec.id}>
                <motion.button onClick={() => { setSelectedId(rec.id); setConfirming(false); }}
                  onMouseEnter={() => setHoveredId(rec.id)} onMouseLeave={() => setHoveredId(null)}
                  layout whileHover={{ y: -1 }} transition={{ duration: 0.2 }}
                  className={`w-full text-left py-5 ${index < recs.length - 1 ? "border-b border-[var(--color-border)]" : ""} transition-all ${
                    isSelected ? "bg-[var(--color-warm-light)] -mx-4 px-4 rounded-xl border-none" : ""
                  }`}>
                  {rec.imageUrl && (hoveredId === rec.id || isSelected) && (
                    <div className="h-36 rounded-xl overflow-hidden mb-4">
                      <img src={rec.imageUrl} alt={rec.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!rec.imageUrl && rec.latitude && rec.longitude && (hoveredId === rec.id || isSelected) && (
                    <div className="h-36 rounded-xl overflow-hidden mb-4">
                      <LocationMap latitude={rec.latitude} longitude={rec.longitude} name={rec.name} className="h-full" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2.5 shrink-0 ${isSelected ? "bg-[var(--color-warm)]" : "bg-[var(--color-border)]"}`} />
                    <div className="flex-1">
                      <h3 className="font-black text-xl">{rec.name}</h3>
                      {rec.whyItFits && <p className="text-[var(--color-text-secondary)] text-sm mt-1">{rec.whyItFits}</p>}
                      {isSelected && rec.address && (
                        <p className="text-[var(--color-text-secondary)] text-xs mt-1">{rec.address}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        {rec.priceLevel && <span className="text-xs text-[var(--color-text-secondary)]">{rec.priceLevel}</span>}
                        {rec.rating && <span className="text-xs text-[var(--color-text-secondary)]">&#9733; {rec.rating}</span>}
                        {rec.distanceLabel && <span className="text-xs text-[var(--color-text-secondary)]">{rec.distanceLabel}</span>}
                        {rec.category && <span className="text-xs text-[var(--color-text-secondary)]">{rec.category}</span>}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[var(--color-warm)] text-lg mt-1">&rarr;</span>
                    )}
                  </div>
                </motion.button>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>

      <div className="w-full max-w-sm mx-auto pb-4">
        <AnimatePresence mode="wait">
          {confirming && selected ? (
            <motion.div key="confirm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <p className="text-center text-sm text-[var(--color-text-secondary)] mb-3">
                Lock in <span className="font-bold text-[var(--color-text)]">{selected.name}</span>?
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirming(false)}
                  className="flex-1 bg-[var(--color-text)]/5 text-[var(--color-text)] font-bold py-3.5 rounded-xl text-base transition-colors hover:bg-[var(--color-text)]/10">
                  Go back
                </button>
                <button onClick={handleSelect} disabled={submitting}
                  className="flex-1 bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-base transition-colors">
                  {submitting ? "Locking in..." : "Lock it in"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="select" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <button onClick={() => { if (selectedId) setConfirming(true); }} disabled={!selectedId}
                className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-base transition-colors">
                Choose this spot
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
