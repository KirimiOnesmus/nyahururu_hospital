import React, { useRef } from "react";
import { IconUpload, IconClose, IconFile } from "../icons";
import FormField from "./FormField";

const FileUpload = ({
  label,
  required,
  error,
  accept,
  onChange,
  file,
  onClear,
  hint,
  className = "",
}) => {
  const ref = useRef();

  const handleClick = () => ref.current?.click();
  const handleChange = (e) => onChange?.(e.target.files?.[0] || null);

  return (
    <FormField label={label} required={required} error={error} hint={!file ? hint : undefined} className={className}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center gap-3 px-4 min-h-11 py-3 border border-line rounded-xl bg-canvas">
          <IconFile className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="text-sm text-ink truncate flex-1">{file.name}</span>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                if (ref.current) ref.current.value = "";
              }}
              className="min-w-11 min-h-11 inline-flex items-center justify-center text-ink-muted hover:text-danger"
              aria-label="Remove file"
            >
              <IconClose className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex flex-col items-center gap-2 px-4 py-6 border border-dashed border-line rounded-xl text-ink-muted hover:border-primary hover:text-primary transition-colors"
        >
          <IconUpload className="w-6 h-6" aria-hidden="true" />
          <span className="text-sm font-medium">Choose a file to upload</span>
        </button>
      )}
    </FormField>
  );
};

export default FileUpload;
