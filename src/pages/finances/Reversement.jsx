import { useState } from 'react';
import { exerciceService, reversementService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { useAuthStore } from '@/store/authStore';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import Etiquette from '@/components/ui/Etiquette';
import { Chargement, Erreur } from '@/components/ui/Etats';
import { formaterDateHeure, formaterMontant, formaterPourcentage } from '@/utils/format';

/**
 * Reversement annuel de 20 % au CODET I. La simulation est consultable à tout
 * moment ; le calcul enregistré reste modifiable jusqu'à la clôture de l'exercice.
 */
export default function Reversement() {
  const estAdmin = useAuthStore((etat) => etat.estAdministrateur());
  const [exerciceId, setExerciceId] = useState('');
  const [enCours, setEnCours] = useState(false);

  const exercices = useRequete(() => exerciceService.lister(), []);
  const historique = useRequete(() => reversementService.lister(), []);

  const idRetenu = exerciceId || exercices.donnees?.[0]?.id;

  const simulation = useRequete(
    () => reversementService.simuler(idRetenu),
    [idRetenu],
    { actif: Boolean(idRetenu) },
  );

  const calculer = async () => {
    setEnCours(true);
    try {
      const reversement = await reversementService.calculer(idRetenu);
      notifier.succes(`Reversement enregistré : ${formaterMontant(reversement.montant_reverse)}.`);
      historique.recharger();
      simulation.recharger();
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="pile" style={{ gap: 'var(--e-5)' }}>
      <Carte>
        <div className="rang rang--entre" style={{ flexWrap: 'wrap', marginBottom: 'var(--e-4)' }}>
          <Champ
            type="select"
            value={idRetenu ?? ''}
            onChange={(evenement) => setExerciceId(evenement.target.value)}
            aria-label="Exercice"
            options={(exercices.donnees ?? []).map((exercice) => ({
              valeur: exercice.id,
              libelle: `Exercice ${exercice.annee}`,
            }))}
          />

          {estAdmin && (
            <Bouton onClick={calculer} chargement={enCours} disabled={!idRetenu}>
              Calculer et enregistrer
            </Bouton>
          )}
        </div>

        {simulation.chargement && <Chargement lignes={3} />}
        {simulation.erreur && <Erreur message={simulation.erreur.message} surReessai={simulation.recharger} />}

        {simulation.donnees && (
          <div className="grille-3">
            <div className="indicateur">
              <span className="indicateur__valeur">{formaterMontant(simulation.donnees.assiette, { devise: false })}</span>
              <span className="indicateur__libelle">Assiette — part « groupement » encaissée</span>
            </div>
            <div className="indicateur">
              <span className="indicateur__valeur">{formaterPourcentage(simulation.donnees.taux_applique, 0)}</span>
              <span className="indicateur__libelle">Taux appliqué</span>
            </div>
            <div className="indicateur">
              <span className="indicateur__valeur indicateur__valeur--argent">
                {formaterMontant(simulation.donnees.montant_reverse, { devise: false })}
              </span>
              <span className="indicateur__libelle">Montant revenant au CODET I</span>
            </div>
          </div>
        )}

        <div className="message message--info" style={{ marginTop: 'var(--e-4)' }}>
          L'assiette ne retient que les paiements validés dont la part revient au groupement.
          Le taux est figé au moment du calcul : le modifier plus tard ne changera pas les
          exercices déjà enregistrés.
        </div>
      </Carte>

      <Carte titre="Historique des reversements">
        {historique.chargement && <Chargement lignes={3} />}

        <div className="tableau-enveloppe">
          <table className="tableau">
            <thead>
              <tr>
                <th>Exercice</th>
                <th className="col-nombre">Assiette</th>
                <th className="col-nombre">Taux</th>
                <th className="col-nombre">Montant reversé</th>
                <th>Calculé le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {(historique.donnees ?? []).map((reversement) => (
                <tr key={reversement.id}>
                  <td className="chiffre">{reversement.exercice?.annee}</td>
                  <td className="col-nombre">{formaterMontant(reversement.assiette, { devise: false })}</td>
                  <td className="col-nombre">{formaterPourcentage(reversement.taux_applique, 0)}</td>
                  <td className="col-nombre montant">{formaterMontant(reversement.montant_reverse, { devise: false })}</td>
                  <td className="silence chiffre">{formaterDateHeure(reversement.date_calcul)}</td>
                  <td><Etiquette statut={reversement.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Carte>
    </div>
  );
}
