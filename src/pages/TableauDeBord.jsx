import { Link } from 'react-router-dom';
import { statistiqueService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { Carte } from '@/components/ui/Carte';
import { Chargement, Erreur, Vide } from '@/components/ui/Etats';
import RubanVentilation from '@/components/donnees/RubanVentilation';
import BarresAnnuelles from '@/components/donnees/BarresAnnuelles';
import JaugeRecouvrement from '@/components/donnees/JaugeRecouvrement';
import { formaterMontant } from '@/utils/format';

function Indicateur({ libelle, valeur, argent = false }) {
  return (
    <div className="indicateur">
      <span className={`indicateur__valeur ${argent ? 'indicateur__valeur--argent' : ''}`}>{valeur}</span>
      <span className="indicateur__libelle">{libelle}</span>
    </div>
  );
}

export default function TableauDeBord() {
  const { donnees, chargement, erreur, recharger } = useRequete(
    () => statistiqueService.tableauDeBord(),
    [],
  );
  const recettes = useRequete(() => statistiqueService.evolutionRecettes(), []);

  if (chargement) return <Chargement lignes={6} />;
  if (erreur) return <Erreur message={erreur.message} surReessai={recharger} />;
  if (!donnees) {
    return (
      <Vide
        titre="Aucun exercice ouvert"
        texte="Ouvrez un exercice pour commencer à enregistrer les cotisations de l'année."
      />
    );
  }

  const { finances, membres, cotisations, exercice } = donnees;

  return (
    <div className="pile" style={{ gap: 'var(--e-5)' }}>
      <div className="grille">
        <Carte serree>
          <Indicateur libelle="Recettes de l'exercice" valeur={formaterMontant(finances.total_recettes)} argent />
        </Carte>
        <Carte serree>
          <Indicateur libelle="Cotisations encaissées" valeur={formaterMontant(finances.total_cotisations)} argent />
        </Carte>
        <Carte serree>
          <Indicateur libelle="Dons et contributions" valeur={formaterMontant(finances.total_dons)} argent />
        </Carte>
        <Carte serree>
          <Indicateur libelle="Membres actifs" valeur={membres.actifs} />
        </Carte>
      </div>

      <div className="grille-2">
        <Carte titre={`Ventilation des fonds — exercice ${exercice}`}>
          <RubanVentilation parts={finances.par_destination} hauteur={12} />

          <div className="message message--info" style={{ marginTop: 'var(--e-4)' }}>
            <div>
              <strong>Reversement au CODET I</strong> — {formaterMontant(finances.reversement_estime.montant_reverse)}{' '}
              <span className="tenu">
                ({finances.reversement_estime.taux_applique} % de {formaterMontant(finances.reversement_estime.assiette)})
              </span>
              <br />
              <Link to="/reversement">Voir le détail du calcul</Link>
            </div>
          </div>
        </Carte>

        <Carte titre="Recouvrement des cartes annuelles">
          <JaugeRecouvrement
            taux={cotisations.taux_paiement}
            aJour={cotisations.membres_a_jour}
            enRetard={cotisations.membres_en_retard}
          />

          <dl className="grille" style={{ marginTop: 'var(--e-4)' }}>
            <div>
              <dt className="tenu">Cartes émises</dt>
              <dd className="chiffre" style={{ margin: 0, fontSize: 'var(--t-md)' }}>{cotisations.cartes_emises}</dd>
            </div>
            <div>
              <dt className="tenu">Reste à recouvrer</dt>
              <dd className="montant" style={{ margin: 0 }}>{formaterMontant(cotisations.reste_a_recouvrer)}</dd>
            </div>
          </dl>

          <Link to="/cartes?statut=impayee" className="tenu">Voir les impayés</Link>
        </Carte>
      </div>

      <Carte titre="Évolution des recettes">
        {recettes.chargement ? <Chargement lignes={3} /> : <BarresAnnuelles series={recettes.donnees ?? []} />}
      </Carte>

      <div className="grille-3">
        <Carte serree titre="Répartition par catégorie">
          <Repartition valeurs={membres.par_categorie} />
        </Carte>
        <Carte serree titre="Répartition par pays">
          <Repartition valeurs={membres.par_pays} />
        </Carte>
        <Carte serree titre="Répartition par sexe">
          <Repartition valeurs={{ Hommes: membres.par_sexe?.M ?? 0, Femmes: membres.par_sexe?.F ?? 0 }} />
        </Carte>
      </div>
    </div>
  );
}

function Repartition({ valeurs }) {
  const entrees = Object.entries(valeurs ?? {});
  if (!entrees.length) return <p className="tenu">Aucune donnée pour l'instant.</p>;

  const total = entrees.reduce((somme, [, n]) => somme + Number(n), 0) || 1;

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="pile">
      {entrees.map(([libelle, nombre]) => (
        <li key={libelle} style={{ display: 'grid', gap: 4 }}>
          <span className="rang rang--entre" style={{ fontSize: 'var(--t-sm)' }}>
            <span className="silence">{libelle}</span>
            <span className="chiffre">{nombre}</span>
          </span>
          <span className="jauge">
            <span className="jauge__remplissage" style={{ width: `${(nombre / total) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
