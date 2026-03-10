import React, { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minimal?: boolean;
}

const TOOLBAR_FULL = [
  [{ header: [1, 2, 3, false] }],
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  ["link"],
  ["clean"],
];

const TOOLBAR_MINIMAL = [
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ["clean"],
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Type here...",
  className = "",
  minimal = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: minimal ? TOOLBAR_MINIMAL : TOOLBAR_FULL,
    }),
    [minimal]
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "list",
    "align",
    "blockquote",
    "code-block",
    "link",
  ];

  return (
    <div className={`rich-text-editor ${className}`} data-testid="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
    </div>
  );
}
