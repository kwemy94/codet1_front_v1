import { formaterMontant } from '@/utils/format';
import './donnees.css';

/**
 * Histogramme des recettes par exercice, en SVG pur : aucune dépendance de
 * graphique n'est chargée, ce qui garde le paquet léger sur connexion lente.
 */
export default function BarresAnnuelles({ series = [], hauteur = 180 }) {
  if (!series.length) {
    return <p className="tenu">Les recettes s'afficheront ici dès le premier encaissement.</p>;
  }

  const maximum = Math.max(...series.map((point) => Number(point.total)), 1);
  const largeurBarre = 100 / series.length;

  return (
    <div className="barres" style={{ height: hauteur }}>
      {series.map((point) => {
        const proportion = (Number(point.total) / maximum) * 100;

        return (
          <div className="barres__colonne" key={point.annee} style={{ width: `${largeurBarre}%` }}>
            <span className="barres__valeur chiffre">{formaterMontant(point.total, { devise: false })}</span>
            <div
              className="barres__barre"
              style={{ height: `${Math.max(proportion, 2)}%` }}
              title={`${point.annee} — ${formaterMontant(point.total)}`}
            />
            <span className="barres__annee chiffre">{point.annee}</span>
          </div>
        );
      })}
    </div>
  );
}
