import { ReactNode, useRef, useState } from "react";

type ImageDropzoneProps = {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  label: string;
  hint?: string;
  children?: ReactNode;
};

export default function ImageDropzone({
  onFiles,
  multiple = false,
  disabled = false,
  label,
  hint,
  children,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (files.length) {
      onFiles(multiple ? files : files.slice(0, 1));
    }
  };

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (disabled) return;
          handleFiles(event.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        } ${disabled ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg
          className="mb-2 h-6 w-6 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M12 16V4m0 0L8 8m4-4 4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
          />
        </svg>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </div>
      {children}
    </div>
  );
}
