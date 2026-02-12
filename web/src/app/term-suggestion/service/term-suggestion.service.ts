import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TermSuggestionService {
  /**
   * Calcule le score de différence entre deux chaînes de même longueur.
   * Retourne le nombre de caractères différents position par position.
   * @throws Error si les chaînes n'ont pas la même longueur.
   */
  getDifferenceScore(source: string, target: string): number {
    const iterableArray = source.split('')
    let result = 0

    if (source.length !== target.length) {
      throw new Error('Source and target have different lengths')
    }

    for (const [index, char] of iterableArray.entries()) {
      result += char !== target[index] ? 1 : 0
    }

    return result
  }

  /**
   * Calcule le score minimum de différence entre `term` et un `candidate` de longueur >= term.
   * On fait glisser `term` sur `candidate` et on retourne le meilleur score.
   * Retourne `null` si le candidat est trop court.
   */
  getMinDifferenceScore(term: string, candidate: string): number | null {
    let result = 0
    // We populate the temporary results array with the highest number possible, that is the length of the candidate
    let temp:  number[] = [
      
    ]

    if (term.length > candidate.length) {
      return null
    }

    if(term.length === candidate.length) {
      return this.getDifferenceScore(term, candidate)
    }

    for(let i = 0; i <= candidate.length - term.length; i++) {
      temp.push(this.getDifferenceScore(term, candidate.substring(i, i + term.length)))
    }

    return Math.min(...temp)
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
