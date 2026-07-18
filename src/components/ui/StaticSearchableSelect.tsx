"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/SearchableSelect";

export type StaticSearchableSelectOption = SearchableSelectOption;

type StaticSearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: StaticSearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function StaticSearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
}: StaticSearchableSelectProps) {
  const [query, setQuery] = useState("");

  const selectedLabel = options.find((option) => option.value === value)?.label;
  const q = query.trim().toLowerCase();
  const filtered = options.filter(
    (option) =>
      q.length === 0 ||
      option.label.toLowerCase().includes(q) ||
      option.value.toLowerCase().includes(q) ||
      (option.description ?? "").toLowerCase().includes(q),
  );

  return (
    <div className={clsx(className)}>
      <SearchableSelect
        disabled={disabled}
        minChars={0}
        onQueryChange={setQuery}
        onSelect={(option) => {
          if (option.disabled) return;
          onChange(option.value);
          setQuery("");
        }}
        options={filtered}
        placeholder={placeholder}
        query={query}
        selectedLabel={selectedLabel}
      />
    </div>
  );
}
