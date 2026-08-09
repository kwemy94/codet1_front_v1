import { NavLink } from 'react-router-dom';
import CONFIG from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { initiales } from '@/utils/format';
import Bouton from '@/components/ui/Bouton';
import './layout.css';

const ADMINISTRATION = [
  { vers: '/', libelle: 'Tableau de bord', glyphe: '◆', exact: true },
  { vers: '/membres', libelle: 'Membres', glyphe: '☰' },
  { vers: '/cartes', libelle: 'Cartes annuelles', glyphe: '▤' },
  { vers: '/paiements', libelle: 'Paiements', glyphe: '⇄' },
  { vers: '/contributions', libelle: 'Contributions et dons', glyphe: '✦' },
  { vers: '/reversement', libelle: 'Reversement CODET I', glyphe: '％' },
];

const COMITE = [
  { vers: '/rapports-ag', libelle: "Rapports d'AG", glyphe: '▥' },
  { vers: '/messages', libelle: 'Messages', glyphe: '✉' },
];

const REGLAGES = [
  { vers: '/tarifs', libelle: 'Tarifs et exercices', glyphe: '⚖' },
  { vers: '/parametres', libelle: 'Paramètres', glyphe: '⚙' },
  { vers: '/journal', libelle: 'Journal des actions', glyphe: '⟲' },
];

const ESPACE_MEMBRE = [
  { vers: '/mon-espace', libelle: 'Mon espace', glyphe: '◆', exact: true },
  { vers: '/mon-espace/paiements', libelle: 'Mes paiements', glyphe: '⇄' },
  { vers: '/rapports-ag', libelle: "Rapports d'AG", glyphe: '▥' },
  { vers: '/messages', libelle: 'Écrire au comité', glyphe: '✉' },
  { vers: '/mot-de-passe', libelle: 'Mot de passe', glyphe: '⚿' },
];

function Groupe({ titre, liens, surNavigation }) {
  return (
    <>
      <p className="rail__section">{titre}</p>
      {liens.map((lien) => (
        <NavLink
          key={lien.vers + lien.libelle}
          to={lien.vers}
          end={lien.exact}
          onClick={surNavigation}
          className={({ isActive }) => `lien ${isActive ? 'lien--actif' : ''}`}
        >
          <span className="lien__glyphe" aria-hidden="true">{lien.glyphe}</span>
          {lien.libelle}
        </NavLink>
      ))}
    </>
  );
}

export default function Rail({ ouvert, surFermeture, exercice }) {
  const utilisateur = useAuthStore((etat) => etat.utilisateur);
  const deconnexion = useAuthStore((etat) => etat.deconnexion);
  const estAdmin = Boolean(utilisateur?.est_administrateur);
  const membre = utilisateur?.membre;

  return (
    <aside className={`rail ${ouvert ? 'rail--ouvert' : ''}`}>
      <div className="rail__marque">
        <span className="rail__sceau">CD</span>
        <span>
          <span className="rail__nom">{CONFIG.NOM_COMITE}</span>
          <span className="rail__exercice">
            {exercice ? `Exercice ${exercice}` : 'Aucun exercice ouvert'}
          </span>
        </span>
      </div>

      <nav className="rail__nav">
        {estAdmin ? (
          <>
            <Groupe titre="Gestion" liens={ADMINISTRATION} surNavigation={surFermeture} />
            <Groupe titre="Comité" liens={COMITE} surNavigation={surFermeture} />
            <Groupe titre="Réglages" liens={REGLAGES} surNavigation={surFermeture} />
          </>
        ) : (
          <Groupe titre="Mon compte" liens={ESPACE_MEMBRE} surNavigation={surFermeture} />
        )}
      </nav>

      <div className="rail__pied">
        <div className="rail__compte">
          <span className="jeton-initiales">
            {initiales(membre?.nom ?? utilisateur?.nom_affichage ?? '', membre?.prenom ?? '')}
          </span>
          <span className="rail__identite">
            <strong>{membre?.nom_complet ?? utilisateur?.nom_affichage}</strong>
            <span className="tenu chiffre">{membre?.matricule ?? 'Administration'}</span>
          </span>
        </div>
        <Bouton variante="discret" taille="petit" onClick={deconnexion} className="bouton--large">
          Se déconnecter
        </Bouton>
      </div>
    </aside>
  );
}
