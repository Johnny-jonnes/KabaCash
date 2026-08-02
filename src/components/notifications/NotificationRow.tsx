'use client';

import { AlertTriangle, AlertCircle, Info, TrendingUp, Trash2, Wallet, PiggyBank, Sparkles, Trophy } from 'lucide-react';
import { useItemGestures } from '@/hooks/useItemGestures';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { DBNotification } from '@/types/database';
import type { NotificationKind, NotificationTone } from '@/types/enums';

const TONE_STYLES: Record<NotificationTone, { classes: string; iconClasses: string }> = {
  critical: { classes: 'border-status-critical/30 bg-status-critical/5', iconClasses: 'text-status-critical bg-status-critical/10' },
  warning: { classes: 'border-status-warning/30 bg-status-warning/5', iconClasses: 'text-status-warning bg-status-warning/10' },
  positive: { classes: 'border-income/30 bg-income/5', iconClasses: 'text-income bg-income/10' },
  info: { classes: 'border-border bg-muted/20', iconClasses: 'text-muted-foreground bg-muted' },
};

const KIND_ICON: Record<NotificationKind, typeof Info> = {
  budget_alert: AlertTriangle,
  account_alert: Wallet,
  forecast: TrendingUp,
  advice: Sparkles,
  anomaly: AlertCircle,
  new_saving: PiggyBank,
  goal_reached: Trophy,
};

export function NotificationRow({ notification, onOpen, onDismiss }: {
  notification: DBNotification;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  const { translateX, handlers } = useItemGestures({ onSwipeLeft: onDismiss });
  const style = TONE_STYLES[notification.tone];
  const Icon = KIND_ICON[notification.kind];
  const isUnread = !notification.read_at;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-end px-4">
        <div className={`flex items-center gap-1.5 text-destructive transition-opacity duration-150 ${translateX < 0 ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-xs font-medium">Supprimer</span><Trash2 className="w-4 h-4" />
        </div>
      </div>
      <button
        {...handlers}
        onClick={onOpen}
        style={{ transform: `translateX(${translateX}px)`, transition: translateX === 0 ? 'transform 200ms ease-out' : 'none' }}
        className={`relative w-full text-left p-3 rounded-xl border flex items-start gap-3 touch-pan-y select-none transition-shadow hover:shadow-sm ${style.classes} ${isUnread ? '' : 'opacity-60'}`}
      >
        <div className={`p-1.5 rounded-lg shrink-0 ${style.iconClasses}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            <p className="text-sm font-semibold leading-tight truncate">{notification.title}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{notification.body}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
          </p>
        </div>
      </button>
    </div>
  );
}
