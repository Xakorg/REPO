"use client";

import React from "react";

export default function MonacoEditor({ value, language = "javascript", onChange }: {
  value: string;
  language?: string;
  onChange?: (val: string) => void;
}) {
  // Placeholder editor until monaco is installed. Replace with @monaco-editor/react later.
  return (
    <div className="h-full w-full">
      <textarea
        className="w-full h-full bg-black text-white p-4 font-mono text-sm rounded-md"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
