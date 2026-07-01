import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Xakteir Weather',
  description: 'Live, real-time meteorological dashboard.',
  manifest: '/manifest-weather.json',
  themeColor: '#09090b',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Xakteir Weather',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
