import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";

export function WaitingRoom() {
  const { hexId } = useParams<{ hexId: string }>();
  const navigate = useNavigate();

  const { data } = useQuery({
    queryKey: ["vote-status", hexId],
    queryFn: () => api.getVoteStatus(hexId!),
    enabled: !!hexId,
    refetchInterval: 3000,
  });

  const { data: recsData } = useQuery({
    queryKey: ["recommendations-check", hexId],
    queryFn: () => api.getRecommendations(hexId!),
    enabled: !!hexId && (data?.status === "picking" || data?.status === "recommending"),
    refetchInterval: 3000,
  });

  if (recsData && recsData.recommendations.length > 0) {
    navigate(`/${hexId}/recommendations`, { replace: true });
    return null;
  }

  if (data?.status === "decided" || data?.status === "completed") {
    navigate(`/${hexId}/result`, { replace: true });
    return null;
  }

  const budget = sessionStorage.getItem("lastBudget");
  const vibe = sessionStorage.getItem("lastVibe");
  const dist = sessionStorage.getItem("lastDistance");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-[var(--color-muted)] text-sm hover:text-[var(--color-brown)] transition-colors mb-8"
        >
          &larr; Back to home
        </button>
      </div>
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-[var(--color-sand)] rounded-full mx-auto mb-8 animate-pulse" />

        <h2 className="text-3xl font-bold mb-3">Finding the perfect plan</h2>
        <p className="text-[var(--color-muted)] mb-10 max-w-xs mx-auto">
          {data?.status === "recommending"
            ? "Our AI is analyzing your group's preferences to find the best activities nearby"
            : `Waiting for everyone to vote \u2014 ${data?.voteCount ?? 0} of ${data?.participantCount ?? 0} so far`}
        </p>

        {(budget || vibe || dist) && (
          <div className="bg-[var(--color-card)] rounded-2xl p-5 text-left">
            <p className="text-[var(--color-muted)] text-sm mb-2">Your preferences</p>
            {budget && (
              <p className="text-sm">
                Budget: <span className="font-semibold">{budget}</span>
              </p>
            )}
            {vibe && (
              <p className="text-sm">
                Vibe: <span className="font-semibold">{vibe}</span>
              </p>
            )}
            {dist && (
              <p className="text-sm">
                Distance: <span className="font-semibold">{dist}</span>
              </p>
            )}
          </div>
        )}

        {data?.participants && data.participants.length > 0 && (
          <div className="mt-8 space-y-2">
            {data.participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[var(--color-card)] px-4 py-3 rounded-2xl"
              >
                <span className="text-sm font-medium">{p.displayName}</span>
                <span className="text-xs text-[var(--color-muted)]">joined</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
