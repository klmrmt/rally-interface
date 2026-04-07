import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import type { RallyStatus } from "../types.ts";

const STATUS_BADGES: Record<RallyStatus, { label: string; color: string }> = {
  voting: { label: "Voting", color: "bg-blue-100 text-blue-700" },
  recommending: { label: "Generating", color: "bg-amber-100 text-amber-700" },
  picking: { label: "Picking", color: "bg-purple-100 text-purple-700" },
  decided: { label: "Decided", color: "bg-green-100 text-green-700" },
  completed: { label: "Completed", color: "bg-[var(--color-chip)] text-[var(--color-muted)]" },
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [hexId, setHexId] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-rallies"],
    queryFn: () => api.getMyRallies(),
  });

  const rallies = data?.rallies ?? [];
  const now = new Date();
  const upcoming = rallies.filter((r) => new Date(r.scheduledTime) > now);
  const past = rallies.filter((r) => new Date(r.scheduledTime) <= now);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = hexId.trim().toUpperCase();
    if (cleaned.length === 6) {
      navigate(`/${cleaned}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const navigateToRally = (hexId: string, status: string) => {
    if (status === "voting") {
      navigate(`/${hexId}`);
    } else if (status === "picking") {
      navigate(`/${hexId}/recommendations`);
    } else {
      navigate(`/${hexId}/result`);
    }
  };

  return (
    <div className="min-h-screen px-6 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Hey, {user?.displayName || "there"}
          </h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Your rallies</p>
        </div>
        <button
          onClick={logout}
          className="text-[var(--color-muted)] text-sm hover:text-[var(--color-brown)] transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <form
          onSubmit={handleJoinByCode}
          className="flex gap-3 flex-1"
        >
          <input
            type="text"
            value={hexId}
            onChange={(e) => setHexId(e.target.value.toUpperCase())}
            placeholder="Rally code"
            maxLength={6}
            className="flex-1 text-center text-lg tracking-[0.15em] font-mono bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-3 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
          />
          <button
            type="submit"
            disabled={hexId.trim().length !== 6}
            className="bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-full transition-colors"
          >
            Join
          </button>
        </form>
      </div>

      <button
        onClick={() => navigate("/create")}
        className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] text-white font-semibold py-3.5 rounded-full text-lg transition-colors mb-10"
      >
        + Create Rally
      </button>

      {isLoading ? (
        <div className="text-center text-[var(--color-muted)] animate-pulse py-12">
          Loading your rallies...
        </div>
      ) : rallies.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--color-muted)] text-lg mb-2">No rallies yet</p>
          <p className="text-[var(--color-muted)]/60 text-sm">
            Enter a rally code above to join your first one
          </p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
                Upcoming
              </h2>
              <div className="flex flex-col gap-3">
                {upcoming.map((rally) => {
                  const badge = STATUS_BADGES[rally.status as RallyStatus] ?? STATUS_BADGES.voting;
                  return (
                    <button
                      key={rally.id}
                      onClick={() => navigateToRally(rally.hexId, rally.status)}
                      className="w-full text-left bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl p-4 hover:border-[var(--color-sand)] transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">
                            {rally.groupName}
                          </h3>
                          <p className="text-[var(--color-muted)] text-sm mt-1">
                            {formatDate(rally.scheduledTime)} at {formatTime(rally.scheduledTime)}
                          </p>
                          {rally.location && (
                            <p className="text-[var(--color-muted)]/60 text-sm truncate mt-0.5">
                              {rally.location}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[var(--color-muted)]/60 text-xs">
                            {rally.participantCount} joined
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-4">
                Past
              </h2>
              <div className="flex flex-col gap-3">
                {past.map((rally) => {
                  const badge = STATUS_BADGES[rally.status as RallyStatus] ?? STATUS_BADGES.completed;
                  return (
                    <button
                      key={rally.id}
                      onClick={() => navigateToRally(rally.hexId, rally.status)}
                      className="w-full text-left bg-[var(--color-card)]/60 border border-[var(--color-cream-dark)]/60 rounded-2xl p-4 hover:border-[var(--color-sand)]/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold opacity-80 truncate">
                            {rally.groupName}
                          </h3>
                          <p className="text-[var(--color-muted)]/60 text-sm mt-1">
                            {formatDate(rally.scheduledTime)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[var(--color-muted)]/60 text-xs">
                            {rally.participantCount} joined
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
