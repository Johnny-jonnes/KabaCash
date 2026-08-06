'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/dexie';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronDown, CheckCheck, Trash2 } from 'lucide-react';
import { markNotificationRead, markAllNotificationsRead, dismissNotification, deleteAllReadNotifications } from '@/lib/notifications/notificationActions';
import { useAuthStore } from '@/stores/authStore';
import { NotificationRow } from '@/components/notifications/NotificationRow';
import { toast } from 'sonner';

const PAGE_SIZE = 20;

export default function AlertsPage() {
  const { user } = useAuthStore();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allNotifications = useLiveQuery(() => db.notifications.orderBy('created_at').reverse().toArray()) || [];
  const notifications = allNotifications.filter(n => !n.deleted_at);
  const unreadCount = notifications.filter(n => !n.read_at).length;
  const readCount = notifications.length - unreadCount;

  // Non lues d'abord, puis par date décroissante dans chaque groupe
  const sorted = [...notifications].sort((a, b) => {
    if (!!a.read_at !== !!b.read_at) return a.read_at ? 1 : -1;
    return b.created_at.localeCompare(a.created_at);
  });
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const router = useRouter();

  const handleOpen = async (notificationId: string, href?: string) => {
    await markNotificationRead(notificationId);
    if (href) router.push(href);
  };

  const handleDeleteRead = async () => {
    if (!user) return;
    const count = await deleteAllReadNotifications(user.id);
    toast.success(`${count} notification${count > 1 ? 's' : ''} lue${count > 1 ? 's' : ''} supprimée${count > 1 ? 's' : ''}`);
  };

  return (
    <>
      <Header title="Notifications" showBack />
      <div className="p-4 space-y-4">

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 text-income mb-4" />
            <p className="font-semibold text-lg text-foreground">Tout est en ordre !</p>
            <p className="text-sm mt-1 text-center">Aucune notification pour le moment.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground shrink-0">
                {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && user && (
                  <button
                    onClick={() => markAllNotificationsRead(user.id)}
                    className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout marquer comme lu
                  </button>
                )}
                {readCount > 0 && (
                  <button
                    onClick={handleDeleteRead}
                    className="flex items-center gap-1 text-xs text-muted-foreground font-medium hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer les lues
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {visible.map(notification => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={() => handleOpen(notification.id, notification.href)}
                  onDismiss={() => dismissNotification(notification.id)}
                />
              ))}
            </div>

            {hasMore && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              >
                <ChevronDown className="w-4 h-4" />
                Afficher plus ({sorted.length - visibleCount} restantes)
              </Button>
            )}
          </>
        )}

      </div>
    </>
  );
}
