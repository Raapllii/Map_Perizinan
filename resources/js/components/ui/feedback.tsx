// --- Component ---
"use client";

import { cn } from "@/lib/utils";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";

const EMOJIS = [
  {
    id: "very-sad",
    label: "Terrible",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
        <path d="M9 13v2" stroke="#3b82f6" />
        <path d="M15 13v2" stroke="#3b82f6" />
      </svg>
    ),
  },
  {
    id: "sad",
    label: "Bad",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    id: "neutral",
    label: "Okay",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 13s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    id: "happy",
    label: "Amazing",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 13s1.5 2 4 2 4-2 4-2" />
        <path
          d="M9 9l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5-1.5l-1.5-.5l1.5-.5z"
          fill="#f97316"
          stroke="none"
        />
        <path
          d="M15 9l.5 1.5l1.5 .5l-1.5 .5l-.5 1.5l-.5-1.5l-1.5-.5l1.5-.5z"
          fill="#f97316"
          stroke="none"
        />
      </svg>
    ),
  },
];

interface FeedbackWidgetProps {
  onSubmit?: (data: { rating: string; feedback: string }) => void | Promise<void>;
  onClose?: () => void;
  className?: string;
  /** Text shown in the collapsed state / header */
  label?: string;
  /** Placeholder for the textarea */
  placeholder?: string;
  /** Keeps widget in expanded modal state regardless of rating value */
  alwaysExpanded?: boolean;
  /** Custom label for the submit button */
  submitButtonText?: string;
  /** Custom label for footer text */
  footerText?: string;
}

