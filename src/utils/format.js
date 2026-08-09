import CONFIG from '@/config/env';

/** 10500 → « 10 500 FCFA ». Espaces insécables pour éviter les coupures. */
export function formaterMontant(valeur, { devise = true } = {}) {
  const nombre = Number(valeur ?? 0);
  const formate = nombre.toLocaleString('fr-FR').replace(/\u202f|\s/g, '\u00a0');
  return devise ? `${formate}\u00a0${CONFIG.DEVISE}` : formate;
}

export function formaterDate(valeur) {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formaterDateHeure(valeur) {
  if (!valeur) return '—';
  return new Date(valeur).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formaterPourcentage(valeur, decimales = 1) {
  return `${Number(valeur ?? 0).toFixed(decimales).replace('.', ',')}\u00a0%`;
}

export function initiales(nom = '', prenom = '') {
  return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase() || '?';
}

/** Applique les erreurs de validation renvoyées par Laravel au formulaire. */
export function appliquerErreursApi(erreurs, setError) {
  Object.entries(erreurs ?? {}).forEach(([champ, messages]) => {
    setError(champ, { type: 'server', message: Array.isArray(messages) ? messages[0] : messages });
  });
}
