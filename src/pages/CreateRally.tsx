import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.ts";

const RADIUS_OPTIONS = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
] as const;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function CreateRally() {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [callToRally, setCallToRally] = useState("");
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedHour, setSelectedHour] = useState(() => {
    const h = now.getHours() % 12;
    return h === 0 ? 12 : h;
  });
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(
    now.getHours() >= 12 ? "PM" : "AM"
  );

  const availableYears = [now.getFullYear(), now.getFullYear() + 1];

  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const buildDateTime = () => {
    let hour24 = selectedHour;
    if (selectedPeriod === "AM" && hour24 === 12) hour24 = 0;
    if (selectedPeriod === "PM" && hour24 !== 12) hour24 += 12;
    return new Date(
      selectedYear,
      selectedMonth,
      selectedDay,
      hour24,
      parseInt(selectedMinute)
    );
  };

  const selectClass = (active?: boolean) =>
    `appearance-none cursor-pointer bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-3 py-3 text-center text-[var(--color-brown)] font-medium focus:outline-none focus:border-[var(--color-sand)] transition-colors ${active ? "border-[var(--color-sand)]" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    const selectedDate = buildDateTime();
    if (selectedDate <= new Date()) {
      setError("Date and time must be in the future");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const result = await api.createRally({
        groupName: groupName.trim(),
        callToRally: callToRally.trim() || undefined,
        hangoutDateTime: selectedDate.toISOString(),
        location: location.trim() || undefined,
        radiusMiles: radiusMiles ?? undefined,
      });
      navigate(`/${result.hexId}`);
    } catch (err: any) {
      setError(err.message || "Failed to create rally");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-[var(--color-muted)] text-sm hover:text-[var(--color-brown)] transition-colors mb-6 inline-block"
          >
            &larr; Back
          </button>
          <h1 className="text-3xl font-bold">Create a Rally</h1>
          <p className="text-[var(--color-muted)] mt-2">
            Set up a hangout and invite your friends to vote.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Group Name <span className="text-[var(--color-sand)]">*</span>
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Friday Night Crew"
              maxLength={100}
              className="w-full text-lg bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-3.5 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Call to Rally
            </label>
            <input
              type="text"
              value={callToRally}
              onChange={(e) => setCallToRally(e.target.value)}
              placeholder="Bring your own snacks!"
              maxLength={100}
              className="w-full text-lg bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-3.5 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
            />
            <p className="text-[var(--color-muted)]/50 text-xs mt-1.5">
              Optional message your group will see
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Date <span className="text-[var(--color-sand)]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(Number(e.target.value));
                    const maxDay = getDaysInMonth(selectedYear, Number(e.target.value));
                    if (selectedDay > maxDay) setSelectedDay(maxDay);
                  }}
                  className={`${selectClass()} w-full`}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(Number(e.target.value))}
                  className={`${selectClass()} w-full`}
                >
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className={`${selectClass()} w-full`}
                >
                  {availableYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Time <span className="text-[var(--color-sand)]">*</span>
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                  className={`${selectClass()} w-full`}
                >
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <span className="text-xl font-bold text-[var(--color-muted)]">:</span>
              <div className="relative flex-1">
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className={`${selectClass()} w-full`}
                >
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex rounded-full overflow-hidden border border-[var(--color-cream-dark)]">
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("AM")}
                  className={`px-4 py-3 text-sm font-semibold transition-colors ${
                    selectedPeriod === "AM"
                      ? "bg-[var(--color-sand)] text-white"
                      : "bg-[var(--color-card)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPeriod("PM")}
                  className={`px-4 py-3 text-sm font-semibold transition-colors ${
                    selectedPeriod === "PM"
                      ? "bg-[var(--color-sand)] text-white"
                      : "bg-[var(--color-card)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Chicago, IL"
              maxLength={200}
              className="w-full text-lg bg-[var(--color-card)] border border-[var(--color-cream-dark)] rounded-2xl px-4 py-3.5 text-[var(--color-brown)] placeholder-[var(--color-muted)]/50 focus:outline-none focus:border-[var(--color-sand)] transition-colors"
            />
            <p className="text-[var(--color-muted)]/50 text-xs mt-1.5">
              General area for activity recommendations
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-2">
              Search Radius
            </label>
            <div className="flex gap-2">
              {RADIUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setRadiusMiles(radiusMiles === opt.value ? null : opt.value)
                  }
                  className={`flex-1 py-2.5 rounded-full text-center text-sm font-medium transition-all ${
                    radiusMiles === opt.value
                      ? "bg-[var(--color-sand)] text-white"
                      : "bg-[var(--color-chip)] text-[var(--color-brown)] hover:bg-[var(--color-card-hover)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[var(--color-muted)]/50 text-xs mt-1.5">
              Max distance from center &middot; tap again to deselect
            </p>
          </div>

          {error && (
            <p className="text-[var(--color-error)] text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!groupName.trim() || creating}
            className="w-full bg-[var(--color-sand)] hover:bg-[var(--color-sand-dark)] disabled:bg-[var(--color-chip)] disabled:text-[var(--color-muted)] disabled:cursor-not-allowed text-white font-semibold py-4 rounded-full text-lg transition-colors mt-2"
          >
            {creating ? "Creating..." : "Create Rally"}
          </button>
        </form>
      </div>
    </div>
  );
}
