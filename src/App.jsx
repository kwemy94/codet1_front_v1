import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { routes } from './routes';
import { useAuthStore } from '@/store/authStore';

export default function App() {
  const restaurer = useAuthStore((etat) => etat.restaurer);

  // Revalide le jeton conservé avant d'afficher quoi que ce soit de protégé.
  useEffect(() => {
    restaurer();
  }, [restaurer]);

  return <RouterProvider router={routes} />;
}
