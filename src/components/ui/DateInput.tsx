"use client";

import { useRef } from "react";
import { Calendar } from "lucide-react";
import clsx from "clsx";

export function DateInput({
  value,
  onChange,
  className,
  disabled,
  id,
  name,
  min,
  max,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el || disabled) return;
    try {
      el.showPicker();
    } catch {
      el.focus();
      el.click();
    }
  }

  return (
    <div className={clsx("relative", className)}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="date"
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="date-input w-full rounded-xl border border-[var(--card-border)] bg-slate-950 py-2.5 pl-4 pr-11 text-sm text-slate-100 outline-none ring-teal-500/30 focus:ring-2 disabled:opacity-50"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Open calendar"
        disabled={disabled}
        onClick={openPicker}
        className="absolute inset-y-0 right-0 z-10 flex w-11 items-center justify-center text-teal-300/90 hover:text-teal-200 disabled:opacity-50"
      >
        <Calendar className="h-4 w-4" strokeWidth={2.25} />
      </button>
    </div>
  );
}
