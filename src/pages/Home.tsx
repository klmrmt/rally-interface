import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const [hexId, setHexId] = useState("");
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = hexId.trim().toUpperCase();
    if (cleaned.length === 6) {
      navigate(`/${cleaned}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-[var(--color-sand)] rounded-[22px] mx-auto mb-6" />
        <h1 className="text-5xl font-bold mb-3 tracking-tight">Rally</h1>
        <p className="text-[var(--color-muted)] text-lg max-w-xs mx-auto">
          Help your group go from "what should we do?" to a decision in under 2
          minutes.
        </p>
      </div>

      <form
        onSubmit={handleJoin}
        className="w-full max-w-xs flex flex-col gap-4"
      >
        <input
          type="text"
          value={hexId}
          onChange={(e) => setHexId(e.target.value.toUpperCase())}
          placeholder="Enter rally code"
          maxLength={6}
          className="w-full text-center text-2xl tracking-[0.3em] font-mono bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-4 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
        />
        <button
          type="submit"
          disabled={hexId.trim().length !== 6}
          className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
        >
          Join Rally
        </button>
      </form>
    </div>
  );
}
