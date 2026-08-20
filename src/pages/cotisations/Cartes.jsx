import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { carteService, exerciceService, exportService } from "@/services";
import { notifier } from "@/store/notificationStore";
import { useRequete } from "@/hooks/useRequete";
import { Carte } from "@/components/ui/Carte";
import Champ from "@/components/ui/Champ";
import Etiquette from "@/components/ui/Etiquette";
import Pagination from "@/components/ui/Pagination";
import { Chargement, Erreur, Vide } from "@/components/ui/Etats";
import PaiementManuel from "../finances/PaiementManuel";
import EmissionLot from "./EmissionLot";
import EncaissementLot from "./EncaissementLot";
import Bouton from "@/components/ui/Bouton";
import { formaterMontant } from "@/utils/format";

export default function Cartes() {
  const [parametres, setParametres] = useSearchParams();
  const [page, setPage] = useState(1);
  const [carteAEncaisser, setCarteAEncaisser] = useState(null);

  const statut = parametres.get("statut") ?? "";
  const exerciceId = parametres.get("exercice_id") ?? "";

  const exercices = useRequete(() => exerciceService.lister(), []);

  const [exportEnCours, setExportEnCours] = useState(false);
  const [selection, setSelection] = useState([]);
  const [emissionOuverte, setEmissionOuverte] = useState(false);
  const [encaissementOuvert, setEncaissementOuvert] = useState(false);

  /**
   * Édite l'état des ventes de l'exercice affiché. Sans filtre d'exercice,
   * le serveur retient celui en cours.
   */
  const exporter = async () => {
    setExportEnCours(true);
    try {
      const annee = (exercices.donnees ?? []).find(
        (e) => String(e.id) === String(exerciceId),
      )?.annee;
      await exportService.ventesCartes({
        exerciceId: exerciceId || null,
        annee,
        statut,
      });
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setExportEnCours(false);
    }
  };

  const filtres = useMemo(
    () => ({
      statut: statut || undefined,
      exercice_id: exerciceId || undefined,
      page,
    }),
    [statut, exerciceId, page],
  );

  const { donnees, chargement, erreur, recharger } = useRequete(
    () => carteService.lister(filtres),
    [filtres],
  );

  const cartes = donnees?.data ?? [];

  /* Seules les cartes non soldées sont encaissables : elles seules sont retenues. */
  const encaissables = cartes.filter((carte) => carte.statut !== "soldee");
  const toutesRetenues =
    encaissables.length > 0 &&
    encaissables.every((carte) => selection.includes(carte.id));

  const basculer = (id) =>
    setSelection((etat) =>
      etat.includes(id) ? etat.filter((x) => x !== id) : [...etat, id],
    );

  const basculerToutes = () =>
    setSelection((etat) =>
      toutesRetenues
        ? etat.filter((id) => !encaissables.some((carte) => carte.id === id))
        : [...new Set([...etat, ...encaissables.map((carte) => carte.id)])],
    );

  const cartesRetenues = cartes.filter((carte) => selection.includes(carte.id));

  const changerFiltre = (cle) => (evenement) => {
    const valeur = evenement.target.value;
    const suivant = new URLSearchParams(parametres);
    if (valeur) suivant.set(cle, valeur);
    else suivant.delete(cle);
    setParametres(suivant);
    setPage(1);
  };

  return (
    <div className="pile">
      <Carte serree>
        <div className="rang" style={{ flexWrap: "wrap" }}>
          <Champ
            type="select"
            value={exerciceId}
            onChange={changerFiltre("exercice_id")}
            aria-label="Exercice"
            options={[
              { valeur: "", libelle: "Tous les exercices" },
              ...(exercices.donnees ?? []).map((exercice) => ({
                valeur: exercice.id,
                libelle: `Exercice ${exercice.annee}`,
              })),
            ]}
          />

          <Champ
            type="select"
            value={statut}
            onChange={changerFiltre("statut")}
            aria-label="Statut de la carte"
            options={[
              { valeur: "", libelle: "Tous les statuts" },
              { valeur: "impayee", libelle: "Impayées" },
              { valeur: "partielle", libelle: "Partiellement réglées" },
              { valeur: "soldee", libelle: "Soldées" },
            ]}
          />

          <Bouton className="pousse" onClick={() => setEmissionOuverte(true)}>
            Émettre en bloc
          </Bouton>

          <Bouton
            variante="contour"
            chargement={exportEnCours}
            onClick={exporter}
          >
            {statut
              ? "Exporter la sélection (PDF)"
              : "Historique des ventes (PDF)"}
          </Bouton>
        </div>
      </Carte>

      <Carte className="carte--nue">
        {chargement && (
          <div style={{ padding: "var(--e-5)" }}>
            <Chargement />
          </div>
        )}
        {erreur && (
          <div style={{ padding: "var(--e-4)" }}>
            <Erreur message={erreur.message} surReessai={recharger} />
          </div>
        )}

        {!chargement && !erreur && cartes.length === 0 && (
          <Vide
            titre="Aucune carte pour ce filtre"
            texte="Les cartes s'émettent depuis la fiche d'un membre."
            action={
              <Link to="/membres" className="bouton bouton--contour">
                Aller aux membres
              </Link>
            }
          />
        )}

        {!chargement && cartes.length > 0 && (
          <>
            <div className="tableau-enveloppe">
              <table className="tableau">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input
                        type="checkbox"
                        className="case-ligne"
                        checked={toutesRetenues}
                        onChange={basculerToutes}
                        aria-label="Retenir toutes les cartes encaissables"
                      />
                    </th>
                    <th>Carte</th>
                    <th>Membre</th>
                    <th className="col-nombre">Dû</th>
                    <th className="col-nombre">Réglé</th>
                    <th className="col-nombre">Solde</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cartes.map((carte) => (
                    <tr key={carte.id}>
                      <td>
                        {carte.statut !== "soldee" && (
                          <input
                            type="checkbox"
                            className="case-ligne"
                            checked={selection.includes(carte.id)}
                            onChange={() => basculer(carte.id)}
                            aria-label={`Retenir la carte de ${carte.membre?.nom_complet}`}
                          />
                        )}
                      </td>
                      <td className="chiffre">{carte.numero_carte}</td>
                      <td>
                        <Link to={`/membres/${carte.membre?.id}`}>
                          {carte.membre?.nom_complet}
                        </Link>
                        <span
                          className="tenu chiffre"
                          style={{ display: "block" }}
                        >
                          {carte.membre?.matricule}
                        </span>
                      </td>
                      <td className="col-nombre">
                        {formaterMontant(carte.montant_du, { devise: false })}
                      </td>
                      <td className="col-nombre">
                        {formaterMontant(carte.montant_regle, {
                          devise: false,
                        })}
                      </td>
                      <td className="col-nombre montant">
                        {formaterMontant(carte.solde, { devise: false })}
                      </td>
                      <td>
                        <Etiquette statut={carte.statut} />
                      </td>
                      <td className="col-nombre">
                        {carte.statut !== "soldee" && (
                          <Bouton
                            variante="discret"
                            taille="petit"
                            onClick={() => setCarteAEncaisser(carte)}
                          >
                            Encaisser
                          </Bouton>
                        )}
                        {carte.imprimable && (
                          <Link
                            to={`/cartes/${carte.id}/impression`}
                            className="bouton bouton--discret bouton--petit"
                          >
                            Imprimer
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination meta={donnees?.meta} surChangement={setPage} />
          </>
        )}
      </Carte>

      {selection.length > 0 && (
        <div className="barre-selection">
          <span className="barre-selection__compte">{selection.length}</span>
          <span>carte(s) retenue(s)</span>

          <Bouton
            variante="clair"
            taille="petit"
            className="pousse"
            onClick={() => setSelection([])}
          >
            Vider la sélection
          </Bouton>

          <Bouton taille="petit" onClick={() => setEncaissementOuvert(true)}>
            Encaisser
          </Bouton>
        </div>
      )}

      {emissionOuverte && (
        <EmissionLot
          exercices={exercices.donnees ?? []}
          surFermeture={() => setEmissionOuverte(false)}
          surEmission={recharger}
        />
      )}

      {encaissementOuvert && (
        <EncaissementLot
          cartes={cartesRetenues}
          surFermeture={() => setEncaissementOuvert(false)}
          surEncaissement={() => {
            setSelection([]);
            recharger();
          }}
        />
      )}

      {carteAEncaisser && (
        <PaiementManuel
          carte={carteAEncaisser}
          surFermeture={() => setCarteAEncaisser(null)}
          surEnregistrement={() => {
            setCarteAEncaisser(null);
            recharger();
          }}
        />
      )}
    </div>
  );
}
