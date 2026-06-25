"use client";

import { useEffect, useState, use } from "react";
import { useFirestore } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PlayProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const firestore = useFirestore();
  const { id } = use(params);
  
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!firestore || !id) return;
    
    getDoc(doc(firestore, "publishedProjects", id)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setProject(data);
        
        // Generate the preview URL similar to Studio
        const indexFile = data.files.find((f:any) => f.name === 'index.html' || f.name === 'main.py' || f.name === 'main.lua' || f.name === 'blockly.xml') || data.files[0];
        
        if (indexFile) {
          let htmlContent = indexFile.content;
          
          if (data.type === 'game' && data.files.some((f:any) => f.name === 'generated.js')) {
            // It's a blockly game
            const jsCode = data.files.find((f:any) => f.name === 'generated.js')?.content || "";
            htmlContent = `
<!DOCTYPE html>
<html>
<body style="background: #000; color: #fff; font-family: monospace; margin: 0; overflow: hidden; display: flex; flex-direction: column; height: 100vh;">
  <canvas id="gameCanvas" width="800" height="600" style="background: #111; max-width: 100%; max-height: 100%; object-fit: contain; margin: auto; border: 1px solid #333;"></canvas>
  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    window.Xakteir = {
      objects: [],
      gravity: 0,
      
      onStart: function(callback) { setTimeout(callback, 100); },
      onKeyPress: function(key, callback) {
        window.addEventListener('keydown', (e) => {
          if(e.key.toLowerCase() === key.toLowerCase() || e.code === key) callback();
        });
      },
      spawn: function(type, x, y) {
        this.objects.push({ type, x, y, size: 40, color: '#' + Math.floor(Math.random()*16777215).toString(16) });
        this.render();
      },
      moveForward: function(steps) {
        if(this.objects.length > 0) this.objects[0].x += steps;
        this.render();
      },
      goTo: function(x, y) {
        if(this.objects.length > 0) {
          this.objects[0].x = x;
          this.objects[0].y = y;
        }
        this.render();
      },
      setGravity: function(g) { this.gravity = g; },
      say: function(text, time) {
        if(this.objects.length > 0) {
           this.objects[0].text = text;
           this.objects[0].textTimer = time * 60;
        }
        this.render();
      },
      hide: function() {
        if(this.objects.length > 0) this.objects[0].hidden = true;
        this.render();
      },
      show: function() {
        if(this.objects.length > 0) this.objects[0].hidden = false;
        this.render();
      },
      speak: function(text) {
        if('speechSynthesis' in window) {
           const utter = new SpeechSynthesisUtterance(text);
           window.speechSynthesis.speak(utter);
        }
      },
      vibrate: function(time) {
        if('navigator' in window && navigator.vibrate) navigator.vibrate(time * 1000);
      },
      destroy: function() {
        if(this.objects.length > 0) this.objects.pop();
        this.render();
      },
      render: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.objects.forEach(obj => {
          if(obj.hidden) return;
          ctx.fillStyle = obj.color;
          ctx.fillRect(obj.x, obj.y, obj.size, obj.size);
          if(obj.text && obj.textTimer > 0) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.fillText(obj.text, obj.x, obj.y - 10);
            obj.textTimer--;
          }
        });
      }
    };

    setInterval(() => {
       if(window.Xakteir.gravity > 0) {
          window.Xakteir.objects.forEach(o => {
            o.y += window.Xakteir.gravity;
            if(o.y > canvas.height - o.size) o.y = canvas.height - o.size;
          });
          window.Xakteir.render();
       }
    }, 1000/60);

    try {
      ${jsCode}
    } catch(e) { console.error(e); }
  </script>
</body>
</html>`;
          }

          const blob = new Blob([htmlContent], { type: 'text/html' });
          setPreviewUrl(URL.createObjectURL(blob));
        }
      }
      setLoading(false);
    });

  }, [firestore, id]);

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-black tracking-widest uppercase">Loading Game Engine...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <p className="font-black text-2xl text-red-500 mb-4">PROJECT NOT FOUND</p>
        <Button onClick={() => router.push('/games/store')} variant="outline">Back to Store</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0 bg-zinc-950/80 backdrop-blur">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mr-4 text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-black text-white">{project.name}</h1>
          <p className="text-xs text-white/50">By {project.ownerName}</p>
        </div>
      </div>
      <div className="flex-1 w-full bg-zinc-950 flex items-center justify-center p-8">
         {previewUrl ? (
           <iframe 
             src={previewUrl} 
             className="w-full h-full max-w-5xl rounded-xl border border-white/10 bg-black shadow-2xl"
             sandbox="allow-scripts allow-same-origin"
           />
         ) : (
           <p className="text-white/50">No executable file found in project.</p>
         )}
      </div>
    </div>
  );
}
