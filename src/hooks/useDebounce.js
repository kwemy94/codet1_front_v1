import { useEffect, useState } from 'react';

/** Retarde la propagation d'une valeur — utilisé par les champs de recherche. */
export function useDebounce(valeur, delai = 350) {
  const [valeurRetardee, setValeurRetardee] = useState(valeur);

  useEffect(() => {
    const minuteur = setTimeout(() => setValeurRetardee(valeur), delai);
    return () => clearTimeout(minuteur);
  }, [valeur, delai]);

  return valeurRetardee;
}

export default useDebounce;
