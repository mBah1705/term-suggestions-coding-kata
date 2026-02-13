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
    const minDifferences: (number | null)[] = terms.map((element) => this.getMinDifferenceScore(term, element))
    const mappedMinDifferences = new Map(minDifferences.map((value, index) => {
      if(value === null) {
        return [null, value]
      }
      return [index, value]
    }))
    const sortedMappedMinDifferences = new Map([...mappedMinDifferences.entries()].sort(customSort()))

    const keysIterable = Array.from(sortedMappedMinDifferences.keys())

    const resultsPerIteration: string[] = 
      keysIterable.filter(key => key !== null).map(key => terms[key])

    if (this.checkAlltheSameLength(resultsPerIteration) && this.checkAlltheSame(minDifferences)) {
      resultsPerIteration.sort((a, b) => a.localeCompare(b))
    }


    if (this.checkAlltheSame(minDifferences)) {
      resultsPerIteration.sort((a, b) => a.length - b.length)
    }
  
    for (let i = 0; i < minDifferences.length; i++) {
      if (this.checkAlltheSame(minDifferences.slice(i, minDifferences.length))) {
        resultsPerIteration.splice(
          i, resultsPerIteration.length - i, 
          ...resultsPerIteration.slice(i, resultsPerIteration.length).sort((a, b) => a.length - b.length))
      }
    }

    return resultsPerIteration.slice(0, count)

  }

  // private swapArrayElements = (arr: string[], a: number, b: number): string[] => 
  //   { let _arr = [...arr]; 
  //     let temp = _arr[a]; 
  //     _arr[a] = _arr[b]; 
  //     _arr[b] = temp; 
  //     return _arr 
  //   }

  private checkAlltheSame = (arr: ( number | null)[]): boolean => {
    const firstValue = arr[0]
    return arr.every(value => value === firstValue)
  }

  private checkAlltheSameLength = (arr: string[]): boolean => {
    const firstValue = arr[0]
    return arr.every(value => value.length === firstValue.length)
  }

  // private interchange(elements: string[], minDifferences: (number | null)[]): string[] {
  //   let toReturnElements: string[] = [...elements]
  //   for (let i = 0; i < toReturnElements.length; i++) {
  //     if (minDifferences[i] === minDifferences[i + 1] &&
  //       toReturnElements[i].length > toReturnElements[i + 1].length) {
  //       toReturnElements = [...this.swapArrayElements(toReturnElements, i, i + 1)];
  //     }
  //   }
  //   return toReturnElements;
  // }

  private getAllMatchs(count: number, minDifferences: (number | null)[], elements: string[], terms: string[]) {
    const results: string[] = []
    for (let i = 0; i <= count; i++) {
      for (let j = 0; j < minDifferences.length; j++) {
        if (minDifferences[j] === i) {
          results.push(terms[j]);
        }
      }
    }

    return results
  }
}



function customSort(): ((a: [number | null, number | null], b: [number | null, number | null]) => number) | undefined {
  return (a, b) => {
    if (a[1] === b[1]) return 0;
    if (a[1] === null) return 1;
    if (b[1] === null) return -1;
    return a[1] < b[1] ? -1 : 1;
  };
}
// const minDifferences: (number|null)[] = []
//     terms.forEach((element) => minDifferences.push(this.getMinDifferenceScore(term, element)))

//     // 1. Moins de différences d'abord
//     const mappedMinDifferences = new Map(minDifferences.map((value, index) => [index, value]))
//     const sortedMappedMinDifferences = new Map([...mappedMinDifferences.entries()].sort((a, b) => {
//       if(a[1] === b[1]) return 0;
//       if (a[1] === null) return 1;
//       if (b[1] === null) return -1;
      
//       return a[1] < b[1] ? -1 : 1
//     }))

//     const keysIterable = Array.from(sortedMappedMinDifferences.keys())

//     let resultsPerIteration: string[] = []

//     // resultsPerIteration contains all the elements matching, there are possibly doubles
//     resultsPerIteration = [...this.getAllMatchs(count, minDifferences, resultsPerIteration, terms)]

//     // resort all the matchs according keysIterable, that is to say according to the order of the minDifferences array
//     resultsPerIteration = keysIterable.map(key => resultsPerIteration[key])
    
//     if (this.checkAlltheSame(minDifferences)) {
//       resultsPerIteration.sort((a, b) => a.length - b.length)
      
//       if(this.checkAlltheSameLength(resultsPerIteration)) {
//         resultsPerIteration.sort()
//       }
//     }
    
//     resultsPerIteration = [...this.interchange(resultsPerIteration, minDifferences)]
    
//     return resultsPerIteration.slice(0, count)