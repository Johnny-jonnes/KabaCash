'use client';

import { Delete } from 'lucide-react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'] as const;

export function NumericKeypad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {KEYS.map(k => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          className="h-14 rounded-xl bg-muted text-xl font-semibold flex items-center justify-center transition-transform active:scale-90 active:bg-muted/70 duration-100"
        >
          {k === 'backspace' ? <Delete className="w-5 h-5" /> : k}
        </button>
      ))}
    </div>
  );
}
