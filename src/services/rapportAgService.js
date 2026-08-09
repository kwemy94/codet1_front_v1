import httpClient, { extraire } from './httpClient';
import { urlApi } from '@/config/env';

export const rapportAgService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/rapports-ag', { params: filtres }));
  },

  async consulter(id) {
    return extraire(await httpClient.get(`/rapports-ag/${id}`));
  },

  /** Dépôt d'un rapport avec ses pièces. Le rapport reste en brouillon. */
  async deposer(rapport, fichiers) {
    const formulaire = new FormData();
    formulaire.append('exercice_id', rapport.exerciceId);
    formulaire.append('intitule', rapport.intitule);
    formulaire.append('date_ag', rapport.dateAg);
    formulaire.append('type_rapport', rapport.type);
    if (rapport.lieu) formulaire.append('lieu_ag', rapport.lieu);
    if (rapport.resume) formulaire.append('resume', rapport.resume);
    Array.from(fichiers ?? []).forEach((fichier) => formulaire.append('fichiers[]', fichier));

    return extraire(await httpClient.post('/rapports-ag', formulaire));
  },

  /** Rend le rapport visible par tous les membres. */
  async publier(id) {
    return extraire(await httpClient.post(`/rapports-ag/${id}/publier`));
  },

  async depublier(id) {
    return extraire(await httpClient.post(`/rapports-ag/${id}/depublier`));
  },

  /** Téléchargement d'une pièce : la consultation est journalisée côté serveur. */
  async telecharger(rapportId, documentId, nomFichier) {
    const reponse = await httpClient.get(`/rapports-ag/${rapportId}/documents/${documentId}`, {
      responseType: 'blob',
    });

    const url = URL.createObjectURL(reponse.data);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier ?? 'document';
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  },

  /** URL absolue d'une pièce, construite depuis la configuration centrale. */
  urlDocument(rapportId, documentId) {
    return `${urlApi()}/rapports-ag/${rapportId}/documents/${documentId}`;
  },
};

export default rapportAgService;