export function FeedbackWidget({
  onSubmit,
  onClose,
  className,
  label = "Bagaimana pengalaman peta Anda?",
  placeholder = "Tulis pengalaman Anda...",
  alwaysExpanded = false,
  submitButtonText = "Kirim Feedback",
  footerText = "Kami menghargai masukan Anda.",
}: FeedbackWidgetProps) {
  const [value, setValue] = React.useState<string>("");
  const [feedback, setFeedback] = React.useState("");
  const [isPreview, setIsPreview] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isExpanded = alwaysExpanded || value !== "";
  const containerRef = React.useRef<HTMLDivElement>(null);

  const springTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 1,
  } as const;

  const handleValueChange = (val: string) => {
    if (val === "" || val === value) {
      setValue("");
      setIsPreview(false);
      return;
    }

    setValue(val);
    // Auto-focus the textarea after selection
    setTimeout(() => {
      containerRef.current?.querySelector("textarea")?.focus();
    }, 100);
  };

  const handleSend = async () => {
    if (!feedback.trim() || !value || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit?.({ rating: value, feedback });
      setValue("");
      setFeedback("");
      setIsPreview(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex items-center justify-center w-full", className)}>
      <motion.div
        ref={containerRef}
        layout
        transition={springTransition}
        initial={false}
        className={cn(
          "overflow-hidden border border-zinc-200/90 bg-white text-zinc-900 shadow-xl dark:border-white/10 dark:bg-zinc-950 dark:text-white dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]",
          "w-full max-w-[420px] rounded-2xl",
        )}
      >
        <motion.div
          layout="position"
          className="px-5 py-4 sm:px-6 sm:py-5"
          transition={springTransition}
        >
          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center w-full">
              <motion.span
                layout="position"
                transition={springTransition}
                className="text-center font-semibold text-[14px] sm:text-[15px] text-zinc-800 dark:text-zinc-200 cursor-default select-none px-6"
              >
                {label}
              </motion.span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup"
                  className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/10 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <ToggleGroup.Root
              type="single"
              value={value}
              onValueChange={handleValueChange}
              className="mt-3 flex items-center justify-center gap-2.5 sm:gap-3"
            >
              {EMOJIS.map((emoji) => (
                <ToggleGroup.Item key={emoji.id} value={emoji.id} asChild>
                  <button
                    type="button"
                    title={emoji.label}
                    className={cn(
                      "relative rounded-full p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-blue-500",
                      value === emoji.id
                        ? "text-white"
                        : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-300",
                    )}
                  >
                    <motion.div
                      layout="position"
                      transition={springTransition}
                      className="relative z-10 flex h-5 w-5 scale-110 items-center justify-center transition-transform active:scale-90"
                    >
                      {emoji.icon}
                    </motion.div>
                    {value === emoji.id && (
                      <motion.div
                        layoutId="active-bg"
                        className="absolute inset-0 rounded-full bg-blue-600"
                        transition={springTransition}
                      />
                    )}
                  </button>
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {isExpanded && (
              <motion.div
                initial={{
                  height: 0,
                  opacity: 0,
                  scale: 0.98,
                  filter: "blur(4px)",
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                  scale: 0.98,
                  filter: "blur(4px)",
                  transition: {
                    height: { duration: 0.3, ease: [0.32, 0, 0.67, 0] },
                    opacity: { duration: 0.15 },
                    scale: { duration: 0.2 },
                    filter: { duration: 0.2 },
                  },
                }}
                transition={{
                  height: { ...springTransition, bounce: 0 },
                  opacity: { duration: 0.25 },
                  scale: { ...springTransition, damping: 25 },
                  filter: { duration: 0.3 },
                }}
                className="overflow-hidden"
              >
                <div className="pt-3.5 pb-1">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="select-none font-bold text-[10px] text-zinc-400 uppercase tracking-[0.08em] dark:text-zinc-500">
                      {isPreview ? "Preview" : "Feedback"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPreview(!isPreview)}
                      className="rounded px-2 py-0.5 font-medium text-[11px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {isPreview ? "Tulis" : "Preview"}
                    </button>
                  </div>

                  <div className="group/textarea relative">
                    <AnimatePresence mode="wait">
                      {isPreview ? (
                        <motion.div
                          key="preview"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="prose prose-sm scrollbar-none h-[92px] w-full max-w-none overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-[13px] text-zinc-700 leading-relaxed dark:prose-invert dark:border-white/5 dark:bg-zinc-900/50 dark:text-zinc-300"
                        >
                          <ReactMarkdown>
                            {feedback || "*Belum ada teks preview...*"}
                          </ReactMarkdown>
                        </motion.div>
                      ) : (
                        <motion.textarea
                          key="editor"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          placeholder={placeholder}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="scrollbar-none h-[92px] w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 text-[13px] sm:text-[14px] text-zinc-800 leading-relaxed transition-all placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white focus:outline-none dark:border-white/5 dark:bg-zinc-900/50 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-white/20"
                        />
                      )}
                    </AnimatePresence>

                    {!isPreview && (
                      <div className="pointer-events-none absolute right-3 bottom-2.5 flex select-none items-center gap-1.5 opacity-40 transition-opacity group-focus-within/textarea:opacity-80">
                        <span className="font-bold text-[10px] text-zinc-400 tracking-tight dark:text-zinc-500">
                          M↓
                        </span>
                        <span className="font-bold text-[10px] text-zinc-400 tracking-tight dark:text-zinc-500">
                          supported
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 15, opacity: 0 }}
                  transition={{ delay: 0.05, ...springTransition }}
                  className="mt-2.5 flex items-center justify-between border-t border-zinc-200/80 pt-3 dark:border-white/10"
                >
                  <p className="font-medium text-[11px] text-zinc-500 select-none dark:text-zinc-400">
                    {footerText}
                  </p>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!feedback.trim() || !value || isSubmitting}
                    className="relative rounded-lg bg-zinc-900 px-4 py-1.5 font-semibold text-[12px] sm:text-[13px] text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Number.POSITIVE_INFINITY,
                            duration: 1,
                            ease: "linear",
                          }}
                          className="h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black"
                        />
                        <span>Mengirim...</span>
                      </div>
                    ) : (
                      submitButtonText
                    )}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default FeedbackWidget;
