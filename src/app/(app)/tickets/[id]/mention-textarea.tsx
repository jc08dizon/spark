"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

type Candidate = { id: string; name: string };

// A plain absolutely-positioned dropdown (no base-ui popup) — click a name
// to insert "@Full Name " at the trigger position. Deliberately simple:
// mouse selection only, no arrow-key navigation.
export function MentionTextarea({
  name,
  value,
  onChange,
  candidates,
  placeholder,
  rows,
  maxLength,
  required,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  candidates: Candidate[];
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [queryStart, setQueryStart] = useState(0);

  function updateMentionState(text: string, cursor: number) {
    const uptoCursor = text.slice(0, cursor);
    const atIndex = uptoCursor.lastIndexOf("@");
    if (atIndex === -1) {
      setQuery(null);
      return;
    }
    const between = uptoCursor.slice(atIndex + 1);
    if (/\s/.test(between) || between.length > 40) {
      setQuery(null);
      return;
    }
    setQuery(between);
    setQueryStart(atIndex);
  }

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(event.target.value);
    updateMentionState(event.target.value, event.target.selectionStart);
  }

  function handleSelect(candidateName: string) {
    const textarea = textareaRef.current;
    if (!textarea || query === null) return;

    const cursor = textarea.selectionStart;
    const before = value.slice(0, queryStart);
    const after = value.slice(cursor);
    const next = `${before}@${candidateName} ${after}`;
    onChange(next);
    setQuery(null);

    const nextCursor = before.length + candidateName.length + 2;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  const matches =
    query !== null
      ? candidates
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5)
      : [];

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery(null);
        }}
        onBlur={() => {
          // Delay so a click on a dropdown item registers before we close it.
          setTimeout(() => setQuery(null), 150);
        }}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
      />
      {query !== null && matches.length > 0 ? (
        <ul className="absolute z-10 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          {matches.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="block w-full px-2.5 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(c.name)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
