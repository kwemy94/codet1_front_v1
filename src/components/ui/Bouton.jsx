import './ui.css';

/**
 * Bouton de l'interface. `chargement` bloque le double envoi et remplace
 * l'icône par un indicateur, sans changer la largeur du bouton.
 */
export default function Bouton({
  children,
  variante = 'principal',
  taille,
  chargement = false,
  disabled,
  className = '',
  ...reste
}) {
  const classes = [
    'bouton',
    `bouton--${variante}`,
    taille === 'petit' ? 'bouton--petit' : '',
    taille === 'large' ? 'bouton--large' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled || chargement} {...reste}>
      {chargement && <span className="rotation" aria-hidden="true" />}
      {children}
    </button>
  );
}
