import { motion } from "framer-motion";

interface TicketCodeProps {
  code: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function TicketCode({ code, className = "", size = "md" }: TicketCodeProps) {
  const chars = code.split("");
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-6xl",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className={`${sizeClasses[size]} font-black tracking-tight text-[var(--color-text)]`}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}
