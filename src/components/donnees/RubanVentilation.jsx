import { formaterMontant } from '@/utils/format';
import './donnees.css';

/*
 * Les destinations se lisent comme un dégradé de cuve d'indigo : du plus foncé
 * (village) au plus clair (congrès), l'écru sombre pour le compte du comité.
 * C'est la logique même d'un Ndop, où le motif naît des nuances de teinture.
 */
const COULEURS = {
  VILLAGE: 'var(--village)',
  GROUPEMENT: 'var(--groupement)',
  CONGRES: 'var(--congres)',
  CODET: 'var(--codet)',
};

const LIBELLES = {
  VILLAGE: 'Village',
  GROUPEMENT: 'Groupement',
  CONGRES: 'Congrès',
  CODET: 'CODET I',
};

/** Repli pour les destinations créées par le comité : nuances de la même cuve. */
const TEINTES = ['#1e3462', '#3c5c96', '#8aa3ca', '#a89a7c', '#243d70', '#5878ad'];

function couleurDe(code) {
  if (COULEURS[code]) return COULEURS[code];

  const empreinte = [...code].reduce((total, lettre) => total + lettre.charCodeAt(0), 0);
  return TEINTES[empreinte % TEINTES.length];
}

/**
 * Ruban de ventilation — élément signature de l'interface.
 *
 * Chaque franc encaissé est réparti entre le village, le groupement et le
 * congrès. Ce ruban rend cette répartition visible partout où un montant
 * apparaît : sur une carte annuelle, sur un paiement, sur le tableau de bord.
 * La part « groupement » est celle qui porte le reversement de 20 % au CODET I.
 */
export default function RubanVentilation({ parts = {}, hauteur = 8, legende = true, compact = false }) {
  const entrees = Object.entries(parts).filter(([, montant]) => Number(montant) > 0);
  const total = entrees.reduce((somme, [, montant]) => somme + Number(montant), 0);

  if (!total) {
    return <p className="tenu">Aucune ventilation enregistrée.</p>;
  }

  return (
    <div className="ruban-bloc">
      <div className="ruban" style={{ height: hauteur }} role="img" aria-label="Répartition des fonds">
        {entrees.map(([code, montant]) => (
          <span
            key={code}
            className="ruban__part"
            style={{
              width: `${(Number(montant) / total) * 100}%`,
              background: couleurDe(code),
            }}
            title={`${LIBELLES[code] ?? code} — ${formaterMontant(montant)}`}
          />
        ))}
      </div>

      {legende && (
        <ul className={`ruban__legende ${compact ? 'ruban__legende--compact' : ''}`}>
          {entrees.map(([code, montant]) => (
            <li key={code}>
              <span className="ruban__puce" style={{ background: couleurDe(code) }} />
              <span className="ruban__nom">{LIBELLES[code] ?? code}</span>
              <span className="chiffre ruban__valeur">{formaterMontant(montant, { devise: false })}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
