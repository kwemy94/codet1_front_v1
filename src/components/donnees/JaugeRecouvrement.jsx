import { formaterPourcentage } from '@/utils/format';
import './donnees.css';

/** Taux de paiement de l'exercice : une seule barre, lisible d'un coup d'œil. */
export default function JaugeRecouvrement({ taux = 0, aJour = 0, enRetard = 0 }) {
  return (
    <div className="jauge-bloc">
      <div className="rang rang--entre">
        <span className="chiffre jauge__taux">{formaterPourcentage(taux)}</span>
        <span className="tenu">
          {aJour} à jour · {enRetard} en retard
        </span>
      </div>

      <div className="jauge" role="img" aria-label={`Taux de paiement : ${formaterPourcentage(taux)}`}>
        <span className="jauge__remplissage" style={{ width: `${Math.min(taux, 100)}%` }} />
      </div>
    </div>
  );
}
