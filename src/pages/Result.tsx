import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { api } from "../api.ts";
import { LocationMap } from "../components/LocationMap.tsx";
import { ScrollSnapContainer, ScrollHint, PageTransition } from "../components/motion";

const FEEDBACK_TAGS = [
  { value: "too_expensive", label: "Too expensive" },
  { value: "too_crowded", label: "Too crowded" },
  { value: "fun_vibe", label: "Great vibe" },
  { value: "great_pick", label: "Would go again" },
] as const;

export function Result() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();
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
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleFeedback = async () => {
    if (!hexId || liked === null) return;
    setSending(true);
    try {
      await api.submitFeedback(hexId, liked, tags);
      setFeedbackSent(true);
    } catch {} finally { setSending(false); }
  };

  const winner = data?.winner;

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.35 }, colors: ["#F5B800", "#1A1A1A", "#10B981", "#E5AB00"], scalar: 0.9, gravity: 1.2 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [winner]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-warm)]">
        <div className="text-[var(--color-text)]/60 animate-pulse text-lg">Opening the envelope...</div>
      </div>
    );
  }

  if (!winner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
        <div className="w-full max-w-sm">
          <h2 className="text-5xl font-black tracking-tight mb-3">No winner yet</h2>
          <p className="text-[var(--color-text)]/50">Votes are still being tallied. Check back soon!</p>
        </div>
      </div>
    );
  }

  if (feedbackSent) {
    return (
      <AnimatePresence mode="wait">
        <PageTransition scale className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
          <div className="w-full max-w-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-8">
              <svg className="w-7 h-7 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.div>
            <h2 className="text-5xl font-black tracking-tight mb-3">Thanks!</h2>
            <p className="text-[var(--color-text)]/50 mb-14">This helps us improve future picks.</p>

            <hr className="rule mb-10" />

            <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">Had fun?</p>
            <h3 className="text-3xl font-black tracking-tight mb-8">Plan your next outing</h3>
            <button onClick={() => navigate("/create")}
              className="w-full bg-[var(--color-text)] text-white font-bold py-4 rounded-xl text-base transition-colors hover:bg-[var(--color-text)]/80">
              Start your own Rally
            </button>
            <button onClick={() => navigate("/dashboard")}
              className="w-full mt-3 text-[var(--color-text)]/40 text-sm hover:text-[var(--color-text)] transition-colors py-2">
              Back to dashboard
            </button>
          </div>
        </PageTransition>
      </AnimatePresence>
    );
  }

  return (
    <ScrollSnapContainer className="bg-[var(--color-warm)]">
      {/* Winner reveal */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            It's decided
          </p>
          <h1 className="text-7xl font-black tracking-tight leading-[0.9] mb-8">{winner.name}</h1>

          {winner.imageUrl && (
            <div className="h-48 rounded-2xl overflow-hidden mb-6">
              <img src={winner.imageUrl} alt={winner.name} className="w-full h-full object-cover" />
            </div>
          )}

          {winner.whyItFits && (
            <p className="text-[var(--color-text)]/50 text-base mb-4">{winner.whyItFits}</p>
          )}

          {winner.address && (
            <p className="text-[var(--color-text)]/60 text-sm mb-6">{winner.address}</p>
          )}

          <hr className="rule mb-6" />

          <div className="flex gap-8 mb-8">
            {winner.priceLevel && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">Price</p>
                <p className="font-black text-2xl">{winner.priceLevel}</p>
              </div>
            )}
            {winner.rating && (
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text)]/30 mb-1">Rating</p>
                <p className="font-black text-2xl">&#9733; {winner.rating}</p>
              </div>
            )}
          </div>

          {winner.latitude && winner.longitude && (
            <LocationMap latitude={winner.latitude} longitude={winner.longitude} name={winner.name} className="h-40 rounded-2xl overflow-hidden mb-6" />
          )}

          {winner.mapsUrl && (
            <a href={winner.mapsUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full text-center bg-[var(--color-text)] text-white font-bold py-4 rounded-xl text-base hover:bg-[var(--color-text)]/80 transition-colors">
              Open in Maps
            </a>
          )}
        </div>
        <ScrollHint label="Leave feedback" />
      </section>

      {/* Feedback */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">
            After the hangout
          </p>
          <h2 className="text-5xl font-black tracking-tight leading-none mb-10">
            How was it?
          </h2>

          <div className="flex gap-4 mb-10">
            <motion.button onClick={() => setLiked(true)} whileTap={{ scale: 0.9 }}
              animate={liked === true ? { scale: 1.1 } : { scale: 1 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                liked === true ? "bg-[var(--color-success)]" : "bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10"
              }`}>
              <svg className={`w-7 h-7 ${liked === true ? "text-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
              </svg>
            </motion.button>
            <motion.button onClick={() => setLiked(false)} whileTap={{ scale: 0.9 }}
              animate={liked === false ? { scale: 1.1 } : { scale: 1 }}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                liked === false ? "bg-[var(--color-error)]" : "bg-[var(--color-text)]/5 hover:bg-[var(--color-text)]/10"
              }`}>
              <svg className={`w-7 h-7 rotate-180 ${liked === false ? "text-white" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
              </svg>
            </motion.button>
          </div>

          <hr className="rule mb-8" />

          <p className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--color-text)]/40 mb-4">Tell us more</p>
          <div className="flex flex-wrap gap-3 mb-12">
            {FEEDBACK_TAGS.map((t) => (
              <motion.button key={t.value} onClick={() => toggleTag(t.value)} whileTap={{ scale: 0.95 }}
                className={`px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                  tags.includes(t.value) ? "bg-[var(--color-text)] text-white border-[var(--color-text)]" : "bg-transparent text-[var(--color-text)] border-[var(--color-text)]/15 hover:border-[var(--color-text)]/40"
                }`}>
                {t.label}
              </motion.button>
            ))}
          </div>

          <button onClick={handleFeedback} disabled={liked === null || sending}
            className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors">
            {sending ? "Sending..." : "Submit feedback"}
          </button>
        </div>
      </section>
    </ScrollSnapContainer>
  );
}
