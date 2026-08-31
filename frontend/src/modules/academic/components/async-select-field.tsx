"use client";

import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils/index";

import { Field } from "./field";

/** One choice, in the shape every option endpoint in the module reports. */
type AsyncOption = {
  id: number;
  label: string;
};

/**
 * The signature the module's `useXOptions` hooks already share: a search term in,
 * a query of matching options out. Passing the hook itself keeps this component
 * free of any one resource while the caching, keys, and endpoints stay exactly
 * where they are.
 */
type UseOptionsHook = (search: string) => UseQueryResult<AsyncOption[]>;

/** Props both the single- and multiple-choice modes share. */
type SharedProps = {
  name: string;
  label: string;
  useOptions: UseOptionsHook;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Narrows what the endpoint returned, for a choice only this screen may not offer. */
  filterOption?: (option: AsyncOption) => boolean;
};

type SingleProps = SharedProps & {
  multiple?: false;
  value: number | undefined;
  onChange: (value: number) => void;
  /**
   * What to show for an already-chosen value the current search results do not
   * contain — an edit screen knows the name from the record it loaded, so the
   * control never falls back to showing a bare id or an empty box.
   */
  selectedLabel?: string;
};

type MultipleProps = SharedProps & {
  multiple: true;
  value: number[];
  onChange: (value: number[]) => void;
  /** The same fallback as `selectedLabel`, keyed by id. */
  selectedLabels?: Record<number, string>;
};

/**
 * Renders a labelled picker whose choices come from the API and narrow as the
 * visitor types, for lists too long to offer as one fixed dropdown.
 *
 * Searching happens on the server: the typed term is debounced and handed to the
 * caller's own options hook, so this never filters a stale page client-side and
 * pretends the rest does not exist. Because the visible page changes as the term
 * does, the label of an already-chosen value is remembered separately — from the
 * record the screen loaded, and from each choice as it is made — so a selection
 * never blanks out once it drops off the current page of results.
 */
export function AsyncSelectField(props: SingleProps | MultipleProps) {
  const {
    name,
    label,
    useOptions,
    error,
    hint,
    required = false,
    placeholder = "Chọn…",
    searchPlaceholder = "Nhập để tìm…",
    emptyMessage = "Không tìm thấy kết quả phù hợp.",
    disabled = false,
    className,
    filterOption,
  } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [knownLabels, setKnownLabels] = useState<Record<number, string>>({});

  const query = useOptions(debouncedSearch);
  const options = filterOption === undefined ? (query.data ?? []) : (query.data ?? []).filter(filterOption);

  const selectedIds = props.multiple === true ? props.value : props.value === undefined ? [] : [props.value];

  /** Resolves what to display for one id, preferring the freshest name available. */
  function labelFor(id: number): string {
    const fromResults = options.find((option) => option.id === id)?.label;

    if (fromResults !== undefined) {
      return fromResults;
    }

    if (knownLabels[id] !== undefined) {
      return knownLabels[id];
    }

    if (props.multiple === true) {
      return props.selectedLabels?.[id] ?? `#${id}`;
    }

    return props.selectedLabel ?? `#${id}`;
  }

  /** Applies one choice, remembering its label so a later search cannot erase it. */
  function choose(option: AsyncOption) {
    setKnownLabels((current) => ({ ...current, [option.id]: option.label }));

    if (props.multiple === true) {
      const next = props.value.includes(option.id)
        ? props.value.filter((id) => id !== option.id)
        : [...props.value, option.id];

      props.onChange(next);

      return;
    }

    props.onChange(option.id);
    setOpen(false);
    setSearch("");
  }

  /** Drops one choice from a multiple-choice selection. */
  function remove(id: number) {
    if (props.multiple !== true) {
      return;
    }

    props.onChange(props.value.filter((selected) => selected !== id));
  }

  const triggerText =
    selectedIds.length === 0
      ? placeholder
      : props.multiple === true
        ? `Đã chọn ${selectedIds.length}`
        : labelFor(selectedIds[0]);

  return (
    <Field
      name={name}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={className}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            id={name}
            disabled={disabled}
            aria-expanded={open}
            aria-invalid={error !== undefined}
            aria-describedby={error !== undefined ? `${name}-error` : undefined}
            className={cn(
              "w-full justify-between font-normal",
              selectedIds.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">{triggerText}</span>
            <ChevronsUpDownIcon className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          {/* The endpoint already answered the typed term, so cmdk must not filter that answer again. */}
          <Command shouldFilter={false}>
            <CommandInput
              value={search}
              onValueChange={setSearch}
              placeholder={searchPlaceholder}
            />
            <CommandList>
              {query.isPending ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Đang tải…</p>
              ) : options.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
              ) : (
                options.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={String(option.id)}
                    onSelect={() => choose(option)}
                  >
                    <CheckIcon
                      className={cn(
                        "text-foreground",
                        selectedIds.includes(option.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {props.multiple === true && selectedIds.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => (
            <li key={id}>
              <Badge variant="secondary" className="gap-1 pr-1">
                <span className="truncate">{labelFor(id)}</span>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  disabled={disabled}
                  aria-label={`Bỏ chọn ${labelFor(id)}`}
                  className="rounded-sm opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}
