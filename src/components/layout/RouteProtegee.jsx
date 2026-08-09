import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Chargement } from '@/components/ui/Etats';

/**
 * Garde de route. `reserveeAdministration` protège les écrans de gestion ;
 * le serveur reste la source de vérité, ce contrôle évite seulement d'afficher
 * un écran auquel l'utilisateur n'a pas droit.
 */
export default function RouteProtegee({ children, reserveeAdministration = false }) {
  const emplacement = useLocation();
  const jeton = useAuthStore((etat) => etat.jeton);
  const pret = useAuthStore((etat) => etat.pretDemarrage);
  const utilisateur = useAuthStore((etat) => etat.utilisateur);

  if (!pret) {
    return (
      <div style={{ padding: 'var(--e-6)', maxWidth: 560, margin: '0 auto' }}>
        <Chargement lignes={5} />
      </div>
    );
  }

  if (!jeton) {
    return <Navigate to="/connexion" state={{ depuis: emplacement.pathname }} replace />;
  }

  if (reserveeAdministration && !utilisateur?.est_administrateur) {
    return <Navigate to="/mon-espace" replace />;
  }

  return children;
}
