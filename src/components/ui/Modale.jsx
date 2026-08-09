import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Bouton from './Bouton';
import './ui.css';

/**
 * Modale rendue dans un portail attaché à <body>.
 *
 * Le portail est indispensable : le conteneur de page applique une animation
 * de transform, ce qui crée un contexte d'empilement. Une modale rendue à
 * l'intérieur y resterait piégée et passerait sous la barre haute, quel que
 * soit son z-index.
 */
export default function Modale({ titre, ouverte, surFermeture, children, pied, large = false }) {
  useEffect(() => {
    if (!ouverte) return undefined;

    const surTouche = (evenement) => {
      if (evenement.key === 'Escape') surFermeture?.();
    };

    const defilementInitial = document.body.style.overflow;
    document.addEventListener('keydown', surTouche);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', surTouche);
      document.body.style.overflow = defilementInitial;
    };
  }, [ouverte, surFermeture]);

  if (!ouverte) return null;

  return createPortal(
    <div className="voile" role="dialog" aria-modal="true" aria-label={titre} onMouseDown={surFermeture}>
      <div
        className={`modale ${large ? 'modale--large' : ''}`}
        onMouseDown={(evenement) => evenement.stopPropagation()}
      >
        <header className="modale__tete">
          <h3>{titre}</h3>
          <Bouton variante="discret" taille="petit" onClick={surFermeture} aria-label="Fermer">
            ✕
          </Bouton>
        </header>

        <div className="modale__corps">{children}</div>

        {pied && <footer className="modale__pied">{pied}</footer>}
      </div>
    </div>,
    document.body,
  );
}
