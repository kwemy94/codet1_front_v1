import Bouton from './Bouton';
import './ui.css';

/** Écran vide : toujours une invitation à agir, jamais un simple constat. */
export function Vide({ titre, texte, action }) {
  return (
    <div className="vide">
      <p className="vide__titre">{titre}</p>
      {texte && <p className="tenu" style={{ maxWidth: 380 }}>{texte}</p>}
      {action}
    </div>
  );
}

export function Erreur({ message, surReessai }) {
  return (
    <div className="message message--alerte">
      <div style={{ flex: 1 }}>{message}</div>
      {surReessai && (
        <Bouton variante="discret" taille="petit" onClick={surReessai}>
          Réessayer
        </Bouton>
      )}
    </div>
  );
}

export function Chargement({ lignes = 4 }) {
  return (
    <div className="pile" aria-busy="true" aria-live="polite">
      {Array.from({ length: lignes }).map((_, index) => (
        <div
          key={index}
          className="squelette"
          style={{ width: `${100 - index * 7}%`, height: index === 0 ? 22 : 14 }}
        />
      ))}
    </div>
  );
}
