import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[var(--color-sand)] rounded-[22px] mx-auto mb-6" />
          <h1 className="text-4xl font-bold tracking-tight mb-2">Rally</h1>
          <p className="text-[var(--color-muted)] text-lg">
            Sign in to get started
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--color-muted)] mb-2">
                Phone number
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[var(--color-muted)] text-lg">+1</span>
                <input
                  type="tel"
                  value={formatPhone(phone)}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="(555) 123-4567"
                  className="flex-1 text-lg bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-4 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={phone.replace(/\D/g, "").length !== 10 || loading}
              className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-[var(--color-muted)] mb-2">
                Enter the 6-digit code sent to your phone
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full text-center text-2xl tracking-[0.3em] font-mono bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-4 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors"
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
              className="text-[var(--color-muted)] text-sm hover:text-[var(--color-brown)] transition-colors"
            >
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
