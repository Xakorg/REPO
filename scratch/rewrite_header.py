import re
import os

with open('src/components/layout/Header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if 'useUIStore' not in content:
    content = content.replace('import { useSuiteStore } from "@/lib/store";', 'import { useSuiteStore, useUIStore } from "@/lib/store";')

# 2. Add headerStyle destructuring
if 'const { headerStyle } = useUIStore();' not in content:
    content = content.replace('const { isFocusMode } = useSuiteStore();', 'const { isFocusMode } = useSuiteStore();\n  const { headerStyle } = useUIStore();')

# 3. Replace the return statement
return_index = content.find('  return (\n    <header')
if return_index != -1:
    before_return = content[:return_index]
    
    new_return = '''
  const renderAppsLauncher = () => (
    <>
      <div className="hidden lg:block">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-12 px-8 bg-zinc-900/60 border-2 border-white/10 rounded-2xl transition-all flex items-center gap-4 shadow-xl group">
              <div className="w-5 h-5 grid grid-cols-3 gap-[3px] transition-transform duration-300 group-hover:scale-110 shrink-0">
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot shadow-[0_0_4px_rgba(129,140,248,0.2)]" style={{ animationDelay: "0s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-1s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-2s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-3s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-4s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-5s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-6s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-7s" }}></div>
                <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-8s" }}></div>
              </div>
              <span className="text-[12px] font-black uppercase tracking-widest text-white/90">Apps</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[360px] p-0 glass-card rounded-[2rem] mt-6 border-4 border-white/10 overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)]" align="start">
            <AppLauncherContent router={router} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
             <Button variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl group">
                <div className="w-5 h-5 grid grid-cols-3 gap-[3px] transition-transform duration-300 group-hover:scale-110 shrink-0">
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot shadow-[0_0_4px_rgba(129,140,248,0.2)]" style={{ animationDelay: "0s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-1s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-2s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-3s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-4s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-5s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-6s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-7s" }}></div>
                  <div className="rounded-[2px] w-1.5 h-1.5 animate-launcher-dot" style={{ animationDelay: "-8s" }}></div>
                </div>
             </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-[#0a0a15] border-white/10 p-0 w-[400px] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
             <SheetHeader className="sr-only">
                <SheetTitle>App Launcher</SheetTitle>
             </SheetHeader>
             <AppLauncherContent router={router} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );

  const renderCommandBtn = () => (
    <Button onClick={() => triggerCommandCenter()} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl hidden sm:flex">
      <CommandIcon className="w-6 h-6 text-white/40" />
    </Button>
  );

  const renderFullscreenBtn = () => (
    <Button onClick={toggleFullscreen} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl hidden sm:flex">
      {isFullscreen ? <Minimize className="w-6 h-6 text-white/40" /> : <Maximize className="w-6 h-6 text-white/40" />}
    </Button>
  );

  const renderLogo = () => (
    <Link href="/" className="pointer-events-auto group flex items-center gap-3">
      <span className="text-3xl sm:text-[2.5rem] font-black tracking-tighter text-white uppercase italic leading-none transition-all group-hover:text-primary drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        Xakteir
      </span>
    </Link>
  );

  const renderNotifications = () => user && (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl relative group shadow-xl">
          <Bell className={cn("w-6 h-6", totalUnreadCount > 0 ? "text-primary animate-pulse" : "text-white/40 group-hover:text-primary")} />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-black text-[10px] font-black flex items-center justify-center rounded-full shadow-[0_0_20px_rgba(var(--primary),0.6)] border-2 border-black">
              {totalUnreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 glass-card rounded-[2.5rem] mt-6 border-4 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden" align="end">
        <div className="p-6 border-b-2 border-white/5 bg-black/40 flex justify-between items-center text-white">
          <p className="text-[12px] font-black uppercase tracking-widest text-primary italic">Alerts</p>
          <Link href="/notifications"><button className="text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors">View All</button></Link>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="divide-y-2 divide-white/5">
            {totalUnreadCount === 0 ? (
              <div className="p-16 text-center opacity-20 text-white">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4" />
                <p className="text-[12px] font-black uppercase tracking-[0.4em]">No alerts</p>
              </div>
            ) : (
              unreadNotifs?.slice(0, 5).map(notif => (
                <div key={notif.id} className="p-6 hover:bg-white/5 transition-all group cursor-pointer relative overflow-hidden text-white">
                  <h4 className="text-[13px] font-black uppercase italic text-white line-clamp-1">{notif.title}</h4>
                  <p className="text-[11px] text-white/40 mt-1.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );

  const renderAdminBtn = () => isAdmin && (
    <Button onClick={() => navigateTo('/admin', router)} variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl relative group shadow-xl">
      <Award className="w-6 h-6 text-yellow-400" />
    </Button>
  );

  const renderProfile = () => user ? (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-[13px] font-black uppercase italic text-white group-hover:text-primary transition-colors">{cleanDisplayName}</span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Active</span>
          </div>
          <div className="relative shrink-0">
            <RenderHat hatKey={userData?.hat} />
            <Avatar className="w-12 h-12 rounded-[1.2rem] bg-zinc-900 border-2 border-white/10 shadow-2xl transition-transform active:scale-95 group-hover:border-primary/50">
              <AvatarImage src={user.photoURL || ""} className="object-cover" />
              <AvatarFallback className="bg-primary text-white font-black text-xl">{cleanDisplayName?.[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2 glass-card rounded-[2.5rem] mt-6 border-4 border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden relative" align="end">
        {isSwitching && (
          <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center rounded-[2.5rem] backdrop-blur-sm">
             <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <div className="p-4 border-b-2 border-white/5 bg-black/40 mb-3 rounded-t-[1.5rem] text-white text-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Profiles ({accounts.length}/5)</p>
        </div>

        <div className="space-y-1 max-h-[200px] overflow-y-auto px-1.5">
          {accounts.map((acc: any) => (
            <div 
              key={acc.uid} 
              onClick={() => handleSwitchAccount(acc)}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/5",
                activeAccountId === acc.uid ? "bg-white/5 border border-white/10" : "border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-8 h-8 rounded-lg border border-white/10">
                  <AvatarImage src={acc.photoURL} />
                  <AvatarFallback className="bg-primary text-white text-xs font-black">{acc.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex flex-col text-left">
                  <span className="text-xs font-bold text-white truncate">{acc.displayName}</span>
                  <span className="text-[9px] text-white/40 truncate">{acc.email}</span>
                </div>
              </div>
              {activeAccountId === acc.uid && <Check className="w-4 h-4 text-primary shrink-0" />}
            </div>
          ))}
        </div>

        {accounts.length < 5 && (
          <button onClick={() => { navigateTo('/auth/add-acct', router); }} className="w-[calc(100%-12px)] mx-1.5 flex items-center justify-center gap-2 p-3 rounded-2xl hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-all border border-dashed border-primary/20 hover:border-primary/40 mt-1">
            <Plus className="w-4 h-4" /> Add Profile
          </button>
        )}

        <div className="h-0.5 bg-white/5 my-3 mx-1.5" />

        <div className="space-y-1 p-1.5 text-white">
           <button onClick={() => navigateTo('https://account.xakteir.com', router)} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-all text-left">
              <UserIcon className="w-4 h-4 text-primary" /> Profile
           </button>
           <button onClick={() => { auth && signOut(auth); localStorage.removeItem("xakteir_accounts"); localStorage.removeItem("xakteir_active_account_id"); window.dispatchEvent(new Event("xakteir-accounts-changed")); navigateTo('/', router); }} className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest text-rose-500 transition-all text-left">
              <LogOut className="w-4 h-4" /> Sign Out
           </button>
        </div>
      </PopoverContent>
    </Popover>
  ) : (
    <Link href="/auth"><Button className="bg-primary hover:bg-primary/90 h-14 px-12 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] text-white shadow-2xl border-b-8 border-primary/20 active:border-b-0 transition-all">Sign In</Button></Link>
  );

  const renderHamburgerLayout = () => (
    <>
      <div className="flex items-center gap-6 z-20">
        {renderLogo()}
      </div>
      <div className="flex items-center gap-4 z-20">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="w-12 h-12 bg-zinc-900/60 border-2 border-white/10 rounded-2xl shadow-xl">
              <Menu className="w-6 h-6 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-[#0a0a15] border-white/10 p-6 w-[400px] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col gap-8">
            <SheetHeader className="sr-only">
               <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                {renderProfile()}
              </div>
              <div className="flex items-center gap-4">
                {renderNotifications()}
                {renderAdminBtn()}
                {renderCommandBtn()}
                {renderFullscreenBtn()}
              </div>
              <div className="h-0.5 bg-white/10 w-full" />
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-widest text-white/40 mb-4">Apps</h3>
                <AppLauncherContent router={router} />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );

  const renderLeftLayout = () => (
    <>
      <div className="flex items-center gap-4 z-20">
        {renderAppsLauncher()}
        {renderCommandBtn()}
        {renderFullscreenBtn()}
        {renderNotifications()}
        {renderAdminBtn()}
        {renderProfile()}
      </div>
      <div className="flex items-center gap-6 z-20">
        {renderLogo()}
      </div>
    </>
  );

  const renderRightLayout = () => (
    <>
      <div className="flex items-center gap-6 z-20">
        {renderLogo()}
      </div>
      <div className="flex items-center gap-4 z-20">
        {renderAppsLauncher()}
        {renderCommandBtn()}
        {renderFullscreenBtn()}
        {renderNotifications()}
        {renderAdminBtn()}
        {renderProfile()}
      </div>
    </>
  );

  const renderGoogleLayout = () => (
    <>
      <div className="flex items-center gap-6 z-20">
        {renderLogo()}
      </div>
      <div className="flex items-center gap-4 z-20">
        {renderAppsLauncher()}
        {renderProfile()}
      </div>
    </>
  );

  const renderDefaultLayout = () => (
    <>
      <div className="flex items-center gap-6 z-20">
        {renderAppsLauncher()}
        {renderCommandBtn()}
        {renderFullscreenBtn()}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {renderLogo()}
      </div>
      <div className="flex items-center gap-6 z-20">
        {renderNotifications()}
        {renderAdminBtn()}
        {renderProfile()}
      </div>
    </>
  );

  const renderLayoutContent = () => {
    switch (headerStyle) {
      case 'hamburger':
        return renderHamburgerLayout();
      case 'left':
        return renderLeftLayout();
      case 'right':
        return renderRightLayout();
      case 'google':
        return renderGoogleLayout();
      case 'default':
      default:
        return renderDefaultLayout();
    }
  };

  return (
    <header className="h-20 bg-black/40 backdrop-blur-2xl sticky top-0 z-[100] px-10 border-b-2 border-white/10 shadow-[0_10px_50px_rgba(0,0,0,0.4)]">
      <div className="max-w-[1800px] mx-auto h-full flex items-center justify-between relative">
        {renderLayoutContent()}
      </div>
    </header>
  );
}
'''
    
    new_content = before_return + new_return
    with open('src/components/layout/Header.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully rewrote Header.tsx")
else:
    print("Could not find the return statement in Header.tsx")
