import { motion, type Variants, useMotionValueEvent, useScroll } from "framer-motion";
import { type ReactNode, forwardRef, useRef, useState } from "react";

const pageVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({
  children,
  className = "",
  scale = false,
}: {
  children: ReactNode;
  className?: string;
  scale?: boolean;
}) {
  return (
    <motion.div
      variants={{
        ...pageVariants,
        hidden: {
          ...pageVariants.hidden,
          ...(scale ? { scale: 0.98 } : {}),
        },
        enter: {
          ...pageVariants.enter,
          ...(scale ? { scale: 1 } : {}),
        },
      }}
      initial="hidden"
      animate="enter"
      exit="exit"
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

export const ScrollSnapContainer = forwardRef<
  HTMLDivElement,
  { children: ReactNode; className?: string }
>(function ScrollSnapContainer({ children, className = "" }, ref) {
  return (
    <div ref={ref} className={`snap-container ${className}`}>
      {children}
    </div>
  );
});

export function ScrollHint({
  label = "Scroll",
  className = "",
  onClick,
}: {
  label?: string;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(true);

  if (typeof window !== "undefined" && !containerRef.current) {
    containerRef.current = ref.current?.closest(".snap-container") as HTMLElement | null;
  }

  const { scrollY } = useScroll({ container: containerRef });
  useMotionValueEvent(scrollY, "change", (v) => {
    setVisible(v < 50);
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const section = ref.current?.closest(".snap-section");
    const next = section?.nextElementSibling;
    if (next) {
      next.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={handleClick}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center gap-1 pb-8 pt-4 cursor-pointer ${className}`}
    >
      <span className="text-xs uppercase tracking-[0.2em] font-medium text-[var(--color-text)]/40">
        {label}
      </span>
      <motion.svg
        width="16" height="16" viewBox="0 0 16 16" fill="none"
        className="text-[var(--color-text)]/40"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    </motion.button>
  );
}
