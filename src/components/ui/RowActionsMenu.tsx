"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

export function RowActionsMenu({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!rootRef.current) return;
      const clickedTrigger = rootRef.current.contains(target);
      const clickedMenu = menuRef.current?.contains(target) ?? false;
      if (!clickedTrigger && !clickedMenu) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedMenuHeight = 180;
    const estimatedMenuWidth = 192;
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUpward(spaceBelow < estimatedMenuHeight);
    setMenuPosition({
      top: spaceBelow < estimatedMenuHeight ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - estimatedMenuWidth),
    });
  }, [open]);

  return (
    <div className="relative z-30" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--card-border)] text-slate-400 hover:bg-slate-900 hover:text-slate-100"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && isClient && menuPosition
        ? createPortal(
            <div
              className="fixed z-[9999] min-w-48 rounded-xl border border-[var(--card-border)] bg-slate-950 p-1 shadow-xl"
              ref={menuRef}
              style={{
                left: `${menuPosition.left}px`,
                top: openUpward ? "auto" : `${menuPosition.top}px`,
                bottom: openUpward
                  ? `${window.innerHeight - menuPosition.top}px`
                  : "auto",
              }}
            >
              {Children.map(children, (child) => {
                if (!isValidElement(child)) return child;
                const el = child as ReactElement<{
                  onClick?: (e: React.MouseEvent) => void;
                }>;
                const prev = el.props.onClick;
                return cloneElement(el, {
                  onClick: (e: React.MouseEvent) => {
                    prev?.(e);
                    setOpen(false);
                  },
                });
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export const rowActionItemClass =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-900 hover:text-white disabled:opacity-50";
