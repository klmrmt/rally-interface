import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import { PageTransition } from "../components/motion";

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const rawPhone = () => `+1${phone.replace(/\D/g, "")}`;

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.sendOTP(rawPhone());
      setStep("code");
    } catch (err: any) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await api.verifyOTP(rawPhone(), code);
      login(result.token, result.user);
      const redirect = searchParams.get("redirect");
      navigate(redirect || "/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-warm)]">
      <div className="w-full max-w-sm">
        <div className="mb-14">
          <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-3">
            Sign in
          </p>
          <h1 className="text-8xl font-black tracking-tight leading-[0.85]">Rally</h1>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] font-medium text-[var(--color-text)]/40 mb-3">
                Phone number
              </label>
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-text)]/30 text-xl font-black">+1</span>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="(555) 123-4567"
                  className="flex-1 text-xl font-bold bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-3 text-[var(--color-text)] placeholder-[var(--color-text)]/20 focus:outline-none focus:border-[var(--color-text)] transition-all"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={phone.replace(/\D/g, "").length !== 10 || loading}
              className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.15em] font-medium text-[var(--color-text)]/40 mb-3">
                Enter the 6-digit code
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-4xl tracking-[0.3em] font-black bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-4 text-[var(--color-text)] placeholder-[var(--color-text)]/15 focus:outline-none focus:border-[var(--color-text)] transition-all"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              className="text-[var(--color-text)]/40 text-sm hover:text-[var(--color-text)] transition-colors"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </PageTransition>
  );
}
