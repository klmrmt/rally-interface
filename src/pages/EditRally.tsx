import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api.ts";
import { PinDropMap } from "../components/PinDropMap.tsx";
import { PageTransition, StaggerContainer, StaggerItem } from "../components/motion";
import { motion } from "framer-motion";

const RADIUS_OPTIONS = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
] as const;

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = getDaysInMonth(year, month);
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function EditRally() {
  const navigate = useNavigate();
  const { hexId } = useParams<{ hexId: string }>();
  const [groupName, setGroupName] = useState("");
  const [callToRally, setCallToRally] = useState("");
  const [location, setLocation] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const handlePinChange = useCallback((newPin: { lat: number; lng: number }, locationName: string) => {
    setPin(newPin); setLocation(locationName);
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedHour, setSelectedHour] = useState(() => { const h = now.getHours() % 12; return h === 0 ? 12 : h; });
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(now.getHours() >= 12 ? "PM" : "AM");
  const calendarCells = useMemo(() => getCalendarGrid(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const { data: rallyInfo, isLoading } = useQuery({
    queryKey: ["rally-info", hexId],
    queryFn: () => api.getRallyInfo(hexId!),
    enabled: !!hexId,
  });

  useEffect(() => {
    if (!rallyInfo || hydrated) return;
    setHydrated(true);
    setGroupName(rallyInfo.groupName);
    setCallToRally(rallyInfo.callToAction || "");
    setLocation(rallyInfo.location || "");

    const scheduled = new Date(rallyInfo.scheduledTime);
    setSelectedMonth(scheduled.getMonth());
    setSelectedDay(scheduled.getDate());
    setSelectedYear(scheduled.getFullYear());
    const h = scheduled.getHours() % 12;
    setSelectedHour(h === 0 ? 12 : h);
    const roundedMin = Math.round(scheduled.getMinutes() / 15) * 15;
    setSelectedMinute(String(roundedMin === 60 ? 0 : roundedMin).padStart(2, "0"));
    setSelectedPeriod(scheduled.getHours() >= 12 ? "PM" : "AM");
  }, [rallyInfo, hydrated]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateMonth = (dir: 1 | -1) => {
    let m = selectedMonth + dir; let y = selectedYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    if (y < now.getFullYear() || y > now.getFullYear() + 1) return;
    setSelectedMonth(m); setSelectedYear(y);
    const maxDay = getDaysInMonth(y, m);
    if (selectedDay > maxDay) setSelectedDay(maxDay);
  };

  const isDateInPast = (day: number) => { const d = new Date(selectedYear, selectedMonth, day); d.setHours(0, 0, 0, 0); return d < today; };

  const selectClass = (active?: boolean) =>
    `appearance-none cursor-pointer bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3 py-3 text-center text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-warm)]/30 focus:border-[var(--color-warm)] transition-all ${active ? "border-[var(--color-warm)]" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !hexId) return;
    let hour24 = selectedHour;
    if (selectedPeriod === "AM" && hour24 === 12) hour24 = 0;
    if (selectedPeriod === "PM" && hour24 !== 12) hour24 += 12;
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay, hour24, parseInt(selectedMinute));
    if (selectedDate <= new Date()) { setError("Date and time must be in the future"); return; }
    setSaving(true); setError("");
    try {
      await api.updateRally(hexId, {
        groupName: groupName.trim(),
        callToRally: callToRally.trim() || undefined,
        hangoutDateTime: selectedDate.toISOString(),
        location: location.trim() || null,
        radiusMiles: radiusMiles,
        latitude: pin?.lat ?? null,
        longitude: pin?.lng ?? null,
      });
      navigate(`/${hexId}`);
    } catch (err: any) { setError(err.message || "Failed to update rally"); }
    finally { setSaving(false); }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-text-secondary)]">Loading rally...</div>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <button onClick={() => navigate(`/${hexId}`)} className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text)] transition-colors mb-6 inline-block">&larr; Back</button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Rally</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">Update the details for your hangout.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <StaggerContainer className="flex flex-col gap-5">
            <StaggerItem>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Group Name <span className="text-[var(--color-warm)]">*</span></label>
              <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Friday Night Crew" maxLength={100}
                className="w-full text-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-warm)]/30 focus:border-[var(--color-warm)] transition-all" autoFocus />
            </StaggerItem>

            <StaggerItem>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Call to Rally</label>
              <input type="text" value={callToRally} onChange={(e) => setCallToRally(e.target.value)} placeholder="Bring your own snacks!" maxLength={100}
                className="w-full text-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3.5 text-[var(--color-text)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-warm)]/30 focus:border-[var(--color-warm)] transition-all" />
              <p className="text-[var(--color-text-tertiary)] text-xs mt-1.5">Optional message your group will see</p>
            </StaggerItem>

            <StaggerItem>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">When <span className="text-[var(--color-warm)]">*</span></label>
              <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => navigateMonth(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <span className="font-semibold">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
                  <button type="button" onClick={() => navigateMonth(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LABELS.map((d) => (<div key={d} className="text-center text-xs font-medium text-[var(--color-text-tertiary)] py-1">{d}</div>))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarCells.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} />;
                    const past = isDateInPast(day); const selected = day === selectedDay;
                    return (
                      <button key={day} type="button" disabled={past} onClick={() => setSelectedDay(day)}
                        className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                          selected ? "bg-[var(--color-warm)] text-[var(--color-text)] font-bold"
                            : past ? "text-[var(--color-text-tertiary)]/40 cursor-not-allowed"
                              : "text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium"
                        }`}>{day}</button>
                    );
                  })}
                </div>
                <div className="border-t border-[var(--color-border)] my-3" />
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <select value={selectedHour} onChange={(e) => setSelectedHour(Number(e.target.value))} className={`${selectClass()} w-full text-sm`}>
                      {HOURS.map((h) => (<option key={h} value={h}>{h}</option>))}
                    </select>
                  </div>
                  <span className="text-lg font-bold text-[var(--color-text-tertiary)]">:</span>
                  <div className="relative flex-1">
                    <select value={selectedMinute} onChange={(e) => setSelectedMinute(e.target.value)} className={`${selectClass()} w-full text-sm`}>
                      {MINUTES.map((m) => (<option key={m} value={m}>{m}</option>))}
                    </select>
                  </div>
                  <div className="flex rounded-xl overflow-hidden border border-[var(--color-border)]">
                    <button type="button" onClick={() => setSelectedPeriod("AM")}
                      className={`px-3.5 py-2.5 text-sm font-semibold transition-colors ${selectedPeriod === "AM" ? "bg-[var(--color-warm)] text-[var(--color-text)]" : "bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:bg-[var(--color-surface)]"}`}>AM</button>
                    <button type="button" onClick={() => setSelectedPeriod("PM")}
                      className={`px-3.5 py-2.5 text-sm font-semibold transition-colors ${selectedPeriod === "PM" ? "bg-[var(--color-warm)] text-[var(--color-text)]" : "bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:bg-[var(--color-surface)]"}`}>PM</button>
                  </div>
                </div>
              </div>
            </StaggerItem>

            <StaggerItem>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Where</label>
              <PinDropMap pin={pin} locationName={location} radiusMiles={radiusMiles} onPinChange={handlePinChange} className="mb-3" height={260} />
              <div className="mb-1">
                <span className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Search radius</span>
                <div className="flex gap-2">
                  {RADIUS_OPTIONS.map((opt) => (
                    <motion.button key={opt.value} type="button" whileTap={{ scale: 0.95 }}
                      onClick={() => setRadiusMiles(radiusMiles === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 rounded-xl text-center text-sm font-medium transition-all ${
                        radiusMiles === opt.value ? "bg-[var(--color-warm)] text-[var(--color-text)]" : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                      }`}>{opt.label}</motion.button>
                  ))}
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>

          {error && <p className="text-[var(--color-error)] text-sm text-center">{error}</p>}
          <button type="submit" disabled={!groupName.trim() || saving}
            className="w-full bg-[var(--color-warm)] hover:bg-[var(--color-warm-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[var(--color-text)] font-bold py-3.5 rounded-xl text-base transition-colors mt-2">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
