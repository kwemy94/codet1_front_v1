import { useState } from 'react';
import { referentielService } from '@/services';
import { useRequete } from '@/hooks/useRequete';
import { notifier } from '@/store/notificationStore';
import { Carte } from '@/components/ui/Carte';
import Bouton from '@/components/ui/Bouton';
import Champ from '@/components/ui/Champ';
import { Chargement, Erreur } from '@/components/ui/Etats';

/** Paramètres modifiables sans intervention technique (taux, préfixe, devise…). */
export default function Parametres() {
  const { donnees, chargement, erreur, recharger } = useRequete(() => referentielService.parametres(), []);
  const [brouillons, setBrouillons] = useState({});
  const [enregistrement, setEnregistrement] = useState(null);

  const enregistrer = async (parametre) => {
    const valeur = brouillons[parametre.id];
    if (valeur === undefined || valeur === parametre.valeur) return;

    setEnregistrement(parametre.id);
    try {
      await referentielService.modifierParametre(parametre.id, valeur);
      notifier.succes(`« ${parametre.libelle} » mis à jour.`);
      recharger();
    } catch (probleme) {
      notifier.alerte(probleme.message);
    } finally {
      setEnregistrement(null);
    }
  };

  if (chargement && !donnees) return <Chargement lignes={5} />;
  if (erreur) return <Erreur message={erreur.message} surReessai={recharger} />;

  return (
    <Carte titre="Paramètres généraux">
      <p className="tenu">
        Le taux de reversement s'applique aux calculs à venir. Les exercices déjà
        calculés conservent le taux en vigueur au moment de leur enregistrement.
      </p>

      <div className="pile" style={{ marginTop: 'var(--e-4)' }}>
        {(donnees ?? []).map((parametre) => (
          <div key={parametre.id} className="rang rang--haut" style={{ gap: 'var(--e-4)', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <strong>{parametre.libelle}</strong>
              <span className="tenu chiffre" style={{ display: 'block' }}>{parametre.code}</span>
            </div>

            <Champ
              value={brouillons[parametre.id] ?? parametre.valeur ?? ''}
              onChange={(evenement) =>
                setBrouillons((etat) => ({ ...etat, [parametre.id]: evenement.target.value }))
              }
              aria-label={parametre.libelle}
              style={{ width: 180 }}
            />

            <Bouton
              variante="contour"
              onClick={() => enregistrer(parametre)}
              chargement={enregistrement === parametre.id}
              disabled={
                brouillons[parametre.id] === undefined || brouillons[parametre.id] === parametre.valeur
              }
            >
              Enregistrer
            </Bouton>
          </div>
        ))}
      </div>
    </Carte>
  );
}
