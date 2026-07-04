"use client";

import React, { useState, useCallback, useRef } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge, 
  NodeTypes,
  ReactFlowProvider,
  Handle,
  Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useDevCentreStore } from "@/lib/dev-centre-store";
import { useFirestore, useUser } from "@/firebase";
import { doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, Save, Mail, Zap, Server, MessageSquare, Bot, 
  Database, PlusCircle, Trash2, Webhook, Network
} from "lucide-react";

// --- CUSTOM NODES ---

const TriggerNode = ({ data }: { data: any }) => (
  <div className="bg-zinc-950/90 border border-green-500/30 rounded-2xl p-4 w-64 shadow-[0_0_20px_rgba(34,197,94,0.1)] backdrop-blur-md">
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40">
        <Webhook className="w-4 h-4 text-green-400" />
      </div>
      <div>
        <h3 className="text-xs font-black uppercase text-green-400 tracking-widest">{data.label}</h3>
        <p className="text-[10px] text-white/50">When this happens...</p>
      </div>
    </div>
    <div className="text-xs text-white/80 p-2 bg-black/40 rounded-xl border border-white/5">
      {data.description || "Listens for an event to start."}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-400 border-2 border-black" />
  </div>
);

const ActionNode = ({ data }: { data: any }) => (
  <div className="bg-zinc-950/90 border border-blue-500/30 rounded-2xl p-4 w-64 shadow-[0_0_20px_rgba(59,130,246,0.1)] backdrop-blur-md">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-blue-400 border-2 border-black" />
    <div className="flex items-center gap-3 mb-2">
      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
        {data.icon === "ai" ? <Bot className="w-4 h-4 text-blue-400" /> : <Zap className="w-4 h-4 text-blue-400" />}
      </div>
      <div>
        <h3 className="text-xs font-black uppercase text-blue-400 tracking-widest">{data.label}</h3>
        <p className="text-[10px] text-white/50">Then do this...</p>
      </div>
    </div>
    <div className="text-xs text-white/80 p-2 bg-black/40 rounded-xl border border-white/5">
      {data.description || "Executes an action."}
    </div>
    <Handle type="source" position={Position.Right} className="w-3 h-3 bg-blue-400 border-2 border-black" />
  </div>
);

const nodeTypes: NodeTypes = {
  triggerNode: TriggerNode,
  actionNode: ActionNode,
};

const initialNodes = [
  {
    id: "1",
    type: "triggerNode",
    position: { x: 100, y: 200 },
    data: { label: "Webhook Receive", description: "Triggered on POST request" },
  },
];
const initialEdges: Edge[] = [];

// --- MAIN COMPONENT ---

