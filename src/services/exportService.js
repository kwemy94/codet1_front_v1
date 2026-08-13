import httpClient from './httpClient';

/**
 * États PDF édités par le comité.
 *
 * Le fichier est récupéré en binaire puis remis au navigateur : la requête
 * porte ainsi le jeton d'authentification, ce qu'un simple lien ne ferait pas.
 */
async function telecharger(chemin, nomFichier, params = {}) {
  const reponse = await httpClient.get(chemin, { responseType: 'blob', params });

  const url = URL.createObjectURL(reponse.data);
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  document.body.appendChild(lien);
  lien.click();
  lien.remove();
  URL.revokeObjectURL(url);
}

export const exportService = {
  /**
   * Historique des ventes de cartes — exercice courant si aucun n'est précisé.
   * Les filtres de l'écran sont transmis pour que l'état édité corresponde
   * exactement à la liste affichée.
   */
  async ventesCartes({ exerciceId, annee, statut, typeCarteId } = {}) {
    const chemin = exerciceId
      ? `/exports/exercices/${exerciceId}/ventes-cartes.pdf`
      : '/exports/ventes-cartes.pdf';

    const nom = ['ventes-cartes', annee ?? 'exercice-courant', statut].filter(Boolean).join('-');

    return telecharger(chemin, `${nom}.pdf`, {
      statut: statut || undefined,
      type_carte_id: typeCarteId || undefined,
    });
  },

  /** État des contributions et dons d'un exercice, filtres de l'écran compris. */
  async contributions({ exerciceId, annee, statut, nature } = {}) {
    const chemin = exerciceId
      ? `/exports/exercices/${exerciceId}/contributions.pdf`
      : '/exports/contributions.pdf';

    const nom = ['contributions', annee ?? 'exercice-courant', statut, nature].filter(Boolean).join('-');

    return telecharger(chemin, `${nom}.pdf`, {
      statut: statut || undefined,
      nature: nature || undefined,
    });
  },

  /** Historique complet d'un membre, tous exercices, impayés compris. */
  async historiqueMembre(membreId, matricule) {
    return telecharger(
      `/exports/membres/${membreId}/historique.pdf`,
      `historique-${matricule ?? membreId}.pdf`,
    );
  },
};

export default exportService;
