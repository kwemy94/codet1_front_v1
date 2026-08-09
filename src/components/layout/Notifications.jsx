import { useNotificationStore } from '@/store/notificationStore';
import '@/components/ui/ui.css';

export default function Notifications() {
  const notifications = useNotificationStore((etat) => etat.notifications);
  const retirer = useNotificationStore((etat) => etat.retirer);

  if (!notifications.length) return null;

  return (
    <div className="notifications" role="status" aria-live="polite">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification notification--${notification.ton}`}>
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button
            type="button"
            className="bouton bouton--discret bouton--petit"
            onClick={() => retirer(notification.id)}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
