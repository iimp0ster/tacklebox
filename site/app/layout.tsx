import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tacklebox — AiTM Emulation Field Guide',
  description: 'A lab-safe field guide to AiTM kit behavior, atomic emulation, TTP overlap, and infrastructure.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
