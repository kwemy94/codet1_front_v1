import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * Tant que le mot de passe provisoire remis par le secrétariat n'a pas été
 * remplacé, toute navigation est renvoyée vers l'écran de changement.
 */
export default function GardeMotDePasse({ children }) {
  const { pathname } = useLocation();
  const doitChanger = useAuthStore((etat) => etat.utilisateur?.doit_changer_mot_de_passe);

  if (doitChanger && pathname !== '/mot-de-passe') {
    return <Navigate to="/mot-de-passe" replace />;
  }

  return children;
}
