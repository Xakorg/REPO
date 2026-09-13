"use client";

import Editor from "@monaco-editor/react";
import React from "react";

export default function MonacoEditor({ value, language = "javascript", onChange }: {
  value: string;
  language?: string;
  onChange?: (val: string) => void;
}) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        onChange={(v) => onChange?.(v || "")}
        options={{ fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Courier New", monospace', minimap: { enabled: false }, automaticLayout: true }}
      />
    </div>
  );
}
