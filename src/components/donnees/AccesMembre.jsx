import { useState } from "react";
import { membreService } from "@/services";
import { notifier } from "@/store/notificationStore";
import Bouton from "@/components/ui/Bouton";
import Modale from "@/components/ui/Modale";
import "./donnees.css";

/**
 * Ouverture de l'accès d'un membre à son espace personnel.
 *
 * Le mot de passe provisoire est affiché une seule fois : il n'est stocké nulle
 * part en clair et le serveur ne pourra plus le restituer. Deux conséquences
 * dans ce composant : la fiche n'est rechargée qu'après fermeture de la modale
 * — un rechargement démonterait l'écran et emporterait le mot de passe — et la
 * fermeture demande une confirmation explicite.
 */
export default function AccesMembre({ membre, surChangement }) {
  const [enCours, setEnCours] = useState(false);
  const [resultat, setResultat] = useState(null);

  const aUnAcces = Boolean(membre.a_un_compte);

  const executer = async (action) => {
    setEnCours(true);
    try {
      setResultat(await action(membre.id));
    } catch (erreur) {
      notifier.alerte(erreur.message);
    } finally {
      setEnCours(false);
    }
  };

  /** La fiche n'est rafraîchie qu'ici : le mot de passe a été lu. */
  const fermer = () => {
    setResultat(null);
    surChangement?.();
  };

  const copier = async (texte) => {
    try {
      await navigator.clipboard.writeText(texte);
      notifier.succes("Mot de passe copié.");
    } catch {
      notifier.alerte(
        "La copie automatique a échoué. Sélectionnez le mot de passe et copiez-le à la main.",
      );
    }
  };

  const copierTout = () => {
    if (!resultat) return;

    const texte = [
      `${membre.nom_complet} — accès à l'espace CODET I`,
      `Identifiant : ${resultat.identifiants.join(" ou ")}`,
      `Mot de passe provisoire : ${resultat.mot_de_passe_provisoire}`,
      "À la première connexion, choisissez votre propre mot de passe.",
    ].join("\n");

    copier(texte);
  };

  return (
    <>
      <Bouton
        variante="contour"
        taille="petit"
        chargement={enCours}
        onClick={() =>
          executer(
            aUnAcces
              ? membreService.reinitialiserMotDePasse
              : membreService.creerAcces,
          )
        }
      >
        {aUnAcces ? "Réinitialiser son mot de passe" : "Créer son accès"}
      </Bouton>

      <Modale
        titre={aUnAcces ? "Nouveau mot de passe provisoire" : "Accès créé"}
        ouverte={Boolean(resultat)}
        surFermeture={fermer}
        pied={
          <>
            <Bouton variante="contour" onClick={copierTout}>
              Copier le message complet
            </Bouton>
            <Bouton onClick={fermer}>J'ai noté le mot de passe</Bouton>
          </>
        }
      >
        {resultat && (
          <div className="pile">
            <div className="message message--alerte">
              Ce mot de passe n'est affiché qu'une seule fois. Notez-le ou
              copiez-le maintenant : il ne pourra pas être retrouvé, seulement
              réinitialisé.
            </div>

            <div>
              <p className="surtitre">Identifiant de connexion</p>
              {resultat.identifiants.map((identifiant) => (
                <p
                  key={identifiant}
                  className="chiffre acces__valeur"
                  style={{ margin: 0 }}
                >
                  {identifiant}
                </p>
              ))}
              <p className="tenu" style={{ margin: "4px 0 0" }}>
                Le membre peut se connecter avec l'un ou l'autre.
              </p>
            </div>

            <div>
              <p className="surtitre">Mot de passe provisoire</p>
              <div className="acces__mot-de-passe">
                <span className="chiffre acces__code">
                  {resultat.mot_de_passe_provisoire}
                </span>
                <Bouton
                  variante="contour"
                  taille="petit"
                  onClick={() => copier(resultat.mot_de_passe_provisoire)}
                >
                  Copier
                </Bouton>
              </div>
              <p className="tenu" style={{ margin: "6px 0 0" }}>
                Sans caractère ambigu : ni O ni 0, ni I ni 1 — il peut être
                dicté au téléphone.
              </p>
            </div>

            <p className="tenu" style={{ margin: 0 }}>
              Transmettez-le par SMS ou WhatsApp. À sa première connexion, le
              membre devra choisir son propre mot de passe.
            </p>
          </div>
        )}
      </Modale>
    </>
  );
}
