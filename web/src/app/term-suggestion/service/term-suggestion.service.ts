import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TermSuggestionService {
  /**
   * Calcule le score de différence entre deux chaînes de même longueur.
   * Retourne le nombre de caractères différents position par position.
   * @throws Error si les chaînes n'ont pas la même longueur.
   */
  getDifferenceScore(source: string, target: string): number {
    throw new Error('Not implemented');
  }

  /**
   * Calcule le score minimum de différence entre `term` et un `candidate` de longueur >= term.
   * On fait glisser `term` sur `candidate` et on retourne le meilleur score.
   * Retourne `null` si le candidat est trop court.
   */
  getMinDifferenceScore(term: string, candidate: string): number | null {
    throw new Error('Not implemented');
  }

  /**
   * Retourne les N termes les plus proches de `term` parmi `terms`.
   *
   * Règles de tri :
   *  1. Moins de différences d'abord
   *  2. À égalité de différences, le terme le plus proche en longueur du terme recherché
   *  3. À égalité de longueur, ordre alphabétique
   *
   * Les termes plus courts que `term` sont exclus.
   */
  suggest(term: string, terms: string[], count: number): string[] {
    throw new Error('Not implemented');
  }
}
