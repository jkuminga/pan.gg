'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type Option = { id: string; label: string; subtitle: string; href: string };

export default function PlayerPicker({ selected, options }: { selected: string; options: Option[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return <div className="stats-player-picker" ref={root}
    onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    onFocus={() => setOpen(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}
    onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); } }}>
    <button type="button" aria-expanded={open} aria-controls="stats-player-options" onClick={() => setOpen(true)}>
      <span>플레이어 선택</span><strong>{selected}</strong><span aria-hidden="true">⌄</span>
    </button>
    {open && <div className="stats-player-options" id="stats-player-options" aria-label="플레이어 목록">
      {options.map(option => <Link href={option.href} key={option.id} onClick={() => setOpen(false)}>
        <strong>{option.label}</strong><small>{option.subtitle}</small>
      </Link>)}
    </div>}
  </div>;
}
