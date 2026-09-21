import React, { useRef } from "react";
import { FaCloudUploadAlt, FaTimes, FaFile } from "react-icons/fa";
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
    <FormField label={label} required={required} error={error} className={className}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {file ? (
        <div className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50">
          <FaFile className="text-blue-500 shrink-0" />
          <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
          {onClear && (
            <button
              type="button"
              onClick={() => {
                onClear();
                if (ref.current) ref.current.value = "";
              }}
              className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors"
              aria-label="Remove file"
            >
              <FaTimes className="text-xs" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="w-full flex flex-col items-center gap-2 px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors cursor-pointer"
        >
          <FaCloudUploadAlt className="text-2xl" />
          <span className="text-sm font-medium">Click to upload</span>
          {hint && <span className="text-xs">{hint}</span>}
        </button>
      )}
    </FormField>
  );
};

export default FileUpload;
