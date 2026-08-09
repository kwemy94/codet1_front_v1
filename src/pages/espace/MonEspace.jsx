import { useState } from 'react';
import { Link } from 'react-router-dom';
import { espaceMembreService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Etiquette from '@/components/ui/Etiquette';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import PayerEnLigne from './PayerEnLigne';
import { formaterMontant } from '@/utils/format';

/** Espace personnel du membre : ce qu'il doit, ce qu'il a payé, ce qu'il peut faire. */
export default function MonEspace() {
  const [paiementOuvert, setPaiementOuvert] = useState(false);
  const { donnees, chargement, erreur, recharger } = useRequete(
    () => espaceMembreService.tableauDeBord(),
    [],
  );

  if (chargement) return <Chargement lignes={5} />;
  if (erreur) return <Erreur message={erreur.message} surReessai={recharger} />;
  if (!donnees) return null;

  const { membre, carte_en_cours: carte, solde_annuel: solde, total_cotise: total, exercice_courant: exercice } = donnees;

  return (
    <div className="pile" style={{ gap: 'var(--e-5)' }}>
      <Carte>
        <p className="surtitre chiffre">{membre.matricule}</p>
        <h2>{membre.nom_complet}</h2>
        <p className="silence" style={{ margin: 0 }}>
          {membre.categorie?.libelle}
          {membre.localisation?.ville ? ` · ${membre.localisation.ville}` : ''}
        </p>
      </Carte>

      {carte ? (
        <Carte titre={`Carte de développement ${exercice}`} action={<Etiquette statut={carte.statut} />}>
          <div className="rang rang--entre" style={{ alignItems: 'flex-end', flexWrap: 'wrap', gap: 'var(--e-4)' }}>
            <div className="indicateur">
              <span className="indicateur__valeur indicateur__valeur--argent">
                {formaterMontant(solde, { devise: false })}
              </span>
              <span className="indicateur__libelle">
                {solde > 0 ? 'Reste à régler cette année' : 'Votre carte est soldée'}
              </span>
            </div>

            <div className="indicateur">
              <span className="indicateur__valeur">{formaterMontant(carte.montant_du, { devise: false })}</span>
              <span className="indicateur__libelle">Montant de la carte</span>
            </div>

            {solde > 0 && <Bouton onClick={() => setPaiementOuvert(true)}>Payer par Mobile Money</Bouton>}

            {carte.imprimable && (
              <Link to={`/cartes/${carte.id}/impression`} className="bouton bouton--principal">
                Imprimer ma carte
              </Link>
            )}
          </div>

          {solde > 0 && (
            <p className="tenu" style={{ marginTop: 'var(--e-3)' }}>
              Votre carte sera imprimable dès que la totalité du montant sera réglée.
            </p>
          )}

          {carte.repartition && (
            <div style={{ marginTop: 'var(--e-5)' }}>
              <p className="surtitre">Ce que finance votre cotisation</p>
              <RubanVentilation hauteur={10} parts={carte.repartition} />
            </div>
          )}
        </Carte>
      ) : (
        <Carte>
          <Vide
            titre="Aucune carte pour l'exercice en cours"
            texte="Le secrétariat émet votre carte annuelle. Écrivez au comité si vous pensez qu'elle devrait déjà figurer ici."
            action={<Link to="/messages" className="bouton bouton--contour">Écrire au comité</Link>}
          />
        </Carte>
      )}

      <div className="grille-2">
        <Carte serree>
          <div className="indicateur">
            <span className="indicateur__valeur">{formaterMontant(total, { devise: false })}</span>
            <span className="indicateur__libelle">Total versé au comité depuis votre adhésion</span>
          </div>
        </Carte>

        <Carte serree>
          <div className="rang rang--entre">
            <span className="silence">Vos reçus et votre historique</span>
            <Link to="/mon-espace/paiements" className="bouton bouton--contour bouton--petit">
              Voir mes paiements
            </Link>
          </div>
        </Carte>
      </div>

      <PayerEnLigne
        carte={paiementOuvert ? carte : null}
        surFermeture={() => setPaiementOuvert(false)}
        surSucces={() => {
          setPaiementOuvert(false);
          recharger();
        }}
      />
    </div>
  );
}
