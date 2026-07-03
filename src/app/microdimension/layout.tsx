import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MicroDimension | Studio",
  description: "Advanced 3D Spatial Design & AI Generation Engine",
};

export default function MicroDimensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] text-zinc-300 font-sans overflow-hidden flex flex-col selection:bg-blue-500/30">
      <style>{`
        /* Reset and enforce MicroDimension dark aesthetic */
        :root {
          --md-bg: #0a0a0a;
          --md-panel: #141414;
          --md-border: #222;
          --md-accent: #3b82f6;
          --md-accent-hover: #2563eb;
        }
        
        .md-panel {
          background-color: var(--md-panel);
          border: 1px solid var(--md-border);
        }
        
        /* Override global scrollbars for this app */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
      {children}
    </div>
  );
}
