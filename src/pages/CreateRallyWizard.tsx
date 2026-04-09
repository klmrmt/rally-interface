import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useReward } from "react-rewards";
import { api } from "../api.ts";
import { ShareSheet } from "../components/ShareSheet.tsx";
import { PinDropMap } from "../components/PinDropMap.tsx";
import { PageTransition, StaggerContainer, StaggerItem } from "../components/motion";

const TOTAL_STEPS = 4;

const RADIUS_OPTIONS = [
  { value: 1, label: "1 mi" },
  { value: 3, label: "3 mi" },
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
] as const;

const VOTING_DURATION_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hr" },
  { value: 120, label: "2 hrs" },
  { value: 360, label: "6 hrs" },
  { value: 720, label: "12 hrs" },
  { value: 1440, label: "24 hrs" },
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

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <p className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40 mb-2">
      Step {current + 1} of {total}
    </p>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text)] transition-colors mb-6 inline-flex items-center gap-1"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>
  );
}

function NextButton({
  onClick,
  disabled,
  label = "Next",
  loading = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full bg-[var(--color-text)] hover:bg-[var(--color-text)]/80 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-colors relative"
    >
      <span id="createReward" className="absolute left-1/2 top-1/2" />
      {loading ? "Creating..." : label}
    </button>
  );
}

function SkipButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text)] transition-colors py-3"
    >
      Skip for now
    </button>
  );
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export function CreateRallyWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [groupName, setGroupName] = useState("");
  const [callToRally, setCallToRally] = useState("");
  const [location, setLocation] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [createdHexId, setCreatedHexId] = useState<string | null>(null);
  const [votingDurationMinutes, setVotingDurationMinutes] = useState(10);
  const [votingClosesAt, setVotingClosesAt] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [hydrating, setHydrating] = useState(!!searchParams.get("draft"));
  const savingRef = useRef(false);

  const { reward: rewardEmoji } = useReward("createReward", "emoji", {
    emoji: ["🎉", "✨", "🎊"],
    elementCount: 12,
    spread: 50,
    lifetime: 200,
  });

  const handlePinChange = useCallback(
    (newPin: { lat: number; lng: number }, locationName: string) => {
      setPin(newPin);
      setLocation(locationName);
    },
    []
  );

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

  useEffect(() => {
    const paramDraftId = searchParams.get("draft");
    if (!paramDraftId) return;

    api.getDrafts().then((res) => {
      const draft = res.drafts.find((d) => d.id === paramDraftId);
      if (!draft) { setHydrating(false); return; }

      setDraftId(draft.id);
      setStep(draft.step);

      const d = draft.data;
      if (typeof d.groupName === "string") setGroupName(d.groupName);
      if (typeof d.callToRally === "string") setCallToRally(d.callToRally);
      if (typeof d.location === "string") setLocation(d.location);
      if (d.pin && typeof (d.pin as any).lat === "number" && typeof (d.pin as any).lng === "number") {
        setPin(d.pin as { lat: number; lng: number });
      }
      if (typeof d.radiusMiles === "number") setRadiusMiles(d.radiusMiles);
      if (typeof d.selectedMonth === "number") setSelectedMonth(d.selectedMonth);
      if (typeof d.selectedDay === "number") setSelectedDay(d.selectedDay);
      if (typeof d.selectedYear === "number") setSelectedYear(d.selectedYear);
      if (typeof d.selectedHour === "number") setSelectedHour(d.selectedHour);
      if (typeof d.selectedMinute === "string") setSelectedMinute(d.selectedMinute);
      if (d.selectedPeriod === "AM" || d.selectedPeriod === "PM") setSelectedPeriod(d.selectedPeriod);
      if (typeof d.votingDurationMinutes === "number") setVotingDurationMinutes(d.votingDurationMinutes);

      setHydrating(false);
    }).catch(() => { setHydrating(false); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const gatherDraftData = useCallback(() => ({
    groupName, callToRally, location, pin, radiusMiles,
    selectedMonth, selectedDay, selectedYear,
    selectedHour, selectedMinute, selectedPeriod,
    votingDurationMinutes,
  }), [groupName, callToRally, location, pin, radiusMiles, selectedMonth, selectedDay, selectedYear, selectedHour, selectedMinute, selectedPeriod, votingDurationMinutes]);

  const saveDraft = useCallback((nextStep: number) => {
    if (savingRef.current) return;
    savingRef.current = true;
    const data = gatherDraftData();

    const save = draftId
      ? api.updateDraft(draftId, nextStep, data)
      : api.createDraft(nextStep, data);

    save
      .then((result) => { if (!draftId && result?.id) setDraftId(result.id); })
      .catch((err) => console.error("Draft save failed:", err))
      .finally(() => { savingRef.current = false; });
  }, [draftId, gatherDraftData]);

  const calendarCells = useMemo(
    () => getCalendarGrid(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const navigateMonth = (dir: 1 | -1) => {
    let m = selectedMonth + dir;
    let y = selectedYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    if (y < now.getFullYear() || y > now.getFullYear() + 1) return;
    setSelectedMonth(m);
    setSelectedYear(y);
    const maxDay = getDaysInMonth(y, m);
    if (selectedDay > maxDay) setSelectedDay(maxDay);
  };

  const isDateInPast = (day: number) => {
    const d = new Date(selectedYear, selectedMonth, day);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const selectClass = (active?: boolean) =>
    `appearance-none cursor-pointer bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl px-3 py-3 text-center text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-warm)]/30 focus:border-[var(--color-warm)] transition-all ${active ? "border-[var(--color-warm)]" : ""}`;

  const buildDateTime = () => {
    let hour24 = selectedHour;
    if (selectedPeriod === "AM" && hour24 === 12) hour24 = 0;
    if (selectedPeriod === "PM" && hour24 !== 12) hour24 += 12;
    return new Date(
      selectedYear, selectedMonth, selectedDay,
      hour24, parseInt(selectedMinute)
    );
  };

  const handleBack = () => {
    if (step === 0) {
      saveDraft(0);
      navigate("/dashboard");
    } else {
      const nextStep = step - 1;
      saveDraft(nextStep);
      setDirection(-1);
      setStep(nextStep);
      setError("");
    }
  };

  const handleNext = () => {
    setError("");
    if (step === 1) {
      const selectedDate = buildDateTime();
      if (selectedDate <= new Date()) {
        setError("Date and time must be in the future");
        return;
      }
    }
    const nextStep = step + 1;
    saveDraft(nextStep);
    setDirection(1);
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    setError("");
    const selectedDate = buildDateTime();

    if (selectedDate <= new Date()) {
      setError("Date and time must be in the future");
      return;
    }

    rewardEmoji();
    setCreating(true);

    try {
      const result = await api.createRally({
        groupName: groupName.trim(),
        callToRally: callToRally.trim() || undefined,
        hangoutDateTime: selectedDate.toISOString(),
        location: location.trim() || undefined,
        radiusMiles: radiusMiles ?? undefined,
        latitude: pin?.lat,
        longitude: pin?.lng,
        votingDurationMinutes,
        draftId: draftId ?? undefined,
      });
      setCreatedHexId(result.hexId);
      setVotingClosesAt(result.votingClosesAt);
    } catch (err: any) {
      const msg = err.message || "Failed to create rally";
      if (msg === "Validation failed") {
        setError("Something looks off. Please check your details and try again.");
      } else {
        setError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  if (hydrating) {
    return (
      <PageTransition className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--color-text-tertiary)] animate-pulse text-sm">Loading draft...</p>
      </PageTransition>
    );
  }

  if (createdHexId) {
    return (
      <ShareSheet
        hexId={createdHexId}
        groupName={groupName}
        votingClosesAt={votingClosesAt}
        onContinue={() => navigate(`/${createdHexId}`)}
      />
    );
  }

  return (
    <PageTransition className="min-h-screen flex flex-col px-6">
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col pt-12">
        <BackButton onClick={handleBack} />
        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col flex-1"
            >
              {step === 0 && (
                <StepGroupName
                  groupName={groupName}
                  setGroupName={setGroupName}
                  onNext={handleNext}
                />
              )}
              {step === 1 && (
                <StepWhen
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  selectedDay={selectedDay}
                  selectedHour={selectedHour}
                  selectedMinute={selectedMinute}
                  selectedPeriod={selectedPeriod}
                  calendarCells={calendarCells}
                  isDateInPast={isDateInPast}
                  navigateMonth={navigateMonth}
                  setSelectedDay={setSelectedDay}
                  setSelectedHour={setSelectedHour}
                  setSelectedMinute={setSelectedMinute}
                  setSelectedPeriod={setSelectedPeriod}
                  selectClass={selectClass}
                  onNext={handleNext}
                  error={error}
                  votingDurationMinutes={votingDurationMinutes}
                  setVotingDurationMinutes={setVotingDurationMinutes}
                />
              )}
              {step === 2 && (
                <StepCallToRally
                  callToRally={callToRally}
                  setCallToRally={setCallToRally}
                  onNext={handleNext}
                  onSkip={() => { const nextStep = step + 1; saveDraft(nextStep); setDirection(1); setStep(nextStep); setError(""); }}
                />
              )}
              {step === 3 && (
                <StepWhere
                  location={location}
                  pin={pin}
                  onPinChange={handlePinChange}
                  radiusMiles={radiusMiles}
                  setRadiusMiles={setRadiusMiles}
                  onSubmit={handleSubmit}
                  onSkip={handleSubmit}
                  creating={creating}
                  error={error}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}

function StepGroupName({
  groupName,
  setGroupName,
  onNext,
}: {
  groupName: string;
  setGroupName: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-5xl font-black tracking-tight mb-2">Name your Rally<span className="text-red-500 text-3xl align-top ml-1">*</span></h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        What should we call this hangout?
      </p>

      <input
        type="text"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && groupName.trim()) onNext(); }}
        placeholder="Friday Night Crew"
        maxLength={100}
        className="w-full text-xl font-bold bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-4 text-[var(--color-text)] placeholder-[var(--color-text)]/20 focus:outline-none focus:border-[var(--color-text)] transition-all mb-6"
        autoFocus
      />

      <div className="sticky bottom-0 pt-4">
        <NextButton onClick={onNext} disabled={!groupName.trim()} />
      </div>
    </div>
  );
}

function StepWhen({
  selectedMonth, selectedYear, selectedDay, selectedHour, selectedMinute, selectedPeriod,
  calendarCells, isDateInPast, navigateMonth, setSelectedDay, setSelectedHour,
  setSelectedMinute, setSelectedPeriod, selectClass, onNext, error,
  votingDurationMinutes, setVotingDurationMinutes,
}: {
  selectedMonth: number; selectedYear: number; selectedDay: number;
  selectedHour: number; selectedMinute: string; selectedPeriod: "AM" | "PM";
  calendarCells: (number | null)[]; isDateInPast: (day: number) => boolean;
  navigateMonth: (dir: 1 | -1) => void; setSelectedDay: (d: number) => void;
  setSelectedHour: (h: number) => void; setSelectedMinute: (m: string) => void;
  setSelectedPeriod: (p: "AM" | "PM") => void; selectClass: (active?: boolean) => string;
  onNext: () => void; error: string;
  votingDurationMinutes: number; setVotingDurationMinutes: (v: number) => void;
}) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-5xl font-black tracking-tight mb-2">When</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">When is the hangout?</p>

      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => navigateMonth(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-semibold">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
          <button type="button" onClick={() => navigateMonth(1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {DAY_LABELS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-[var(--color-text-tertiary)] py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarCells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const past = isDateInPast(day);
            const selected = day === selectedDay;
            return (
              <button key={day} type="button" disabled={past} onClick={() => setSelectedDay(day)}
                className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-all ${
                  selected ? "bg-[var(--color-warm)] text-[var(--color-text)] font-bold"
                    : past ? "text-[var(--color-text-tertiary)]/40 cursor-not-allowed"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface)] font-medium"
                }`}>
                {day}
              </button>
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
              className={`px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                selectedPeriod === "AM" ? "bg-[var(--color-warm)] text-[var(--color-text)]" : "bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              }`}>AM</button>
            <button type="button" onClick={() => setSelectedPeriod("PM")}
              className={`px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                selectedPeriod === "PM" ? "bg-[var(--color-warm)] text-[var(--color-text)]" : "bg-[var(--color-bg-elevated)] text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              }`}>PM</button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <span className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">How long should voting stay open?</span>
        <StaggerContainer className="flex flex-wrap gap-2">
          {VOTING_DURATION_OPTIONS.map((opt) => (
            <StaggerItem key={opt.value}>
              <motion.button type="button"
                onClick={() => setVotingDurationMinutes(opt.value)}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-2 rounded-xl text-center text-sm font-medium transition-all ${
                  votingDurationMinutes === opt.value
                    ? "bg-[var(--color-warm)] text-[var(--color-text)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                }`}>
                {opt.label}
              </motion.button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {error && <p className="text-[var(--color-error)] text-sm text-center mb-3">{error}</p>}
      <div className="sticky bottom-0 pt-4"><NextButton onClick={onNext} /></div>
    </div>
  );
}

function StepCallToRally({
  callToRally, setCallToRally, onNext, onSkip,
}: {
  callToRally: string; setCallToRally: (v: string) => void;
  onNext: () => void; onSkip: () => void;
}) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-5xl font-black tracking-tight mb-2">Message</h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Anything your group should know?</p>

      <input
        type="text"
        value={callToRally}
        onChange={(e) => setCallToRally(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") onNext(); }}
        placeholder="Bring your own snacks!"
        maxLength={100}
        className="w-full text-xl font-bold bg-transparent border-b-2 border-[var(--color-text)]/15 px-0 py-4 text-[var(--color-text)] placeholder-[var(--color-text)]/20 focus:outline-none focus:border-[var(--color-text)] transition-all mb-6"
        autoFocus
      />

      <div className="sticky bottom-0 pt-4">
        <NextButton onClick={onNext} />
        <SkipButton onClick={onSkip} />
      </div>
    </div>
  );
}

function StepWhere({
  location, pin, onPinChange, radiusMiles, setRadiusMiles,
  onSubmit, onSkip, creating, error,
}: {
  location: string; pin: { lat: number; lng: number } | null;
  onPinChange: (pin: { lat: number; lng: number }, locationName: string) => void;
  radiusMiles: number | null; setRadiusMiles: (v: number | null) => void;
  onSubmit: () => void; onSkip: () => void; creating: boolean; error: string;
}) {
  return (
    <div className="flex flex-col flex-1">
      <h1 className="text-5xl font-black tracking-tight mb-2">Where</h1>
      <p className="text-[var(--color-text-secondary)] mb-6">Where are you hanging out?</p>

      <PinDropMap pin={pin} locationName={location} radiusMiles={radiusMiles} onPinChange={onPinChange} className="mb-4" />

      <div className="mb-4">
        <span className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">Search radius</span>
        <StaggerContainer className="flex gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <StaggerItem key={opt.value} className="flex-1">
              <motion.button type="button"
                onClick={() => setRadiusMiles(radiusMiles === opt.value ? null : opt.value)}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-2 rounded-xl text-center text-sm font-medium transition-all ${
                  radiusMiles === opt.value
                    ? "bg-[var(--color-warm)] text-[var(--color-text)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                }`}>
                {opt.label}
              </motion.button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {error && <p className="text-[var(--color-error)] text-sm text-center mb-3">{error}</p>}
      <div className="sticky bottom-0 pt-4">
        <NextButton onClick={onSubmit} label="Create Rally" loading={creating} />
        <SkipButton onClick={onSkip} />
      </div>
    </div>
  );
}
