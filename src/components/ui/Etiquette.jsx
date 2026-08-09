import './ui.css';

const TONS = {
  soldee: 'succes',
  valide: 'succes',
  actif: 'succes',
  publie: 'succes',
  encaissee: 'succes',
  partielle: 'attente',
  initie: 'attente',
  en_attente: 'attente',
  attendue: 'attente',
  brouillon: 'attente',
  nouveau: 'attente',
  en_cours: 'attente',
  impayee: 'alerte',
  echoue: 'alerte',
  annule: 'alerte',
  annulee: 'alerte',
  suspendu: 'alerte',
  decede: 'neutre',
  inactif: 'neutre',
  archive: 'neutre',
  cloture: 'neutre',
  traite: 'primaire',
  ouvert: 'primaire',
  provisoire: 'attente',
};

const LIBELLES = {
  soldee: 'Soldée',
  partielle: 'Partielle',
  impayee: 'Impayée',
  valide: 'Validé',
  initie: 'En attente',
  echoue: 'Échoué',
  annule: 'Annulé',
  annulee: 'Annulée',
  actif: 'Actif',
  inactif: 'Inactif',
  decede: 'Décédé',
  publie: 'Publié',
  brouillon: 'Brouillon',
  archive: 'Archivé',
  nouveau: 'Nouveau',
  en_cours: 'En cours',
  traite: 'Traité',
  ouvert: 'Ouvert',
  cloture: 'Clôturé',
  attendue: 'Attendue',
  encaissee: 'Encaissée',
  provisoire: 'Provisoire',
};

/** Étiquette de statut : le ton découle du statut, jamais choisi à la main. */
export default function Etiquette({ statut, ton, children }) {
  const tonFinal = ton ?? TONS[statut] ?? 'neutre';

  return (
    <span className={`etiquette etiquette--${tonFinal}`}>
      {children ?? LIBELLES[statut] ?? statut}
    </span>
  );
}
