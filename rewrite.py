import sys

def modify_layout():
    file_path = "src/app/chat/layout.tsx"
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # We want to replace lines 1317 to 1558 (0-indexed 1316 to 1557)
    # with the unified sidebar.
    # We want to delete lines 1564 to 1735 (0-indexed 1563 to 1734)

    # Let's verify line contents first to be safe
    # Line 1317 should start with <aside className="hidden md:flex w-20
    print("Line 1317:", lines[1316].strip())
    # Line 1558 should be </aside>
    print("Line 1558:", lines[1557].strip())

    # Line 1564 should be {/* 4. RIGHT SIDEBAR */}
    print("Line 1564:", lines[1563].strip())
    # Line 1735 should be </aside>
    print("Line 1735:", lines[1734].strip())

    new_sidebar = """      <aside className="hidden md:flex w-80 bg-[#0a0a15] border-r border-white/5 flex-col z-30 shrink-0">
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between shadow-xl shrink-0">
          <h2 className="text-sm font-black uppercase italic tracking-tighter text-white truncate">
            {activeServer === 'home' ? 'Direct Messages' : serverHeaderTitle}
          </h2>
          {activeServer === 'home' && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setShowGlobalSearch(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"><Search className="w-4 h-4" /></button>
              <button onClick={() => setShowGroupDmModal(true)} className="p-1.5 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-white/5 transition-all"><Users className="w-4 h-4" /></button>
              <button onClick={() => setShowStartDmDialog(true)} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"><PlusCircle className="w-4 h-4" /></button>
            </div>
          )}
        </header>

        {/* Horizontal Server Rail */}
        <div className="py-3 px-2 border-b border-white/5 bg-black/40 shrink-0">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2.5 w-max px-2">
              {allServers.map(s => (
                <button 
                  key={s.id}
                  onClick={() => navigateTo(s.href, router)}
                  className={cn(
                    "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all duration-300 relative group overflow-hidden shrink-0 border-2",
                    activeServer === s.id ? "border-primary bg-primary text-black shadow-[0_0_20px_rgba(var(--primary),0.3)] rounded-[0.8rem]" : "border-transparent bg-white/5 text-white/40 hover:bg-white/10 hover:text-white hover:rounded-[0.8rem]",
                    s.id !== 'home' && s.id !== 'xakteir' && s.id !== 'gaming' && s.id !== 'dev' && s.id !== 'discover' && !s.iconUrl ? `${s.color} hover:text-white` : ""
                  )}
                >
                  {s.iconUrl ? <img src={s.iconUrl} alt={s.name} className="w-full h-full object-cover transition-all" /> : <s.icon className="w-5 h-5" />}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[9px] font-black uppercase tracking-widest rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {s.name}
                  </div>
                </button>
              ))}
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button onClick={() => setShowCreateServerModal(true)} className="w-12 h-12 rounded-[1rem] bg-white/5 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black hover:rounded-[0.8rem] transition-all shrink-0 border-2 border-transparent border-dashed hover:border-emerald-500">
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {/* Channels / DMs */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {activeServer === 'home' ? (
              <div className="space-y-2">
                 <p className="px-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-3">Conversations</p>
                 {!activeDms?.length ? (
                   <p className="text-[10px] text-white/20 italic px-2">No active private chats.</p>
                 ) : (
                   activeDms.map(chat => (
                     <DMContactItem key={chat.id} chatId={chat.id} participants={chat.participants} activeChatId={pathname} currentUserId={user.uid} />
                   ))
                 )}
              </div>
            ) : (
              <>
                <div className="space-y-1 mb-4">
                  <button onClick={() => navigateTo(`/chat/s/${activeServer}?room3d=true`, router)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-bold hover:from-indigo-500/40 hover:to-purple-500/40 border border-white/5", searchParams.get("room3d") === "true" ? "ring-2 ring-purple-500" : "")}>
                    <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
                    <span className="truncate uppercase italic">{serverHeaderTitle} 3D ROOM</span>
                  </button>
                </div>
                {channelCategories.map(cat => {
                  const catChannels = serverChannelsList.filter(c => c.category === cat);
                  const isCollapsed = collapsedCategories[cat];
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer group" onClick={() => toggleCategory(cat)}>
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className={cn("w-3 h-3 text-white/40 group-hover:text-white transition-transform", !isCollapsed && "rotate-90")} />
                          <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{cat}</p>
                        </div>
                        {!isBuiltInServer && (
                          <button onClick={(e) => { e.stopPropagation(); setChannelCategoryInput(cat); setShowCreateChannelModal(true); }} className="text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {!isCollapsed && catChannels.map(ch => {
                        const isVoice = ch.type === "voice";
                        const isActive = isVoice ? activeVoiceChannel === ch.name : pathname.includes(`/chat/s/${activeServer}`) && searchParams.get("c") === ch.name;
                        if (isVoice) {
                          return (
                            <div key={ch.id} className="space-y-1">
                              <button onClick={() => handleJoinVoice(ch.name)} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all", isActive ? "bg-emerald-500/10 text-emerald-400 font-bold" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                                <div className="flex items-center gap-3"><Volume2 className="w-4 h-4 shrink-0" /><span className="truncate">{ch.name}</span></div>
                              </button>
                              {voiceUsers[ch.name] && voiceUsers[ch.name].length > 0 && (
                                <div className="pl-6 space-y-1">
                                  {voiceUsers[ch.name].map((vu: any) => {
                                    const isSpeaking = speakingUsers.includes(vu.uid);
                                    return (
                                      <div key={vu.uid} className="flex items-center gap-2 py-1">
                                        <Avatar className={cn("w-5 h-5 border transition-all", isSpeaking ? "border-emerald-500 ring-2 ring-emerald-500/40" : "border-white/5")}><AvatarImage src={vu.photoURL} /><AvatarFallback className="text-[8px]">{vu.displayName?.[0]}</AvatarFallback></Avatar>
                                        <span className="text-[10px] text-zinc-400 truncate">{vu.displayName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <button key={ch.id} onClick={() => navigateTo(`/chat/s/${activeServer}?c=${ch.name}`, router)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all", isActive ? "bg-primary/20 text-white font-bold" : "text-white/40 hover:bg-white/5 hover:text-white")}>
                              <HashIcon className="w-4 h-4 shrink-0" />
                              <span className="truncate">{ch.name}</span>
                            </button>
                          );
                        }
                      })}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </ScrollArea>

        {voiceConnectedMsg && activeVoiceChannel && (
          <div className="p-4 bg-emerald-950/40 border-t border-b border-emerald-500/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Voice Connected</p>
                <p className="text-xs text-zinc-400 truncate max-w-[120px] font-medium">{activeVoiceChannel}</p>
              </div>
            </div>
            <button onClick={handleLeaveVoice} className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20">Disconnect</button>
          </div>
        )}

        {/* Unified Footer */}
        <footer className="p-5 bg-[#05030d] border-t border-white/5 flex flex-col gap-4 shrink-0">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setShowGlobalSettingsModal(true)}>
                <div className="relative hover:scale-105 transition-transform">
                  <Avatar className="w-10 h-10 border-2 border-white/10"><AvatarImage src={user.photoURL || ""} /><AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback></Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#05030d] rounded-full" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">{user.displayName}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">{userData?.statusEmoji || '💬'} {userData?.statusText || 'Online'}</p>
                </div>
             </div>
             <div className="flex gap-1.5 items-center">
                <button onClick={() => setIsMuted(!isMuted)} className={cn("p-2 rounded-xl transition-all", isMuted ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}><MicOff className="w-4 h-4" /></button>
                <button onClick={() => setIsDeafened(!isDeafened)} className={cn("p-2 rounded-xl transition-all", isDeafened ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30" : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white")}><HeadphoneOff className="w-4 h-4" /></button>
                <button onClick={() => setShowGlobalSettingsModal(true)} className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
             </div>
           </div>
        </footer>
      </aside>
"""

    if "w-20 bg-[#05030d]" in lines[1316] and "</aside>" in lines[1557] and "RIGHT SIDEBAR" in lines[1563] and "</aside>" in lines[1734]:
        new_lines = lines[:1316] + [new_sidebar] + lines[1558:1563] + lines[1735:]
        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print("Success")
    else:
        print("Lines didn't match perfectly. Check output:")

if __name__ == "__main__":
    modify_layout()
