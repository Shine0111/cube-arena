import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'CUBE ARENA — Competitive Speedcubing',
  description: 'Compete, solve, and climb the CUBE ARENA community rankings.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark"><body><AppShell>{children}</AppShell></body></html>;
}
