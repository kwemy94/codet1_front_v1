/**
 * Point d'entrée unique des services.
 *
 * Les écrans importent depuis '@/services' — jamais depuis axios ni depuis une
 * URL écrite en dur. Cela garantit qu'un changement d'URL de base, d'en-tête ou
 * de gestion d'erreur n'a qu'un seul endroit à modifier.
 */
export { default as httpClient, normaliserErreur, brancherSession } from './httpClient';
export { authService } from './authService';
export { membreService } from './membreService';
export { exerciceService } from './exerciceService';
export { tarifService } from './tarifService';
export { typeCarteService } from './typeCarteService';
export { carteService } from './carteService';
export { paiementService } from './paiementService';
export { contributionService } from './contributionService';
export { reversementService } from './reversementService';
export { rapportAgService } from './rapportAgService';
export { messageService } from './messageService';
export { statistiqueService } from './statistiqueService';
export { referentielService } from './referentielService';
export { journalService } from './journalService';
export { espaceMembreService } from './espaceMembreService';
