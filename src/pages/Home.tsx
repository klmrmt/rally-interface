import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScrollSnapContainer,
  ScrollHint,
  StaggerContainer,
  StaggerItem,
} from "../components/motion";

const STEPS = [
  { number: "01", title: "Create" },
  { number: "02", title: "Vote" },
  { number: "03", title: "Go" },
] as const;

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
    <ScrollSnapContainer className="bg-[var(--color-warm)]">
      {/* Hero */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/50 mb-4">
            Decide Together
          </p>
          <h1 className="text-9xl font-black tracking-tight leading-[0.85] mb-6">
            Rally
          </h1>
          <p className="text-[var(--color-text)]/60 text-lg leading-relaxed max-w-[260px]">
            From "what should we do?" to a plan in under 2 minutes.
          </p>

          <div className="flex flex-col gap-3 mt-14 w-full">
            <button
              onClick={() => navigate("/login?redirect=/create")}
              className="w-full bg-[var(--color-text)] text-white font-bold py-4 rounded-xl text-base transition-colors hover:bg-[var(--color-text)]/80"
            >
              Start a Rally
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full text-[var(--color-text)]/60 font-medium py-3 text-sm hover:text-[var(--color-text)] transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
        <ScrollHint label="How it works" />
      </section>

      {/* How it works */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <StaggerContainer className="flex flex-col">
            {STEPS.map((step, i) => (
              <StaggerItem key={step.number}>
                <div className={`py-8 ${i < STEPS.length - 1 ? "border-b border-[var(--color-text)]/10" : ""}`}>
                  <span className="text-sm font-medium text-[var(--color-text)]/30 tracking-wider">
                    {step.number}
                  </span>
                  <h2 className="text-6xl font-black tracking-tight leading-none mt-1">
                    {step.title}
                  </h2>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <ScrollHint label="Join a rally" />
      </section>

      {/* Join by code */}
      <section className="snap-section">
        <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-4">
            Have a code?
          </p>
          <h2 className="text-5xl font-black tracking-tight leading-none mb-10">
            Join
          </h2>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <input
              type="text"
              value={hexId}
              onChange={(e) => setHexId(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-full text-center text-3xl tracking-[0.25em] font-black bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-4 text-[var(--color-text)] placeholder-[var(--color-text)]/20 focus:outline-none focus:border-[var(--color-text)] transition-all"
            />
            <button
              type="submit"
              disabled={hexId.trim().length !== 6}
              className="w-full bg-[var(--color-text)] disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-all"
            >
              Join Rally
            </button>
          </form>
        </div>
      </section>
    </ScrollSnapContainer>
  );
}
