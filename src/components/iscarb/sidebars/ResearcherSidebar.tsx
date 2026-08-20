'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [
  { href: '/research-os/dashboard', label: 'Dashboard' },
  { href: '/research-os/projects', label: 'Projects' },
  { href: '/research-os/publications', label: 'Publications' },
  { href: '/research-os/dashboard', label: 'Grants' },
];
export function ResearcherSidebar() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={`block rounded-lg px-3 py-2 text-sm transition-colors ${pathname === l.href ? 'bg-[#0E6C3C]/10 text-[#0E6C3C] font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
