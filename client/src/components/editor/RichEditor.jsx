"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Quill from "quill";
import MediaPickerModal from "@/components/media/MediaPickerModal";
import "@/styles/quill.snow.css";
import "quill-table-up/index.css";
import "quill-table-up/table-creator.css";

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
  const [tableSupport, setTableSupport] = useState(null);
  const [tableSupportReady, setTableSupportReady] = useState(false);

  const getSafeEditor = useCallback(() => {
    const editorRef = quillRef.current;
    if (!editorRef || typeof editorRef.getEditor !== "function") return null;
    try {
      return editorRef.getEditor();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const nextValue = value || "";
    if (nextValue !== lastExternalValueRef.current) {
      setCodeValue(nextValue);
      lastExternalValueRef.current = nextValue;
    }
  }, [value]);

  useEffect(() => {
    let active = true;

    const loadTableModule = async () => {
      try {
        const module = await import("quill-table-up");
        const TableUp = module.default;
        if (TableUp?.moduleName) {
          Quill.register({ [`modules/${TableUp.moduleName}`]: TableUp }, true);
        }
        if (active) {
          setTableSupport({
            TableUp,
            defaultCustomSelect: module.defaultCustomSelect,
            blotName: module.blotName,
          });
        }
      } catch (error) {
        console.error("Failed to load table editor module:", error);
      }
    };

    loadTableModule().finally(() => {
      if (active) {
        setTableSupportReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const quill = getSafeEditor();
    if (!quill) return undefined;
    const handlePaste = () => {
      quill.history.cutoff();
      requestAnimationFrame(() => {
        quill.history.cutoff();
      });
    };

    quill.root.addEventListener("paste", handlePaste, true);
    return () => {
      quill.root.removeEventListener("paste", handlePaste, true);
    };
  }, [getSafeEditor]);

  const handleSelectMedia = (media) => {
    const quill = getSafeEditor();
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

  const handleUndo = useCallback(() => {
    const quill = getSafeEditor();
    quill?.history.undo();
  }, [getSafeEditor]);

  const handleRedo = useCallback(() => {
    const quill = getSafeEditor();
    quill?.history.redo();
  }, [getSafeEditor]);

  const handleLink = useCallback(() => {
    const quill = getSafeEditor();
    if (!quill) return;

    const range = quill.getSelection(true);
    if (!range) return;

    const currentFormat = quill.getFormat(range);
    const existingLink =
      typeof currentFormat.link === "string" ? currentFormat.link : "";
    const nextLink = window.prompt(
      "Enter URL",
      existingLink || "https://"
    );

    if (nextLink === null) return;

    const trimmed = nextLink.trim();
    if (!trimmed) {
      quill.format("link", false);
      return;
    }

    if (range.length === 0) {
      quill.insertText(range.index, trimmed, "link", trimmed);
      quill.setSelection(range.index + trimmed.length, 0);
      return;
    }

    quill.format("link", trimmed);
  }, [getSafeEditor]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike", "blockquote"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ...(tableSupport?.TableUp
            ? [[{ [tableSupport.TableUp.toolName]: [] }]]
            : []),
          ["clean", "undo", "redo"],
          ["code-view"],
        ],
        handlers: {
          image: () => setMediaOpen(true),
          link: handleLink,
          undo: handleUndo,
          redo: handleRedo,
          "code-view": handleToggleCodeView,
        },
      },
      ...(tableSupport?.TableUp
        ? {
            [tableSupport.TableUp.moduleName]: {
              customSelect: tableSupport.defaultCustomSelect,
              pasteStyleSheet: true,
              pasteDefaultTagStyle: true,
            },
          }
        : {}),
      history: {
        delay: 0,
        maxStack: 200,
        userOnly: true,
      },
    }),
    [handleLink, handleRedo, handleToggleCodeView, handleUndo, tableSupport]
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
    "table",
    ...(tableSupport?.blotName
      ? [
          tableSupport.blotName.tableWrapper,
          tableSupport.blotName.tableMain,
          tableSupport.blotName.tableColgroup,
          tableSupport.blotName.tableCol,
          tableSupport.blotName.tableHead,
          tableSupport.blotName.tableBody,
          tableSupport.blotName.tableFoot,
          tableSupport.blotName.tableRow,
          tableSupport.blotName.tableCell,
          tableSupport.blotName.tableCellInner,
          tableSupport.blotName.tableCaption,
        ]
      : []),
  ];

  if (!tableSupportReady) {
    return (
      <div
        className={`prose-editor border rounded-xl overflow-visible mb-10 ${className} ${
          codeView ? "code-view-active" : ""
        }`}
      >
        <div className="h-48 bg-gray-100 animate-pulse rounded-lg border border-gray-200" />
      </div>
    );
  }

  return (
    <div
      className={`prose-editor border rounded-xl overflow-visible mb-10 ${className} ${
        codeView ? "code-view-active" : ""
      }`}
      onKeyDown={(event) => event.stopPropagation()}
      onKeyUp={(event) => event.stopPropagation()}
      onKeyPress={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <button
          type="button"
          onClick={handleUndo}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={handleRedo}
          className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Redo
        </button>
      </div>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={(nextValue) => {
          onChange(nextValue);
        }}
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
