"use client";

import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

export function XakteirEditor() {
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing your thoughts here... (Try highlighting text to format, or use Markdown)',
      }),
    ],
    content: `<h1>Untitled Document</h1><p></p>`,
    editorProps: {
      attributes: {
        class: 'prose prose-lg dark:prose-invert prose-headings:font-black prose-h1:text-5xl prose-h1:tracking-tighter prose-p:text-xl prose-p:leading-relaxed max-w-none focus:outline-none',
      },
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !editor) return <div className="min-h-[1000px] animate-pulse bg-white/5 rounded-xl"></div>;

  return (
    <div className="relative w-full">
      {editor && (
        <div className="sticky top-0 z-10 flex flex-wrap gap-1 p-2 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-2xl mb-4 rounded-xl opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Bold className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Italic className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Strikethrough className="w-4 h-4" />
          </Toggle>
          <div className="w-px h-5 bg-white/10 mx-1 self-center" />
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Heading1 className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Heading2 className="w-4 h-4" />
          </Toggle>
          <div className="w-px h-5 bg-white/10 mx-1 self-center" />
          <Toggle
            size="sm"
            pressed={editor.isActive('bulletList')}
            onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <List className="w-4 h-4" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('blockquote')}
            onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
            className="data-[state=on]:bg-white/10 hover:bg-white/5 text-white/70 hover:text-white rounded-xl h-8 w-8 p-0"
          >
            <Quote className="w-4 h-4" />
          </Toggle>
        </div>
      )}

      {/* Editor Canvas */}
      <EditorContent editor={editor} className="min-h-[1000px]" />
    </div>
  );
}
