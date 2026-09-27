"use client";

import { cn } from "@/lib/utils";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import ReactMarkdown from "react-markdown";

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
  onSubmit?: (data: { rating: string; feedback: string }) => void;
  className?: string;
  /** Text shown in the header */
  label?: string;
  /** Placeholder for the textarea */
  placeholder?: string;
  alwaysExpanded?: boolean;
  submitButtonText?: string;
  footerText?: string;
}

export function FeedbackWidget({
  onSubmit,
  className,
  label = "Was this helpful?",
  placeholder = "Your feedback...",
  alwaysExpanded = false,
  submitButtonText = "Send Feedback",
  footerText = "We appreciate your input.",
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
    } else {
      setValue(val);
      // Auto-focus the textarea after expansion
      setTimeout(() => {
        containerRef.current?.querySelector("textarea")?.focus();
      }, 100);
    }
  };

  const handleSend = async () => {
    if (!feedback.trim()) return;

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
    <div className={cn("w-full max-w-[380px]", className)}>
      <motion.div
        ref={containerRef}
        layout
        transition={springTransition}
        initial={false}
        className="w-full overflow-hidden rounded-[24px] border border-zinc-200 bg-white text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-zinc-950 dark:text-white"
      >
        <motion.div
          layout="position"
          className="p-4 md:p-5"
          transition={springTransition}
        >
          {/* Header Row: Title & Close Button X */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="select-none font-bold text-[13px] md:text-[14px] text-zinc-700 dark:text-zinc-200 truncate flex-1 min-w-0">
              {label}
            </span>
          </div>

          {/* Rating Emojis Row */}
          <div className="flex items-center justify-center py-1">
            <ToggleGroup.Root
              type="single"
              value={value}
              onValueChange={handleValueChange}
              className="flex items-center justify-between w-full max-w-[260px]"
            >
              {EMOJIS.map((emoji) => (
                <ToggleGroup.Item key={emoji.id} value={emoji.id} asChild>
                  <button
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
                      className="relative z-10 flex h-6 w-6 scale-110 items-center justify-center transition-transform active:scale-90"
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
                <div className="px-0.5 pt-4 pb-1">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="select-none font-bold text-[10px] text-zinc-500 uppercase tracking-[0.1em] dark:text-zinc-500">
                      {isPreview ? "Preview" : "Masukan Anda"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPreview(!isPreview)}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-[11px] text-zinc-600 transition-colors hover:bg-zinc-200 hover:text-zinc-900 dark:bg-white/5 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {isPreview ? "Edit" : "Preview"}
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
                          className="prose prose-sm scrollbar-none h-[110px] w-full max-w-none overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-[13px] text-zinc-700 leading-relaxed dark:prose-invert dark:border-white/5 dark:bg-zinc-900/50 dark:text-zinc-300"
                        >
                          <ReactMarkdown>
                            {feedback || "*Belum ada teks masukan...*"}
                          </ReactMarkdown>
                        </motion.div>
                      ) : (
                        <motion.textarea
                          key="editor"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          autoFocus
                          placeholder={placeholder}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="scrollbar-none h-[110px] w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-[13px] text-zinc-800 leading-relaxed transition-all placeholder:text-zinc-400 focus:border-zinc-300 focus:outline-none dark:border-white/5 dark:bg-zinc-900/50 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-white/20"
                        />
                      )}
                    </AnimatePresence>

                    {!isPreview && (
                      <div className="pointer-events-none absolute right-3 bottom-2.5 flex select-none items-center gap-1 opacity-40 transition-opacity group-focus-within/textarea:opacity-80">
                        <span className="font-bold text-[9px] text-zinc-400 tracking-tight dark:text-zinc-500">
                          Markdown
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  transition={{ delay: 0.1, ...springTransition }}
                  className="mt-2 flex items-center justify-between border-zinc-200 border-t pt-3 dark:border-white/5"
                >
                  <p className="font-medium text-[10px] md:text-[11px] text-zinc-500 dark:text-zinc-500 truncate mr-2">
                    {footerText}
                  </p>
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!feedback.trim() || isSubmitting}
                    className="relative shrink-0 rounded-xl bg-zinc-900 px-5 py-2 font-bold text-[12px] md:text-[13px] text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:pointer-events-none disabled:opacity-30 disabled:grayscale dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white dark:border-black/20 dark:border-t-black"
                      />
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

