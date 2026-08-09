import httpClient, { extraire } from './httpClient';

export const journalService = {
  async lister(filtres = {}) {
    return extraire(await httpClient.get('/journal', { params: filtres }));
  },
};

export default journalService;