function DevAutomateCanvas() {
  const { activeProjectId } = useDevCentreStore();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, desc: string, icon: string = "") => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify({ type: nodeType, label, desc, icon }));
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = document.querySelector(".react-flow-wrapper")?.getBoundingClientRect();
      const nodeDataStr = event.dataTransfer.getData("application/reactflow");
      
      if (!nodeDataStr || !reactFlowBounds || !reactFlowInstance) return;

      const nodeData = JSON.parse(nodeDataStr);
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `dndnode_${new Date().getTime()}`,
        type: nodeData.type,
        position,
        data: { label: nodeData.label, description: nodeData.desc, icon: nodeData.icon },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleSave = async () => {
    if (!activeProjectId || !firestore) {
      toast({ variant: "destructive", title: "Error", description: "No active project selected." });
      return;
    }
    const flow = reactFlowInstance?.toObject();
    if (flow) {
      try {
        await setDoc(doc(firestore, "projects", activeProjectId, "automations", "main"), { flow });
        toast({ title: "Workflow Saved 🚀", description: "Your automation has been saved securely." });
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to save workflow." });
      }
    }
  };

  if (!activeProjectId) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center bg-black">
        <div className="absolute inset-0 arcade-grid opacity-15 pointer-events-none" />
        <Card className="glass-card p-12 rounded-[3rem] border-white/10 relative z-10 max-w-lg space-y-6 bg-zinc-950/80">
          <Network className="w-16 h-16 text-blue-500 mx-auto animate-float" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Xakteir Dev Automate</h2>
          <p className="text-sm font-medium text-white/50">Select an active project from the Project Overview to start building powerful automations.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-black text-white">
      
      {/* ── SIDEBAR PALETTE ── */}
      <div className="w-80 bg-zinc-950/90 border-r border-white/10 flex flex-col z-10 shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" /> Automate
          </h2>
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mt-2">Drag nodes to canvas</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {/* Triggers */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-green-400 px-2 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Triggers (Start)
            </h3>
            
            <div 
              className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl cursor-grab hover:bg-green-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "triggerNode", "Webhook Receive", "Listens for POST requests")}
              draggable
            >
              <Webhook className="w-4 h-4 text-green-400" />
              <div className="text-xs font-bold text-white/90">Webhook Event</div>
            </div>
            
            <div 
              className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl cursor-grab hover:bg-green-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "triggerNode", "Email Received", "Fires when an email arrives")}
              draggable
            >
              <Mail className="w-4 h-4 text-green-400" />
              <div className="text-xs font-bold text-white/90">Email Received</div>
            </div>

            <div 
              className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl cursor-grab hover:bg-green-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "triggerNode", "Database Created", "Fires on new Firestore doc")}
              draggable
            >
              <Database className="w-4 h-4 text-green-400" />
              <div className="text-xs font-bold text-white/90">Database Insert</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 px-2 flex items-center gap-2">
              <Play className="w-3 h-3" /> Actions (Do)
            </h3>
            
            <div 
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-grab hover:bg-blue-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "actionNode", "AI Summarize", "Summarize incoming data with XakAI", "ai")}
              draggable
            >
              <Bot className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-bold text-white/90">AI Summarize</div>
            </div>

            <div 
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-grab hover:bg-blue-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "actionNode", "Send Email", "Sends a transactional email")}
              draggable
            >
              <Mail className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-bold text-white/90">Send Email</div>
            </div>

            <div 
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-grab hover:bg-blue-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "actionNode", "Send SMS", "Sends a text message via Twilio")}
              draggable
            >
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-bold text-white/90">Send SMS</div>
            </div>

            <div 
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-grab hover:bg-blue-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "actionNode", "Query Firestore", "Reads a document from DB")}
              draggable
            >
              <Database className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-bold text-white/90">Query Database</div>
            </div>

            <div 
              className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl cursor-grab hover:bg-blue-500/20 transition-all flex items-center gap-3"
              onDragStart={(e) => onDragStart(e, "actionNode", "Execute JS", "Run custom Node.js script")}
              draggable
            >
              <Server className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-bold text-white/90">Execute Script</div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40">
           <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl h-10 shadow-lg border border-blue-400/20">
             <Save className="w-3.5 h-3.5 mr-2" /> Save Workflow
           </Button>
        </div>
      </div>

      {/* ── CANVAS AREA ── */}
      <div className="flex-1 relative react-flow-wrapper h-full" onDrop={onDrop} onDragOver={onDragOver}>
        {/* Background Grid Pattern (Cyberpunk vibe) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
          className="bg-black/50"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 }
          }}
        >
          <Background color="#3b82f6" gap={40} size={1} variant={"dots" as any} />
          <Controls className="bg-zinc-900 border-white/10 fill-white text-white shadow-2xl" />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === 'triggerNode') return '#22c55e';
              return '#3b82f6';
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden"
          />
        </ReactFlow>

        {/* Top Header Overlay */}
        <div className="absolute top-4 left-6 z-10 flex items-center gap-4 bg-zinc-950/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">
           <div>
             <h1 className="text-lg font-black uppercase italic tracking-tighter text-white">Main Automation</h1>
             <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">{nodes.length} nodes · {edges.length} connections</p>
           </div>
           <div className="h-8 w-px bg-white/10 mx-2" />
           <Button variant="outline" className="h-8 text-xs font-bold bg-white/5 border-white/10 text-white hover:bg-white/10">
             <Play className="w-3.5 h-3.5 mr-2 text-green-400" /> Test Run
           </Button>
        </div>
      </div>
    </div>
  );
}

export default function AutomatePage() {
  return (
    <ReactFlowProvider>
      <DevAutomateCanvas />
    </ReactFlowProvider>
  );
}
