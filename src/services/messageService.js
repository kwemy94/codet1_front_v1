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

  async repondre(id, contenu) {
    return extraire(await httpClient.post(`/messages/${id}/repondre`, { contenu }));
  },

  async marquerTraite(id) {
    return extraire(await httpClient.post(`/messages/${id}/traite`));
  },
};

export default messageService;
