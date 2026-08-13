import httpClient, { extraire } from './httpClient';

export const messageService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/messages', { params: filtres }));
  },

  async envoyer({ objet, contenu, categorie }, fichiers) {
    const formulaire = new FormData();
    formulaire.append('objet', objet);
    formulaire.append('contenu', contenu);
    if (categorie) formulaire.append('categorie', categorie);
    Array.from(fichiers ?? []).forEach((fichier) => formulaire.append('fichiers[]', fichier));

    return extraire(await httpClient.post('/messages', formulaire));
  },

  async repondre(id, contenu, fichiers) {
    const formulaire = new FormData();
    formulaire.append('contenu', contenu);
    Array.from(fichiers ?? []).forEach((fichier) => formulaire.append('fichiers[]', fichier));

    return extraire(await httpClient.post(`/messages/${id}/repondre`, formulaire));
  },

  /** Téléchargement d'une pièce jointe. La consultation est journalisée. */
  async telechargerPieceJointe(messageId, documentId, nomFichier) {
    const reponse = await httpClient.get(`/messages/${messageId}/documents/${documentId}`, {
      responseType: 'blob',
    });

    const url = URL.createObjectURL(reponse.data);
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier ?? 'piece-jointe';
    document.body.appendChild(lien);
    lien.click();
    lien.remove();
    URL.revokeObjectURL(url);
  },

  async marquerTraite(id) {
    return extraire(await httpClient.post(`/messages/${id}/traite`));
  },
};

export default messageService;
