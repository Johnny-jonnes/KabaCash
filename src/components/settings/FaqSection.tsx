interface FaqEntry {
  q: string;
  a: string;
}

interface FaqSectionProps {
  title: string;
  items: FaqEntry[];
}

const Chevron = () => (
  <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20" className="shrink-0">
    <path d="M6 9l6 6 6-6"></path>
  </svg>
);

/** Un groupe de questions/réponses repliables — voir HelpPage pour le guide complet de l'app. */
export function FaqSection({ title, items }: FaqSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => (
          <details key={item.q} className="bg-card border border-border rounded-xl p-4 shadow-sm group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between gap-2 font-medium cursor-pointer text-sm">
              {item.q}
              <span className="transition group-open:rotate-180"><Chevron /></span>
            </summary>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed whitespace-pre-line">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
