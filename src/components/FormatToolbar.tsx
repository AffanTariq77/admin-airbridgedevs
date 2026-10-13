import { useState } from "react";

// Bold and colour buttons for a Markdown textarea. Select some words, click a
// button, and the selection is wrapped in the matching syntax:
//   bold   -> **words**
//   colour -> [words](color:purple), or [words](color:#1a2b3c) for a custom one
//   bullets / numbers -> "• " or "1. " at the start of every selected line
// Names must match TEXT_COLOURS in the website's BlogPost.tsx.
const COLOURS = [
  { name: "purple", swatch: "#7c3aed" },
  { name: "pink", swatch: "#db2777" },
  { name: "blue", swatch: "#2563eb" },
  { name: "green", swatch: "#059669" },
  { name: "orange", swatch: "#ea580c" },
  { name: "red", swatch: "#dc2626" },
];

// Replace value[from, to) with text, then select text[select[0], select[1])
type Edit = { from: number; to: number; text: string; select: [number, number] };

// Bold on, or off when the selection is already bold (markers inside or
// just outside the selection)
export function boldEdit(value: string, start: number, end: number): Edit {
  const selected = value.slice(start, end);

  if (start >= 2 && value.slice(start - 2, start) === "**" && value.slice(end, end + 2) === "**") {
    return { from: start - 2, to: end + 2, text: selected, select: [0, selected.length] };
  }

  const inner = selected.match(/^\*\*([\s\S]+)\*\*$/)?.[1];
  if (inner !== undefined) {
    return { from: start, to: end, text: inner, select: [0, inner.length] };
  }

  const text = selected || "text";
  return { from: start, to: end, text: `**${text}**`, select: [2, 2 + text.length] };
}

// Same colour again removes it, a different colour replaces it, so words are
// never wrapped twice
export function colourEdit(value: string, start: number, end: number, colour: string): Edit {
  const selected = value.slice(start, end);
  const wrapped = (inner: string, from: number, to: number, current: string): Edit =>
    current.toLowerCase() === colour.toLowerCase()
      ? { from, to, text: inner, select: [0, inner.length] }
      : { from, to, text: `[${inner}](color:${colour})`, select: [1, 1 + inner.length] };

  const after = value.slice(end).match(/^\]\(color:([^)\s]+)\)/);
  if (start >= 1 && value[start - 1] === "[" && after) {
    return wrapped(selected, start - 1, end + after[0].length, after[1]);
  }

  const own = selected.match(/^\[([\s\S]*)\]\(color:([^)\s]+)\)$/);
  if (own) return wrapped(own[1], start, end, own[2]);

  const text = selected || "text";
  return { from: start, to: end, text: `[${text}](color:${colour})`, select: [1, 1 + text.length] };
}

// Works on whole lines, so a selection that starts mid-line still gets the
// marker at the start of that line. Blank lines are left alone.
export function listEdit(value: string, start: number, end: number, numbered: boolean): Edit {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const to = lineEnd === -1 ? value.length : lineEnd;

  let n = 0;
  const text = value
    .slice(from, to)
    .split("\n")
    .map((line) => {
      const rest = line.replace(/^\s*(?:(?:[-*•]|\d+\.)\s+)+/, ""); // drop existing markers
      if (!rest.trim()) return line;
      n += 1;
      return `${numbered ? `${n}.` : "•"} ${rest}`;
    })
    .join("\n");

  return { from, to, text, select: [0, text.length] };
}

type Props = {
  textareaId: string;
  value: string;
  onChange: (value: string) => void;
};

export default function FormatToolbar({ textareaId, value, onChange }: Props) {
  // Picked first, applied with its own button: the native picker fires on
  // every drag step, so applying on change would wrap the text many times
  const [custom, setCustom] = useState("#7c3aed");

  // Swap value[from, to) for text through the browser's own insert command,
  // so Cmd/Ctrl+Z undoes toolbar edits like typing. Setting the value from
  // React would wipe the textarea's undo history.
  const apply = ({ from, to, text, select }: Edit) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    if (!textarea) return;

    textarea.focus();
    textarea.setSelectionRange(from, to);
    // ponytail: execCommand is deprecated but still the only way to keep native
    // undo in every major browser. Falls back to a plain set (no undo) if removed.
    if (!document.execCommand("insertText", false, text)) {
      onChange(value.slice(0, from) + text + value.slice(to));
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(from + select[0], from + select[1]);
    });
  };

  const selection = () => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
    return textarea ? ([textarea.selectionStart, textarea.selectionEnd] as const) : null;
  };

  const run = (edit: (value: string, start: number, end: number) => Edit) => {
    const range = selection();
    if (range) apply(edit(value, range[0], range[1]));
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        // Keep the textarea's selection: a normal click would blur it first
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run(boldEdit)}
        title="Bold the selected words"
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
      >
        B
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run((v, a, b) => listEdit(v, a, b, false))}
        title="Turn the selected lines into bullet points"
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
      >
        • List
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run((v, a, b) => listEdit(v, a, b, true))}
        title="Turn the selected lines into a numbered list"
        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
      >
        1. List
      </button>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <span className="text-xs text-slate-500">Colour:</span>
      {COLOURS.map((colour) => (
        <button
          key={colour.name}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => run((v, a, b) => colourEdit(v, a, b, colour.name))}
          title={`Make the selected words ${colour.name}`}
          aria-label={`Colour ${colour.name}`}
          className="h-6 w-6 rounded-full border-2 border-white shadow ring-1 ring-slate-300 transition hover:scale-110"
          style={{ backgroundColor: colour.swatch }}
        />
      ))}
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <label
        title="Choose any colour"
        className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full shadow ring-1 ring-slate-300"
        style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }}
      >
        <input
          type="color"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Choose any colour"
        />
      </label>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => run((v, a, b) => colourEdit(v, a, b, custom))}
        title={`Make the selected words ${custom}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
      >
        <span className="h-3.5 w-3.5 rounded-full ring-1 ring-slate-300" style={{ backgroundColor: custom }} />
        Apply
      </button>
    </div>
  );
}
