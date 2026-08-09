import { create } from 'zustand';

let compteur = 0;

export const useNotificationStore = create((set, get) => ({
  notifications: [],

  ajouter(message, ton = 'info', duree = 4500) {
    const id = ++compteur;
    set((etat) => ({ notifications: [...etat.notifications, { id, message, ton }] }));
    setTimeout(() => get().retirer(id), duree);
    return id;
  },

  succes: (message) => get().ajouter(message, 'succes'),
  alerte: (message) => get().ajouter(message, 'alerte', 6000),

  retirer(id) {
    set((etat) => ({ notifications: etat.notifications.filter((n) => n.id !== id) }));
  },
}));

/** Raccourci utilisable hors composant (services, gestionnaires d'erreur). */
export const notifier = {
  succes: (message) => useNotificationStore.getState().succes(message),
  alerte: (message) => useNotificationStore.getState().alerte(message),
  info: (message) => useNotificationStore.getState().ajouter(message),
};

export default useNotificationStore;
