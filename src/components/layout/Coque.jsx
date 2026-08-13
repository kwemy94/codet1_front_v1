import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Rail from './Rail';
import Notifications from './Notifications';
import { exerciceService } from '@/services';
import Bouton from '@/components/ui/Bouton';
import './layout.css';

/** Ossature de l'application : rail de navigation, barre haute, contenu. */
export default function Coque() {
  const [railOuvert, setRailOuvert] = useState(false);
  const [exercice, setExercice] = useState(null);
  const emplacement = useLocation();

  useEffect(() => {
    exerciceService
      .courant()
      .then((resultat) => setExercice(resultat?.annee ?? null))
      .catch(() => setExercice(null));
  }, []);

  useEffect(() => {
    setRailOuvert(false);
  }, [emplacement.pathname]);

  return (
    <div className="coque">
      <Rail ouvert={railOuvert} surFermeture={() => setRailOuvert(false)} exercice={exercice} />

      {railOuvert && <div className="rideau" onClick={() => setRailOuvert(false)} />}

      <div className="zone">
        <header className="barre-haute">
          <Bouton
            variante="contour"
            taille="petit"
            className="bouton-rail"
            onClick={() => setRailOuvert((ouvert) => !ouvert)}
            aria-label="Ouvrir la navigation"
          >
            ☰
          </Bouton>
          <TitrePage />
        </header>

        <main className="contenu" key={emplacement.pathname}>
          <div className="apparait">
            <Outlet context={{ exercice }} />
          </div>
        </main>
      </div>

      <Notifications />
    </div>
  );
}

const TITRES = {
  '/': 'Tableau de bord',
  '/membres': 'Membres',
  '/cartes': 'Cartes annuelles de développement',
  '/cartes/impression': 'Carte unique de développement',
  '/paiements': 'Paiements',
  '/contributions': 'Contributions et dons',
  '/reversement': 'Reversement au CODET I',
  '/rapports-ag': "Rapports d'Assemblée Générale",
  '/messages': 'Messages',
  '/courriels': 'Courriels aux membres',
  '/tarifs': 'Tarifs et exercices',
  '/parametres': 'Paramètres',
  '/journal': 'Journal des actions',
  '/mot-de-passe': 'Mot de passe',
  '/mon-espace': 'Mon espace',
  '/mon-espace/paiements': 'Mes paiements',
};

function TitrePage() {
  const { pathname } = useLocation();
  const cle = Object.keys(TITRES)
    .sort((a, b) => b.length - a.length)
    .find((chemin) => pathname === chemin || pathname.startsWith(`${chemin}/`));

  return <h1>{TITRES[cle] ?? 'CODET I'}</h1>;
}
