import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { useUnreadCount } from '@/api/queries';
import { it } from '@/i18n/it';

export function NotificationBell() {
  const { data } = useUnreadCount(true);
  const count = data?.count ?? 0;
  return (
    <Link
      to="/app/notifiche"
      aria-label={it.nav.notificationsUnread(count)}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-fg hover:bg-sunken"
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-surface"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
