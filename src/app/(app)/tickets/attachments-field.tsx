"use client";

import { useEffect, useRef, useState } from "react";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB, kept in sync with lib/attachments.ts

// Native <input type="file multiple"> owns the real FileList that gets
// submitted; we mirror it into React state for the chip UI and write back
// through a DataTransfer whenever a chip is removed, so what's displayed is
// always exactly what will upload.
export function AttachmentsField({ name = "attachments" }: { name?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const handleReset = () => {
      setFiles([]);
      setError(null);
    };
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, []);

  function syncInput(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((file) => dt.items.add(file));
    if (inputRef.current) inputRef.current.files = dt.files;
    setFiles(next);
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    if (selected.length > MAX_FILES) {
      setError(`Attach at most ${MAX_FILES} files at a time`);
      syncInput(selected.slice(0, MAX_FILES));
      return;
    }
    const tooBig = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (tooBig) {
      setError(`${tooBig.name} exceeds the 10MB limit`);
      syncInput(selected.filter((file) => file.size <= MAX_FILE_SIZE));
      return;
    }
    setError(null);
    setFiles(selected);
  }

  function removeFile(index: number) {
    setError(null);
    syncInput(files.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        name={name}
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Paperclip data-icon="inline-start" />
          Attach files
        </Button>
      </div>

      {files.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground"
            >
              <span className="max-w-48 truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <p className="text-xs text-muted-foreground">
        Up to {MAX_FILES} files, 10MB each — images, PDFs, Office docs, text,
        or zip.
      </p>
    </div>
  );
}
