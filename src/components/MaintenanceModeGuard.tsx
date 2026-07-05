"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFirestore, useUser, useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2, Wrench } from "lucide-react";

const SUPER_ADMIN_EMAILS = ["admin@xakteir.com", "admin2@xakteir.com"];

export function MaintenanceModeGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const systemSettingsRef = useMemoFirebase(() => {
    if (!mounted || !firestore) return null;
    return doc(firestore, "system_settings", "global");
  }, [mounted, firestore]);

  const { data: systemSettings, isLoading: isSettingsLoading } = useDoc(systemSettingsRef);

  const adminRoleRef = useMemoFirebase(() => {
    if (!mounted || !firestore || !user) return null;
    return doc(firestore, "admins", user.uid);
  }, [mounted, firestore, user]);

  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminRoleRef);

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email?.toLowerCase() || "");
  const hasAdminAccess = isSuperAdmin || !!adminRole;

  // We don't want to block the admin page so admins can turn it off!
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  // if (isUserLoading || isSettingsLoading || isAdminLoading) {
  // We should not block render for settings loading globally because it delays FCP,
  // but for maintenance mode we might want to flash the screen if true. 
  // Actually, we can just return children until loaded, and if maintenanceMode becomes true, we lock it.
  // }

  if (systemSettings?.maintenanceMode && !hasAdminAccess) {
    return (
      <div className="fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 mesh-background opacity-20" />
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] bg-[size:50px_50px]" />
        
        <div className="relative z-10 space-y-8 max-w-2xl mx-auto glass-card p-12 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-pulse">
            <Wrench className="w-12 h-12 text-rose-500" />
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">Maintenance</h1>
            <h2 className="text-2xl md:text-3xl font-black uppercase text-rose-500">System Offline</h2>
            <p className="text-muted-foreground font-medium text-lg italic max-w-lg mx-auto">
              Xakteir is currently undergoing scheduled maintenance or upgrades. Please check back later!
            </p>
          </div>
          
          <div className="pt-8 border-t border-white/10">
            <p className="text-[10px] uppercase font-black tracking-[0.3em] text-white/40">Only Administrators can bypass</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
