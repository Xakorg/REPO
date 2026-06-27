import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoltraPlay Hardware Simulation',
  description: 'Physical Hardware Web Simulation',
}

export default function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex items-center justify-center font-sans overflow-hidden z-[9999]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.05)_0%,transparent_70%)] pointer-events-none"></div>
      {children}
    </div>
  )
}
