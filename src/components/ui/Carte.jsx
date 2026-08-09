import './ui.css';

export function Carte({ titre, action, children, serree = false, className = '' }) {
  return (
    <section className={`carte ${serree ? 'carte--serree' : ''} ${className}`}>
      {(titre || action) && (
        <header className="carte__tete">
          {titre && <h3>{titre}</h3>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export default Carte;
