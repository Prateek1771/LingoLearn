"use client";

const LETTER_LABELS = ["A", "B", "C", "D"] as const;

interface QuizOptionProps {
  text: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean | null;
  isRevealed: boolean;
  onSelect: (index: number) => void;
}

export default function QuizOption({
  text,
  index,
  isSelected,
  isCorrect,
  isRevealed,
  onSelect,
}: QuizOptionProps) {
  const letter = LETTER_LABELS[index] ?? String(index + 1);

  // Determine visual state
  const isDisabled = isRevealed;

  // Derive border / background / text colours based on state machine:
  // 1. Revealed + correct answer  → green
  // 2. Revealed + selected + wrong → red
  // 3. Not revealed + selected     → primary border highlight
  // 4. Default                     → surface-light
  let containerClasses =
    "group relative flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ";

  let letterClasses =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 ";

  if (isRevealed && isCorrect) {
    // Correct answer revealed
    containerClasses +=
      "border-success bg-success/10 shadow-[0_0_12px_rgba(0,184,148,0.15)] cursor-default";
    letterClasses += "bg-success text-white";
  } else if (isRevealed && isSelected && isCorrect === false) {
    // Selected but wrong
    containerClasses +=
      "border-error bg-error/10 shadow-[0_0_12px_rgba(225,112,85,0.15)] cursor-default";
    letterClasses += "bg-error text-white";
  } else if (isRevealed) {
    // Unselected, not the correct answer, dimmed
    containerClasses += "border-border bg-surface opacity-50 cursor-default";
    letterClasses += "bg-surface-light text-muted";
  } else if (isSelected) {
    // Actively selected, not yet revealed
    containerClasses +=
      "border-primary bg-primary/10 shadow-[0_0_12px_rgba(108,92,231,0.2)] cursor-pointer";
    letterClasses += "bg-primary text-white";
  } else {
    // Default idle state
    containerClasses +=
      "border-border bg-surface-light hover:border-primary/50 hover:bg-primary/5 hover:shadow-[0_0_8px_rgba(108,92,231,0.1)] cursor-pointer";
    letterClasses += "bg-surface text-muted group-hover:text-primary-light group-hover:bg-primary/20";
  }

  // Text colour
  let textClasses = "flex-1 text-sm leading-relaxed font-medium transition-colors duration-200 ";
  if (isRevealed && isCorrect) {
    textClasses += "text-success";
  } else if (isRevealed && isSelected && isCorrect === false) {
    textClasses += "text-error";
  } else if (isRevealed) {
    textClasses += "text-muted";
  } else if (isSelected) {
    textClasses += "text-foreground";
  } else {
    textClasses += "text-foreground/80 group-hover:text-foreground";
  }

  // Right-side icon shown after reveal
  let revealIcon: React.ReactNode = null;
  if (isRevealed && isCorrect) {
    revealIcon = (
      <span className="shrink-0 text-success" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  } else if (isRevealed && isSelected && isCorrect === false) {
    revealIcon = (
      <span className="shrink-0 text-error" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }

  return (
    <button
      type="button"
      className={containerClasses}
      onClick={() => !isDisabled && onSelect(index)}
      disabled={isDisabled}
      aria-pressed={isSelected}
      aria-label={`Option ${letter}: ${text}`}
    >
      <span className={letterClasses}>{letter}</span>
      <span className={textClasses}>{text}</span>
      {revealIcon}
    </button>
  );
}
