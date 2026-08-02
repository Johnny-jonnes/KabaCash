'use client';

import Link from 'next/link';
import { TrendingUp, AlertTriangle, AlertCircle, Info, ArrowRight, Sparkles } from 'lucide-react';
import type { Insight, InsightTone } from '@/lib/insights/generate';

const TONE_STYLES: Record<InsightTone, { icon: typeof Info; classes: string; iconClasses: string }> = {
  critical: { icon: AlertCircle, classes: 'border-status-critical/30 bg-status-critical/5', iconClasses: 'text-status-critical bg-status-critical/10' },
  warning: { icon: AlertTriangle, classes: 'border-status-warning/30 bg-status-warning/5', iconClasses: 'text-status-warning bg-status-warning/10' },
  positive: { icon: TrendingUp, classes: 'border-income/30 bg-income/5', iconClasses: 'text-income bg-income/10' },
  info: { icon: Info, classes: 'border-border bg-muted/20', iconClasses: 'text-muted-foreground bg-muted' },
};

export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">À savoir aujourd&apos;hui</h3>
      </div>
      {insights.slice(0, 4).map((insight, i) => {
        const style = TONE_STYLES[insight.tone];
        const Icon = style.icon;
        const content = (
          <div
            className={`p-3 rounded-xl border flex items-start gap-3 transition-all hover:shadow-sm active:scale-[0.99] duration-150 animate-in fade-in slide-in-from-bottom-1 ${style.classes}`}
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
          >
            <div className={`p-1.5 rounded-lg shrink-0 ${style.iconClasses}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold leading-tight">{insight.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{insight.body}</p>
            </div>
            {insight.href && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-1" />}
          </div>
        );
        return insight.href ? (
          <Link key={insight.id} href={insight.href} className="block">{content}</Link>
        ) : (
          <div key={insight.id}>{content}</div>
        );
      })}
    </div>
  );
}
