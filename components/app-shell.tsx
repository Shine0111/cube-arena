'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Boxes, ChevronDown, CircleUserRound, Menu, Trophy, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Boxes },
  { href: '/rooms/join', label: 'Multiplayer Rooms', icon: Activity },
  { href: '/rankings', label: 'Global Rankings', icon: Trophy },
  { href: '/profile', label: 'Profile', icon: CircleUserRound },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  return <>
    <header className="topbar">
      <Link className="brand" href="/" aria-label="Cube Arena home">
        <span className="brand-mark"><Boxes size={21} strokeWidth={2.2}/></span>
        <span><strong>CUBE ARENA</strong><small><i/> MULTIPLAYER SPEEDCUBING</small></span>
      </Link>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X/> : <Menu/>}</button>
      <nav className={menuOpen ? 'nav-links nav-open' : 'nav-links'}>
        {navItems.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${pathname === href || (href !== '/' && pathname.startsWith(href)) ? 'active' : ''}`}><Icon size={16}/>{label}</Link>)}
      </nav>
      <div className="top-actions"><span className="connection"><i/> SYSTEM ONLINE</span><Link className="avatar" href="/profile" aria-label="Open profile">S</Link><ChevronDown size={14} className="muted-icon"/></div>
    </header>
    <main className="main-shell">{children}</main>
    <footer className="footer"><span>© 2026 CUBE ARENA</span><span>COMMUNITY RANKINGS · NOT OFFICIAL WCA RESULTS</span><span>BUILD 0.1.0</span></footer>
  </>;
}
