"use client";

import { ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";

export type SearchableSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type SearchableSelectProps = {
  selectedLabel?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (option: SearchableSelectOption) => void;
  options: SearchableSelectOption[];
  loading?: boolean;
  minChars?: number;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchableSelect({
  selectedLabel,
  query,
  onQueryChange,
  onSelect,
  options,
  loading = false,
  minChars = 3,
  placeholder = "Select option",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;

    function position() {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const estimatedHeight = 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

      setMenuStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 180),
        top: openUp ? undefined : rect.bottom + 4,
        bottom: openUp ? window.innerHeight - rect.top + 4 : undefined,
        zIndex: 10000,
      });
    }

    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [open]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent): void {
      const target = event.target as Node;
      const inTrigger = rootRef.current?.contains(target) ?? false;
      const inMenu = menuRef.current?.contains(target) ?? false;
      if (!inTrigger && !inMenu) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const canSearch = query.trim().length >= minChars;

  const menu = open ? (
    <div
      className="rounded-xl border border-[var(--card-border)] bg-slate-950 p-2 shadow-xl"
      ref={menuRef}
      style={menuStyle}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
        <input
          className="h-9 w-full rounded-lg border border-[var(--card-border)] bg-slate-900 pl-8 pr-2 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-teal-500/30"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={
            minChars > 0 ? `Type at least ${minChars} characters...` : "Search..."
          }
          ref={searchRef}
          value={query}
        />
      </div>

      <div className="mt-2 max-h-44 overflow-auto rounded-lg border border-[var(--card-border)]">
        {loading ? (
          <p className="px-3 py-2 text-xs text-slate-500">Searching...</p>
        ) : !canSearch ? (
          <p className="px-3 py-2 text-xs text-slate-500">
            Type at least {minChars} characters to search.
          </p>
        ) : options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-500">No results found.</p>
        ) : (
          options.map((option) => (
            <button
              className={clsx(
                "block w-full px-3 py-2 text-left text-sm",
                option.disabled
                  ? "cursor-not-allowed text-slate-600"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white",
              )}
              disabled={option.disabled}
              key={option.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (option.disabled) return;
                setOpen(false);
                onSelect(option);
              }}
              type="button"
            >
              <span>{option.label}</span>
              {option.description ? (
                <span className="ml-2 text-xs text-slate-500">{option.description}</span>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="flex h-[2.625rem] w-full items-center justify-between rounded-xl border border-[var(--card-border)] bg-slate-950 px-3 text-sm text-slate-100 outline-none transition hover:bg-slate-900 focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        ref={triggerRef}
        type="button"
      >
        <span className={clsx("truncate", selectedLabel ? "text-slate-100" : "text-slate-500")}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {isClient && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}
