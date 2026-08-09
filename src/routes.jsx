import { createBrowserRouter, Navigate } from 'react-router-dom';
import Coque from '@/components/layout/Coque';
import RouteProtegee from '@/components/layout/RouteProtegee';
import GardeMotDePasse from '@/components/layout/GardeMotDePasse';

import Connexion from '@/pages/Connexion';
import TableauDeBord from '@/pages/TableauDeBord';
import ListeMembres from '@/pages/membres/ListeMembres';
import FicheMembre from '@/pages/membres/FicheMembre';
import Cartes from '@/pages/cotisations/Cartes';
import CarteImprimable from '@/pages/cotisations/CarteImprimable';
import Tarifs from '@/pages/cotisations/Tarifs';
import Paiements from '@/pages/finances/Paiements';
import Reversement from '@/pages/finances/Reversement';
import Contributions from '@/pages/Contributions';
import RapportsAg from '@/pages/documents/RapportsAg';
import Messages from '@/pages/Messages';
import MonEspace from '@/pages/espace/MonEspace';
import MesPaiements from '@/pages/espace/MesPaiements';
import MotDePasse from '@/pages/MotDePasse';
import Parametres from '@/pages/Parametres';
import Journal from '@/pages/Journal';
import NonTrouve from '@/pages/NonTrouve';

/** Routes réservées à la gestion : le serveur reste seul juge des droits. */
const gestion = (element) => <RouteProtegee reserveeAdministration>{element}</RouteProtegee>;

export const routes = createBrowserRouter([
  { path: '/connexion', element: <Connexion /> },

  {
    path: '/',
    element: (
      <RouteProtegee>
        <GardeMotDePasse>
          <Coque />
        </GardeMotDePasse>
      </RouteProtegee>
    ),
    children: [
      { index: true, element: gestion(<TableauDeBord />) },

      { path: 'membres', element: gestion(<ListeMembres />) },
      { path: 'membres/:id', element: gestion(<FicheMembre />) },
      { path: 'cartes', element: gestion(<Cartes />) },
      // Accessible au membre pour sa propre carte : le serveur vérifie la propriété.
      { path: 'cartes/:id/impression', element: <CarteImprimable /> },
      { path: 'paiements', element: gestion(<Paiements />) },
      { path: 'contributions', element: gestion(<Contributions />) },
      { path: 'reversement', element: gestion(<Reversement />) },
      { path: 'tarifs', element: gestion(<Tarifs />) },
      { path: 'parametres', element: gestion(<Parametres />) },
      { path: 'journal', element: gestion(<Journal />) },

      { path: 'rapports-ag', element: <RapportsAg /> },
      { path: 'messages', element: <Messages /> },

      { path: 'mot-de-passe', element: <MotDePasse /> },

      { path: 'mon-espace', element: <MonEspace /> },
      { path: 'mon-espace/paiements', element: <MesPaiements /> },

      { path: '404', element: <NonTrouve /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

export default routes;
