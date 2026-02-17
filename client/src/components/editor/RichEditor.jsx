"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [codeView, setCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value || "");
  const lastExternalValueRef = useRef(value || "");

  useEffect(() => {
    const nextValue = value || "";
    if (nextValue !== lastExternalValueRef.current) {
      setCodeValue(nextValue);
      lastExternalValueRef.current = nextValue;
    }
  }, [value]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return undefined;

    const stopEditorShortcutPropagation = (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = String(event.key || "").toLowerCase();
      if (["b", "z", "y"].includes(key)) {
        event.stopPropagation();
      }
    };

    quill.root.addEventListener("keydown", stopEditorShortcutPropagation, true);
    return () => {
      quill.root.removeEventListener(
        "keydown",
        stopEditorShortcutPropagation,
        true
      );
    };
  }, []);

  const handleSelectMedia = (media) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const range = quill.getSelection();
    const index = range?.index ?? quill.getLength();
    quill.insertEmbed(index, "image", media.url);
    quill.setSelection(index + 1, 0);
  };

  const handleToggleCodeView = useCallback(() => {
    if (codeView) {
      setCodeView(false);
      onChange(codeValue || "");
      return;
    }
    setCodeValue(value || "");
    setCodeView(true);
  }, [codeView, codeValue, onChange, value]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["clean"],
          ["code-view"],
        ],
        handlers: {
          image: () => setMediaOpen(true),
          "code-view": handleToggleCodeView,
        },
      },
      history: {
        delay: 300,
        maxStack: 200,
        userOnly: true,
      },
    }),
    [handleToggleCodeView]
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
    <div
      className={`prose-editor border rounded-xl overflow-visible mb-10 ${className} ${
        codeView ? "code-view-active" : ""
      }`}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      onKeyPress={(event) => event.stopPropagation()}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={`${codeView ? "" : height} bg-white`}
        readOnly={codeView}
      />
      {codeView && (
        <textarea
          className={`code-view-textarea ${height} w-full bg-white text-sm leading-relaxed`}
          value={codeValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setCodeValue(nextValue);
            onChange(nextValue);
          }}
          spellCheck={false}
        />
      )}
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
