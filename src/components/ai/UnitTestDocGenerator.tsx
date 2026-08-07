"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, FileText, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/clipboard";

export function UnitTestDocGenerator({ targetCode }: { targetCode?: string }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"test" | "doc">("test");
  const [copied, setCopied] = useState(false);

  const sampleTest = `import { render, screen } from "@testing-library/react";\nimport MyComponent from "./MyComponent";\n\ndescribe("MyComponent Suite", () => {\n  it("should render without crashing", () => {\n    render(<MyComponent />);\n    expect(screen.getByText(/hello/i)).toBeInTheDocument();\n  });\n});`;

  const sampleDoc = `### Component API Documentation\n\n**Props:**\n- \`title\` (string): Component heading\n- \`onAction\` (function): Callback on button click\n\n**Usage:**\n\`\`\`tsx\n<MyComponent title="Dashboard" />\n\`\`\``;

  const handleCopy = async () => {
    const text = activeTab === "test" ? sampleTest : sampleDoc;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast({ title: `Copied ${activeTab === "test" ? "Jest Tests" : "Documentation"}` });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-teal-500/30 bg-[#061214]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-teal-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <span className="font-semibold text-teal-200">AI Unit Test & Doc Synthesizer</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="xs"
            variant={activeTab === "test" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("test")}
            className="h-7 text-xs px-2"
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Jest Test
          </Button>
          <Button
            size="xs"
            variant={activeTab === "doc" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("doc")}
            className="h-7 text-xs px-2"
          >
            <FileText className="h-3.5 w-3.5 mr-1" /> Markdown Doc
          </Button>
          <Button size="xs" variant="outline" onClick={handleCopy} className="h-7 text-xs px-2 border-teal-500/30">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <pre className="bg-[#03080a] p-3 rounded-lg border border-teal-500/10 font-mono text-[11px] text-teal-200 overflow-x-auto">
        <code>{activeTab === "test" ? sampleTest : sampleDoc}</code>
      </pre>
    </div>
  );
}
