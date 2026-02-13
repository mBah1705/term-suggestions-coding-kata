import { Injectable } from '@angular/core';
import { elementAt } from 'rxjs';

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
    // We populate the temporary results array with the highest number possible, that is the length of the candidate
    let temp:  number[] = []

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
    // Calculate all the minimum difference scores for each term in the list, returning null for those that are too short
    const minDifferences: (number | null)[] = terms.map((element) => this.getMinDifferenceScore(term, element))

    // We create a map of the minimum differences with their corresponding index, 
    // so we can sort them while keeping track of the original index to retrieve the corresponding term later
    const mappedMinDifferences = new Map(minDifferences.map((value, index) => {
      // If the value is null, we want to put it at the end of the map, 
      // so we return null as the key, and the value as null, so it will be sorted at the end of the map
      if(value === null) {
        return [null, value]
      }
      return [index, value]
    }))

    // We sort the map by the minimum difference score, using the custom sort function that puts null values at the end of the map, and if the values are equal, 
    // it keeps the original order (which is the order of the terms in the input array)
    const sortedMappedMinDifferences = new Map([...mappedMinDifferences.entries()].sort(customSort))

    // We create an array of the keys of the sorted map, 
    // which are the indices of the terms in the input array, sorted by their minimum difference score
    const keysIterable = Array.from(sortedMappedMinDifferences.keys())

    // We create an array of the terms corresponding to the sorted indices, 
    // filtering out the null values (which correspond to terms that are too short)
    const resultsPerIteration: string[] = 
      keysIterable.filter(key => key !== null).map(key => terms[key])

    // if all the minimum differences are the same, and all the terms have the same length, we sort them alphabetically
    if (this.checkAlltheSameLength(resultsPerIteration) && this.checkAlltheSame(minDifferences)) {
      resultsPerIteration.sort((a, b) => a.localeCompare(b))
    }

    // if only all the minimum differences are the same, we sort the terms by their length, shorter first
    if (this.checkAlltheSame(minDifferences)) {
      resultsPerIteration.sort((a, b) => a.length - b.length)
    }
  
    // if there are multiple minimum differences that are the same, we sort the corresponding terms by their length, shorter first
    for (let i = 0; i < minDifferences.length; i++) {
      if (this.checkAlltheSame(minDifferences.slice(i, minDifferences.length))) {
        resultsPerIteration.splice(
          i, resultsPerIteration.length - i, 
          ...resultsPerIteration.slice(i, resultsPerIteration.length).sort((a, b) => a.length - b.length))
      }
    }

    // Finally, we return the first `count` terms from the sorted results, 
    // which are the closest terms to the input term according to the specified rules
    return resultsPerIteration.slice(0, count)

  }

  private checkAlltheSame = (arr: ( number | null)[]): boolean => {
    const firstValue = arr[0]
    return arr.every(value => value === firstValue)
  }

  private checkAlltheSameLength = (arr: string[]): boolean => {
    const firstValue = arr[0]
    return arr.every(value => value.length === firstValue.length)
  }
}

const customSort = (a: [number | null, number | null], b: [number | null, number | null]) : number => {
    if (a[1] === b[1]) return 0;
    if (a[1] === null) return 1;
    if (b[1] === null) return -1;
    return a[1] < b[1] ? -1 : 1;
}
