"use client";

import React, { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import "@/styles/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-gray-100 animate-pulse rounded-lg border border-gray-200" />
  ),
});

const RichEditor = ({
  value,
  onChange,
  placeholder = "Write something...",
  className = "",
  height = "h-64",
}) => {
  const quillRef = useRef(null);
  const [mediaOpen, setMediaOpen] = useState(false);

  const handleSelectMedia = (media) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection();
    const index = range?.index ?? quill.getLength();
    quill.insertEmbed(index, "image", media.url);
    quill.setSelection(index + 1, 0);
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: {
          image: () => setMediaOpen(true),
        },
      },
    }),
    []
  );

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "align",
    "link",
    "image",
  ];

  return (
    <div className={`prose-editor border rounded-xl overflow-hidden ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={`${height} bg-white`}
      />
      <MediaPickerModal
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={handleSelectMedia}
        title="Insert Image"
      />
    </div>
  );
};

export default RichEditor;
