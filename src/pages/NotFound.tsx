import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/motion";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <PageTransition className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-8xl font-black tracking-tight text-[var(--color-text)]/10 mb-4">
          404
        </p>
        <h1 className="text-3xl font-black tracking-tight mb-3">
          Page not found
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate("/")}
            className="w-full text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text)] transition-colors py-2"
          >
            Back to Home
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
