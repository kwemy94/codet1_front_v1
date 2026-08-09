import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Exécute un appel de service et expose { donnees, chargement, erreur, recharger }.
 *
 * Le compteur d'appels évite qu'une réponse lente écrase une réponse plus
 * récente lorsque l'utilisateur enchaîne les filtres.
 */
export function useRequete(appel, dependances = [], { actif = true } = {}) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(actif);
  const [erreur, setErreur] = useState(null);
  const numeroAppel = useRef(0);
  const monte = useRef(true);

  useEffect(() => {
    monte.current = true;
    return () => {
      monte.current = false;
    };
  }, []);

  const executer = useCallback(async () => {
    const numero = ++numeroAppel.current;
    setChargement(true);
    setErreur(null);

    try {
      const resultat = await appel();
      if (monte.current && numero === numeroAppel.current) {
        setDonnees(resultat);
      }
      return resultat;
    } catch (probleme) {
      if (monte.current && numero === numeroAppel.current) {
        setErreur(probleme);
      }
      return null;
    } finally {
      if (monte.current && numero === numeroAppel.current) {
        setChargement(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependances);

  useEffect(() => {
    if (actif) executer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executer, actif]);

  return { donnees, chargement, erreur, recharger: executer, setDonnees };
}

export default useRequete;
