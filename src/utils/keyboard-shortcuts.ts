/**
 * Global keyboard shortcuts for iSCARB.
 * Register shortcuts via useEffect in the root layout.
 */

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  descriptionAr: string;
  action: () => void;
}

export function registerShortcuts(shortcuts: Shortcut[]) {
  const handler = (e: KeyboardEvent) => {
    for (const s of shortcuts) {
      const ctrlMatch = s.ctrl ? (e.metaKey || e.ctrlKey) : !(e.metaKey || e.ctrlKey);
      const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = s.alt ? e.altKey : !e.altKey;
      if (e.key.toLowerCase() === s.key.toLowerCase() && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        s.action();
        return;
      }
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}
