"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

// We dynamically import ForceGraph3D to prevent SSR issues with Three.js
const ForceGraph3D = dynamic(() => import("react-force-graph-3d"), { ssr: false });

export default function KnowledgeGraph3D({ files }: { files: any[] }) {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<{nodes: any[], links: any[]}>({ nodes: [], links: [] });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const { theme } = useTheme();

  // Helper to get colors for nodes based on file type
  const getNodeColor = (file: any) => {
    if (file.isFolder) return "#f59e0b"; // amber for folders
    if (file.name.endsWith(".txt") || file.name.endsWith(".md")) return "#3b82f6"; // blue for docs
    if (file.name.endsWith(".png") || file.name.endsWith(".jpg")) return "#ec4899"; // pink for images
    if (file.name.endsWith(".mp4") || file.name.endsWith(".mov")) return "#8b5cf6"; // purple for video
    return "#10b981"; // green for everything else
  };

  useEffect(() => {
    // Generate Graph Data from Drive Files
    const nodes: any[] = [];
    const links: any[] = [];
    const folderNodes = new Set();
    
    // First pass: add all files as nodes
    files.forEach(file => {
      nodes.push({
        id: file.id,
        name: file.name,
        color: getNodeColor(file),
        val: file.isFolder ? 15 : 5, // folders are larger
        data: file
      });
      if (file.isFolder) folderNodes.add(file.id);
    });

    // Second pass: create structural links (parent -> child)
    files.forEach(file => {
      if (file.parentId && file.parentId !== 'root' && nodes.find(n => n.id === file.parentId)) {
        links.push({
          source: file.parentId,
          target: file.id,
          color: theme === 'dark' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
          type: "structural"
        });
      }
    });

    // AI Connection Simulation: Link files with similar names or extensions
    const aiLinks: any[] = [];
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const fileA = files[i];
        const fileB = files[j];
        
        // Don't link folders to folders here
        if (fileA.isFolder && fileB.isFolder) continue;

        // Simulate AI finding a connection if they share a common word in name (e.g. "Project")
        const wordsA = fileA.name.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
        const wordsB = fileB.name.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
        
        const sharedWords = wordsA.filter((w: string) => wordsB.includes(w));
        
        if (sharedWords.length > 0 && Math.random() > 0.5) { // 50% chance to draw the AI link to prevent clutter
           aiLinks.push({
             source: fileA.id,
             target: fileB.id,
             color: "#e879f9", // glowing fuchsia for AI links
             type: "ai-suggested",
             label: `AI Link: Shared context '${sharedWords[0]}'`
           });
        }
      }
    }
    
    // Combine structural links with a limited number of AI links
    links.push(...aiLinks.slice(0, 30));

    setGraphData({ nodes, links });
  }, [files, theme]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('graph-container');
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    // Zoom camera to node
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
    if (fgRef.current) {
      fgRef.current.cameraPosition(
        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
        node, // lookAt ({ x, y, z })
        3000  // ms transition duration
      );
    }
  }, [fgRef]);

  return (
    <div id="graph-container" className="w-full h-[70vh] relative bg-black/40 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-inner border border-white/10">
      <div className="absolute top-6 left-6 z-10 bg-black/50 backdrop-blur-3xl p-6 rounded-2xl border border-white/10 shadow-2xl">
        <h3 className="text-white font-black uppercase italic tracking-widest text-lg mb-4">Knowledge Web</h3>
        <div className="flex flex-col gap-3 text-xs text-white/70 font-bold uppercase tracking-wider">
          <p className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.5)]" /> Folders</p>
          <p className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Documents</p>
          <p className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#ec4899] shadow-[0_0_10px_rgba(236,72,153,0.5)]" /> Images</p>
          <p className="flex items-center gap-3"><span className="w-4 h-4 rounded-full bg-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.5)]" /> Media</p>
          <p className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
            <span className="w-4 h-1 bg-[#e879f9] shadow-[0_0_10px_rgba(232,121,249,0.8)]" /> AI Connections
          </p>
        </div>
      </div>
      
      <ForceGraph3D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        linkColor="color"
        linkWidth={link => link.type === 'ai-suggested' ? 2 : 1}
        linkDirectionalParticles={link => link.type === 'ai-suggested' ? 4 : 0}
        linkDirectionalParticleWidth={2}
        onNodeClick={handleNodeClick}
        backgroundColor="rgba(0,0,0,0)"
        showNavInfo={false}
      />
    </div>
  );
}
