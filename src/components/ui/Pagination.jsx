import Bouton from './Bouton';
import './ui.css';

export default function Pagination({ meta, surChangement }) {
  if (!meta || meta.last_page <= 1) return null;

  const { current_page: page, last_page: total, from, to, total: elements } = meta;

  return (
    <div className="pagination">
      <span className="pagination__info">
        {from}–{to} sur {elements}
      </span>

      <Bouton
        variante="contour"
        taille="petit"
        disabled={page <= 1}
        onClick={() => surChangement(page - 1)}
      >
        Précédent
      </Bouton>

      <span className="chiffre tenu">
        {page} / {total}
      </span>

      <Bouton
        variante="contour"
        taille="petit"
        disabled={page >= total}
        onClick={() => surChangement(page + 1)}
      >
        Suivant
      </Bouton>
    </div>
  );
}
