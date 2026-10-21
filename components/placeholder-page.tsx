import Link from 'next/link';
import { ArrowLeft, Construction } from 'lucide-react';

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <section className="panel" style={{ padding: 'clamp(22px, 5vw, 48px)', minHeight: '48vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 850, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: 'var(--green)', font: "500 10px 'JetBrains Mono'", letterSpacing: '.1em', marginBottom: 18 }}><Construction size={16}/> MILESTONE SCAFFOLD</div>
    <h1 style={{ font: "700 clamp(28px, 4vw, 42px)/1.1 'Space Grotesk'", margin: '0 0 12px' }}>{title}</h1>
    <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: 14, maxWidth: 600 }}>{description}</p>
    <p style={{ color: 'var(--muted)', fontSize: 12, lineHeight: 1.7, marginTop: 18 }}>This route is scaffolded so the app structure is ready. Its feature logic will be added in the relevant project milestone.</p>
    <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 26, color: 'var(--green)', font: "600 11px 'JetBrains Mono'" }}><ArrowLeft size={15}/> BACK TO DASHBOARD</Link>
  </section>;
}
