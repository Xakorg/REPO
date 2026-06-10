const fs = require('fs');
const file = 'c:/Users/ridwa/Downloads/download (31)/src/app/suite/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const featureArrays = `
  const writeFeatures = ["Rich text", "Strikethrough", "Highlight", "Text Color", "Background Color", "Superscript", "Subscript", "Code Block", "Blockquote", "Align Left", "Align Center", "Align Right", "Justify", "Ordered List", "Unordered List", "Indent", "Outdent", "Version History", "Math Equations", "Table of Contents", "Find & Replace", "Word Count", "PDF Export", "Paginated View", "Insert Table"];
  const sheetsFeatures = ["Formulas Parsing", "Charts", "Cell Formatting", "Freezing Rows", "Freezing Columns", "Filter Data", "Sort Ascending", "Sort Descending", "Merge Cells", "Wrap Text", "Number Format", "Conditional Formatting", "Data Validation", "Insert Row Above", "Insert Row Below", "Insert Col Left", "Insert Col Right", "Delete Row", "Delete Col", "Hide Row", "Hide Col", "Protect Sheet", "VLOOKUP", "Pivot Tables", "Macros"];
  const slidesFeatures = ["Animations", "Laser Pointer", "Slide Master", "Slide Transitions", "Embedded Audio", "Speaker Notes", "Grid View", "Arrange Objects", "Group Objects", "Align Objects", "Background Image", "Aspect Ratio", "Insert Shape", "Insert Chart", "Theme Selector", "Record Presentation", "Rehearse Timings", "Add Comment", "Duplicate Slide", "Hide Slide", "Outline View", "Zoom", "Spell Check", "Auto Save", "Export to Video"];
  const formsFeatures = ["Drag/Drop Builder", "Conditional Logic", "Pie Charts", "Bar Charts", "Text Input Field", "Multiple Choice Field", "Checkbox Field", "Dropdown Field", "File Upload Field", "Date/Time Field", "Rating Field", "Scale Field", "Section Break", "Required Toggle", "Email Notifications", "Accept Responses Toggle", "Response Limit", "Thank You Message", "Custom Theme Color", "Cover Image", "Shuffle Questions", "Progress Bar", "Quiz Mode", "Point Values", "Export to CSV"];
`;

content = content.replace('const [embedUrlInput, setEmbedUrlInput] = useState("");', 'const [embedUrlInput, setEmbedUrlInput] = useState("");\n' + featureArrays);

const writeToolbarStr = `
            {/* WRITE FEATURES TOOLBAR */}
            <div className="h-12 border-b border-white/5 bg-zinc-900/30 flex items-center px-6 gap-2 z-20 overflow-x-auto no-print custom-scrollbar shrink-0">
              {writeFeatures.map((f, i) => (
                <Button key={i} onClick={() => toast({ title: \`Write Feature: \${f}\` })} variant="ghost" className="h-8 px-3 text-[9px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 border border-white/5 rounded-lg">
                  {f}
                </Button>
              ))}
            </div>
`;
content = content.replace('{/* Editor Stage */}\n        <main className="flex-1 bg-[#0a0a1f] flex flex-col relative overflow-hidden">\n          <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />', '{/* Editor Stage */}\n        <main className="flex-1 bg-[#0a0a1f] flex flex-col relative overflow-hidden">\n          <div className="absolute inset-0 arcade-grid opacity-5 pointer-events-none" />\n          {activeApp === "write" && (' + writeToolbarStr + ')}');

const sheetsToolbarStr = `
                  <div className="h-14 border border-white/5 bg-zinc-900/30 rounded-xl mb-4 flex items-center px-4 gap-2 overflow-x-auto custom-scrollbar shrink-0">
                    {sheetsFeatures.map((f, i) => (
                      <Button key={i} onClick={() => toast({ title: \`Sheets Feature: \${f}\` })} variant="ghost" className="h-8 px-3 text-[9px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 border border-white/5 rounded-lg">
                        {f}
                      </Button>
                    ))}
                  </div>
`;
content = content.replace('<div className="grid grid-cols-10 gap-0.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">', sheetsToolbarStr + '\n                  <div className="grid grid-cols-10 gap-0.5 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-inner">');

const slidesToolbarStr = `
                      {/* SLIDES FEATURES TOOLBAR */}
                      <div className="h-14 border border-white/5 bg-zinc-900/30 rounded-xl flex items-center px-4 gap-2 overflow-x-auto custom-scrollbar shrink-0 mb-4">
                        {slidesFeatures.map((f, i) => (
                          <Button key={i} onClick={() => toast({ title: \`Slides Feature: \${f}\` })} variant="ghost" className="h-8 px-3 text-[9px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/5 whitespace-nowrap shrink-0 border border-white/5 rounded-lg">
                            {f}
                          </Button>
                        ))}
                      </div>
`;
content = content.replace('<div className="aspect-[16/9] w-full rounded-2xl bg-zinc-950 border border-white/5 flex flex-col p-8 md:p-12 relative justify-center text-center overflow-hidden">', slidesToolbarStr + '\n                      <div className="aspect-[16/9] w-full rounded-2xl bg-zinc-950 border border-white/5 flex flex-col p-8 md:p-12 relative justify-center text-center overflow-hidden">');

const formsMockupStr = `
              {/* FORMS APP */}
              {activeApp === 'form' && (
                <div className="flex-1 flex flex-col md:flex-row h-full min-h-[650px] bg-[#0a0a1f] animate-in fade-in slide-in-from-bottom-4 rounded-[3.5rem] overflow-hidden">
                  
                  {/* Forms Toolbar Sidebar */}
                  <div className="w-64 border-r border-white/5 bg-zinc-950 p-4 overflow-y-auto shrink-0 flex flex-col gap-2 custom-scrollbar">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 px-2">Form Elements & Tools</h3>
                    {formsFeatures.map((f, i) => (
                      <Button key={i} onClick={() => toast({ title: \`Forms Feature: \${f}\` })} variant="ghost" className="w-full justify-start h-9 px-3 text-[9px] font-black uppercase text-zinc-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-lg text-left">
                        + {f}
                      </Button>
                    ))}
                  </div>

                  {/* Forms Canvas */}
                  <div className="flex-1 p-10 overflow-y-auto custom-scrollbar flex flex-col items-center">
                    <div className="w-full max-w-2xl space-y-6">
                      <div className="bg-white text-zinc-900 p-8 rounded-2xl shadow-xl border-t-8 border-primary space-y-4">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Untitled Form</h1>
                        <p className="text-sm font-bold text-zinc-500">Form description goes here...</p>
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
                        <Input placeholder="Question Title" className="bg-transparent border-none text-xl font-bold text-white focus-visible:ring-0 px-0 h-auto" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-zinc-400"><div className="w-4 h-4 rounded-full border-2 border-zinc-500" /> <span className="text-sm font-bold">Option 1</span></div>
                          <div className="flex items-center gap-2 text-zinc-400"><div className="w-4 h-4 rounded-full border-2 border-zinc-500" /> <span className="text-sm font-bold">Option 2</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
`;

content = content.replace(/{\/\* FORMS APP \*\/}[\s\S]*?(?=<\/Card>)/, formsMockupStr);

fs.writeFileSync(file, content, 'utf8');
console.log('Features injected successfully.');
