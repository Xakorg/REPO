import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Button } from './button'
import { Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, ImageIcon, Quote, Code, Heading1, Heading2, Heading3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    if (url === null) return

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('Image URL')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-black/40 border-b border-white/5 rounded-t-2xl">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('bold') ? 'bg-primary/20 text-primary' : '')}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('italic') ? 'bg-primary/20 text-primary' : '')}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('strike') ? 'bg-primary/20 text-primary' : '')}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      
      <div className="w-[1px] h-4 bg-white/10 mx-1" />
      
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg font-black", editor.isActive('heading', { level: 1 }) ? 'bg-primary/20 text-primary' : '')}
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg font-black", editor.isActive('heading', { level: 2 }) ? 'bg-primary/20 text-primary' : '')}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      
      <div className="w-[1px] h-4 bg-white/10 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('bulletList') ? 'bg-primary/20 text-primary' : '')}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('orderedList') ? 'bg-primary/20 text-primary' : '')}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('blockquote') ? 'bg-primary/20 text-primary' : '')}
      >
        <Quote className="w-4 h-4" />
      </Button>
      
      <div className="w-[1px] h-4 bg-white/10 mx-1" />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={toggleLink}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('link') ? 'bg-primary/20 text-primary' : '')}
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={addImage}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('image') ? 'bg-primary/20 text-primary' : '')}
      >
        <ImageIcon className="w-4 h-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn("h-8 w-8 text-white/70 hover:text-white rounded-lg", editor.isActive('codeBlock') ? 'bg-primary/20 text-primary' : '')}
      >
        <Code className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4 border border-white/10',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[150px] p-6 text-white text-sm italic leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  })

  return (
    <div className={cn("bg-[#0b0b14]/60 border border-white/5 rounded-2xl flex flex-col", className)}>
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
