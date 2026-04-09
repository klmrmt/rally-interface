import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
} from "../components/motion";
import type { RallyStatus, RallySummary } from "../types.ts";

const STATUS_LABELS: Record<RallyStatus, string> = {
  voting: "Voting",
  recommending: "Generating",
  picking: "Picking",
  decided: "Decided",
  completed: "Done",
};

const STATUS_COLORS: Record<RallyStatus, string> = {
  voting: "bg-[var(--color-warm-light)] text-[var(--color-warm-hover)]",
  picking: "bg-[var(--color-warm-light)] text-[var(--color-warm-hover)]",
  recommending: "bg-[var(--color-blue-light)] text-[var(--color-blue)]",
  decided: "bg-[var(--color-surface)] text-[var(--color-text-secondary)]",
  completed: "bg-[var(--color-surface)] text-[var(--color-text-tertiary)]",
};

function getUpdateText(rally: RallySummary): string | null {
  if (rally.status === "decided" || rally.status === "completed")
    return "Activity decided \u2014 tap to see the pick";
  if (rally.status === "picking")
    return "Organizer is choosing the spot";
  if (rally.status === "recommending")
    return "Votes are in \u2014 generating picks";
  return null;
}

function RallyCard({
  rally,
  isPast,
  onNavigate,
  onRallyAgain,
}: {
  rally: RallySummary;
  isPast: boolean;
  onNavigate: () => void;
  onRallyAgain?: () => void;
}) {
  const label = STATUS_LABELS[rally.status as RallyStatus] ?? "Active";
  const colorClass = STATUS_COLORS[rally.status as RallyStatus] ?? "bg-[var(--color-surface)] text-[var(--color-text-secondary)]";
  const dateStr = new Date(rally.scheduledTime).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = new Date(rally.scheduledTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <motion.button
      onClick={onNavigate}
      className={`w-full text-left rounded-xl border border-[var(--color-text)]/[0.06] bg-[var(--color-bg-elevated)] p-4 transition-all ${
        isPast ? "opacity-55 hover:opacity-100" : ""
      }`}
      whileHover={{ y: -2, boxShadow: "0 6px 24px rgba(0,0,0,0.05)" }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black text-lg tracking-tight truncate flex-1 min-w-0">
          {rally.groupName}
        </h3>
        <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}>
          {label}
        </span>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
        <span>{dateStr} at {timeStr}</span>
      </div>

      {rally.location && (
        <p className="mt-0.5 text-sm text-[var(--color-text-tertiary)] truncate">
          {rally.location}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">
          {rally.participantCount} {rally.participantCount === 1 ? "person" : "people"}
        </span>
        {rally.role === "creator" && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border border-[var(--color-text)]/10 rounded px-1.5 py-px">
            Host
          </span>
        )}
      </div>

      {getUpdateText(rally) && (
        <p className="mt-2 text-xs font-bold text-[var(--color-warm-hover)] tracking-wide">
          {getUpdateText(rally)}
        </p>
      )}

      {onRallyAgain && (rally.status === "decided" || rally.status === "completed") && (
        <span
          onClick={(e) => { e.stopPropagation(); onRallyAgain(); }}
          className="inline-block mt-2.5 text-xs font-bold text-[var(--color-text)]/40 hover:text-[var(--color-text)] transition-colors cursor-pointer"
        >
          Rally again &rarr;
        </span>
      )}
    </motion.button>
  );
}

const STEP_LABELS = ["Name", "When", "Message", "Where"];

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function DraftCard({
  draft,
  onResume,
  onDelete,
}: {
  draft: { id: string; step: number; data: Record<string, unknown>; updatedAt: string };
  onResume: () => void;
  onDelete: () => void;
}) {
  const name = typeof draft.data.groupName === "string" && draft.data.groupName.trim()
    ? draft.data.groupName
    : "Untitled Rally";

  return (
    <motion.div
      className="w-full text-left rounded-xl border border-dashed border-[var(--color-text)]/15 bg-[var(--color-bg-elevated)] p-4 transition-all"
      whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(0,0,0,0.04)" }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-base tracking-tight truncate flex-1 min-w-0 text-[var(--color-text-secondary)]">
          {name}
        </h3>
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-tertiary)]">
          Draft
        </span>
      </div>

      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
        Step {draft.step + 1}: {STEP_LABELS[draft.step] ?? "..."} &middot; {getRelativeTime(draft.updatedAt)}
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onResume}
          className="text-xs font-bold text-[var(--color-text)] hover:text-[var(--color-text)]/70 transition-colors"
        >
          Continue &rarr;
        </button>
        <button
          onClick={onDelete}
          className="text-xs font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] transition-colors ml-auto"
        >
          Discard
        </button>
      </div>
    </motion.div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [hexId, setHexId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-rallies"],
    queryFn: () => api.getMyRallies(),
  });

  const { data: draftsData } = useQuery({
    queryKey: ["my-drafts"],
    queryFn: () => api.getDrafts(),
  });

  const drafts = draftsData?.drafts ?? [];

  const rallies = data?.rallies ?? [];
  const now = new Date();

  const sorted = [...rallies].sort((a, b) => {
    const aActive = a.status === "voting" || a.status === "picking" ? 0 : 1;
    const bActive = b.status === "voting" || b.status === "picking" ? 0 : 1;
    if (aActive !== bActive) return aActive - bActive;

    const aTime = new Date(a.scheduledTime).getTime();
    const bTime = new Date(b.scheduledTime).getTime();
    const aPast = aTime <= now.getTime() && aActive === 1;
    const bPast = bTime <= now.getTime() && bActive === 1;
    if (aPast !== bPast) return aPast ? 1 : -1;

    return aPast ? bTime - aTime : aTime - bTime;
  });

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = hexId.trim().toUpperCase();
    if (cleaned.length === 6) navigate(`/${cleaned}`);
  };

  const navigateToRally = (hexId: string, status: string) => {
    if (status === "voting") navigate(`/${hexId}`);
    else if (status === "picking") navigate(`/${hexId}/recommendations`);
    else navigate(`/${hexId}/result`);
  };

  const isPast = (r: RallySummary) =>
    new Date(r.scheduledTime).getTime() <= now.getTime() &&
    r.status !== "voting" &&
    r.status !== "picking";

  const handleDeleteDraft = async (id: string) => {
    try {
      await api.deleteDraft(id);
      queryClient.invalidateQueries({ queryKey: ["my-drafts"] });
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  return (
    <PageTransition className="min-h-screen px-6 pt-10 pb-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Top action bar */}
        <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/create")}
            className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-text)] text-white flex items-center justify-center hover:bg-[var(--color-text)]/80 transition-colors"
            aria-label="New rally"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={hexId}
              onChange={(e) => setHexId(e.target.value.toUpperCase())}
              placeholder="Join code"
              maxLength={6}
              className="w-full text-center text-sm tracking-[0.15em] font-bold bg-[var(--color-surface)] rounded-full px-4 py-2.5 text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-text)]/15 transition-all"
            />
            {hexId.trim().length === 6 && (
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--color-text)] text-white flex items-center justify-center hover:bg-[var(--color-text)]/80 transition-colors"
                aria-label="Go"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 3.5L11 7l-3 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={logout}
            className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-text-tertiary)] flex items-center justify-center hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] transition-colors"
            aria-label="Sign out"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6.75 15.75H3.75a1.5 1.5 0 01-1.5-1.5V3.75a1.5 1.5 0 011.5-1.5h3M12 12.75L15.75 9 12 5.25M7.5 9h8.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>

        {/* Drafts */}
        {drafts.length > 0 && (
          <div className="mt-6 mb-2">
            <p className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--color-text-tertiary)] mb-3">Drafts</p>
            <div className="flex flex-col gap-2">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  onResume={() => navigate(`/create?draft=${draft.id}`)}
                  onDelete={() => handleDeleteDraft(draft.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rally list */}
        <div className="mt-8">
          {isLoading ? (
            <div className="text-[var(--color-text-tertiary)] animate-pulse py-20 text-center text-sm">
              Loading your rallies...
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-2xl font-black tracking-tight mb-2">No rallies yet</p>
              <p className="text-[var(--color-text-tertiary)] text-sm">
                Create your first rally or join one with a code.
              </p>
            </div>
          ) : (
            <StaggerContainer className="flex flex-col gap-3">
              {sorted.map((rally) => (
                <StaggerItem key={rally.id}>
                  <RallyCard
                    rally={rally}
                    isPast={isPast(rally)}
                    onNavigate={() => navigateToRally(rally.hexId, rally.status)}
                    onRallyAgain={
                      isPast(rally)
                        ? () => {
                            const params = new URLSearchParams({ groupName: rally.groupName });
                            if (rally.location) params.set("location", rally.location);
                            navigate(`/create?${params.toString()}`);
                          }
                        : undefined
                    }
                  />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
