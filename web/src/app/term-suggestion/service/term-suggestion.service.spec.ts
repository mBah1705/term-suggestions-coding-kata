import { TestBed } from '@angular/core/testing';
import { TermSuggestionService } from './term-suggestion.service';

describe('TermSuggestionService', () => {
  let service: TermSuggestionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TermSuggestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // =========================================================================
  // getDifferenceScore — comparaison position par position, même longueur
  // =========================================================================
  describe('getDifferenceScore', () => {
    it('should return 0 for identical strings', () => {
      expect(service.getDifferenceScore('gros', 'gros')).toBe(0);
    });

    it('should return 0 for two empty strings', () => {
      expect(service.getDifferenceScore('', '')).toBe(0);
    });

    it('should return 1 when one character differs', () => {
      // gros vs gras → seule la 3e lettre diffère (o ≠ a)
      expect(service.getDifferenceScore('gros', 'gras')).toBe(1);
    });

    it('should return the full length when all characters differ', () => {
      expect(service.getDifferenceScore('abcd', 'wxyz')).toBe(4);
    });

    it('should count each differing position independently', () => {
      // "abc" vs "axc" → 1 différence (position 1)
      expect(service.getDifferenceScore('abc', 'axc')).toBe(1);
      // "abc" vs "xyz" → 3 différences
      expect(service.getDifferenceScore('abc', 'xyz')).toBe(3);
    });

    it('should be case-sensitive (inputs are assumed lowercase)', () => {
      // Même si l'algo travaille en minuscule, on vérifie le comportement brut
      expect(service.getDifferenceScore('abc', 'Abc')).toBe(1);
    });

    it('should throw if strings have different lengths', () => {
      expect(() => service.getDifferenceScore('ab', 'abc')).toThrowError();
      expect(() => service.getDifferenceScore('abcd', 'ab')).toThrowError();
    });

    it('should handle single character strings', () => {
      expect(service.getDifferenceScore('a', 'a')).toBe(0);
      expect(service.getDifferenceScore('a', 'b')).toBe(1);
    });
  });

  // =========================================================================
  // getMinDifferenceScore — fenêtre glissante sur un candidat >= term
  // =========================================================================
  describe('getMinDifferenceScore', () => {
    it('should return null when candidate is shorter than term', () => {
      expect(service.getMinDifferenceScore('gros', 'go')).toBeNull();
      expect(service.getMinDifferenceScore('gros', 'ros')).toBeNull();
      expect(service.getMinDifferenceScore('gros', 'gro')).toBeNull();
    });

    it('should return 0 for an exact match (same length)', () => {
      expect(service.getMinDifferenceScore('gros', 'gros')).toBe(0);
    });

    it('should return the direct difference for same-length strings', () => {
      // gros vs gras → 1 différence
      expect(service.getMinDifferenceScore('gros', 'gras')).toBe(1);
    });

    it('should slide the term and find the best window on a longer candidate', () => {
      // "gros" dans "agressif" :
      //   agre → 4, gres → 1, ress → 3, essi → 4, ssif → 4
      //   minimum = 1
      expect(service.getMinDifferenceScore('gros', 'agressif')).toBe(1);
    });

    it('should find the best window in "graisse" for "gros"', () => {
      // "gros" dans "graisse" :
      //   grai → 2, rais → 4, aiss → 4, isse → 4
      //   minimum = 2
      expect(service.getMinDifferenceScore('gros', 'graisse')).toBe(2);
    });

    it('should return 0 when the term is found as a substring', () => {
      // "chat" dans "achat" → achat contient "chat" à partir de la position 1
      expect(service.getMinDifferenceScore('chat', 'achat')).toBe(0);
    });

    it('should handle candidate of length exactly equal to term', () => {
      expect(service.getMinDifferenceScore('abc', 'abc')).toBe(0);
      expect(service.getMinDifferenceScore('abc', 'abd')).toBe(1);
    });

    it('should return null for empty candidate with non-empty term', () => {
      expect(service.getMinDifferenceScore('abc', '')).toBeNull();
    });

    it('should return 0 for both empty strings', () => {
      expect(service.getMinDifferenceScore('', '')).toBe(0);
    });

    it('should return 0 for empty term with any candidate', () => {
      // Un terme vide est "contenu" partout avec 0 différences
      expect(service.getMinDifferenceScore('', 'anything')).toBe(0);
    });
  });

  // =========================================================================
  // suggest — algorithme principal
  // =========================================================================
  describe('suggest', () => {
    // ----- Exemple de l'énoncé -----
    it('should return the expected result from the problem statement', () => {
      const terms = ['gros', 'gras', 'graisse', 'agressif', 'go', 'ros', 'gro'];
      const result = service.suggest('gros', terms, 2);

      // gros=0, gras=1, agressif=1, graisse=2, go/ros/gro=exclus
      // Top 2 : gros (0), puis gras (1, longueur 4) avant agressif (1, longueur 8)
      expect(result).toEqual(['gros', 'gras']);
    });

    // ----- Cas limites -----
    it('should return an empty array when terms list is empty', () => {
      expect(service.suggest('test', [], 5)).toEqual([]);
    });

    it('should return an empty array when count is 0', () => {
      expect(service.suggest('test', ['test', 'tester'], 0)).toEqual([]);
    });

    it('should return an empty array when all terms are shorter than the search term', () => {
      expect(service.suggest('longue', ['ab', 'cd', 'ef'], 3)).toEqual([]);
    });

    it('should return fewer results if not enough valid candidates exist', () => {
      // Seuls "gros" et "gras" sont valides (longueur >= 4), on demande 10
      const terms = ['gros', 'gras', 'go', 'ro'];
      const result = service.suggest('gros', terms, 10);
      expect(result.length).toBe(2);
      expect(result).toEqual(['gros', 'gras']);
    });

    // ----- Tri par score de différence -----
    it('should sort primarily by difference score (ascending)', () => {
      // On construit des termes avec des scores croissants
      const terms = ['abcd', 'abcx', 'axyz'];
      // abcd → 0, abcx → 1, axyz → 3
      const result = service.suggest('abcd', terms, 3);
      expect(result).toEqual(['abcd', 'abcx', 'axyz']);
    });

    // ----- Tri secondaire par proximité de longueur -----
    it('should break ties by closest length to the search term', () => {
      // "gros" (4 lettres), score 1 pour "gras" (4) et "agressif" (8)
      // gras est plus proche en longueur → gras avant agressif
      const terms = ['agressif', 'gras'];
      const result = service.suggest('gros', terms, 2);
      expect(result).toEqual(['gras', 'agressif']);
    });

    it('should prefer shorter length difference on tie', () => {
      // Terme "ab", candidats de score identique mais longueurs différentes
      // "ab" (2) vs "abx" (3, score 0 fenêtre "ab") vs "abxyz" (5, score 0 fenêtre "ab")
      const terms = ['abxyz', 'abx', 'ab'];
      const result = service.suggest('ab', terms, 3);
      // Tous score 0. Longueurs: ab=2(diff 0), abx=3(diff 1), abxyz=5(diff 3)
      expect(result).toEqual(['ab', 'abx', 'abxyz']);
    });

    // ----- Tri tertiaire par ordre alphabétique -----
    it('should break ties on same score and same length by alphabetical order', () => {
      // Termes de même longueur et même score
      const terms = ['cros', 'bros', 'aros'];
      // Chacun a 1 différence avec "gros" (première lettre), longueur identique (4)
      const result = service.suggest('gros', terms, 3);
      expect(result).toEqual(['aros', 'bros', 'cros']);
    });

    it('should apply all three sorting criteria together', () => {
      // Mélange de scores, longueurs et alphabétique
      const terms = ['gros', 'gras', 'agressif', 'gris', 'grus'];
      // gros → score 0, len 4
      // gras → score 1, len 4
      // gris → score 1, len 4
      // grus → score 1, len 4
      // agressif → score 1, len 8
      // Tri : gros(0), puis parmi score 1 : gras(4), gris(4), grus(4), agressif(8)
      // Parmi len 4 et score 1 : alphabétique → gras, gris, grus
      const result = service.suggest('gros', terms, 5);
      expect(result).toEqual(['gros', 'gras', 'gris', 'grus', 'agressif']);
    });

    // ----- Inclusion / substring -----
    it('should detect a term fully contained in a longer word with 0 differences', () => {
      const terms = ['automobile'];
      // "auto" est une sous-chaîne de "automobile" → score 0
      const result = service.suggest('auto', terms, 1);
      expect(result).toEqual(['automobile']);
    });

    it('should handle the term appearing at different positions', () => {
      // "art" dans "smart" → sm[art] → score 0
      const terms = ['smart', 'start', 'party'];
      // smart: art positions → sma=2, mar=2, art=0 → score 0
      // start: sta=2, tar=1, art=0 → score 0
      // party: par=1, art=0 → score 0
      const result = service.suggest('art', terms, 3);
      // Tous score 0, tri par longueur puis alpha : art(3)→aucun, party(5), smart(5), start(5)
      // party, smart, start (même longueur 5, alphabétique)
      expect(result).toEqual(['party', 'smart', 'start']);
    });

    // ----- Termes identiques dans la liste -----
    it('should handle duplicate terms in the list', () => {
      const terms = ['gros', 'gros', 'gras'];
      const result = service.suggest('gros', terms, 3);
      expect(result).toEqual(['gros', 'gros', 'gras']);
    });

    // ----- Terme de recherche d'un seul caractère -----
    it('should work with a single character search term', () => {
      const terms = ['a', 'b', 'ab', 'ba', 'xyz'];
      // 'a' (len 1) : a→0, b→1, ab→0(fenêtre a ou b, a=0), ba→0, xyz→0(x→1,y→1,z→1 min=1... non)
      // Attendons : terme "a" dans "xyz" → x=1, y=1, z=1 → min=1
      // a→0, b→1, ab→0(a), ba→0(a), xyz→1
      // Tri: score 0 → a(1), ab(2), ba(2) ; score 1 → b(1), xyz(3)
      // score 0 par longueur : a (diff 0), ab et ba (diff 1, alpha: ab, ba)
      const result = service.suggest('a', terms, 5);
      expect(result).toEqual(['a', 'ab', 'ba', 'b', 'xyz']);
    });

    // ----- Aucun terme exact, que des approximations -----
    it('should return best approximations when no exact match exists', () => {
      const terms = ['chat', 'chop', 'coup', 'chef'];
      // Recherche "chap" :
      // chat → 1 (t≠p), chop → 1 (o≠a), coup → 2 (o≠h, u≠a), chef → 2 (e≠a, f≠p)
      const result = service.suggest('chap', terms, 2);
      // Score 1 : chat(4) et chop(4), même longueur → alphabétique : chat, chop
      expect(result).toEqual(['chat', 'chop']);
    });

    // ----- Grand nombre de candidats -----
    it('should correctly limit results to count', () => {
      const terms = ['aaaa', 'aaab', 'aaba', 'abaa', 'baaa', 'aabb', 'abab'];
      const result = service.suggest('aaaa', terms, 3);
      // aaaa→0, aaab→1, aaba→1, abaa→1, baaa→1, aabb→2, abab→2
      // Top 3 : aaaa(0), puis parmi score 1 (tous len 4) → alpha : aaab, aaba
      expect(result).toEqual(['aaaa', 'aaab', 'aaba']);
    });

    // ----- Termes avec caractères alphanumériques -----
    it('should handle alphanumeric terms', () => {
      const terms = ['abc1', 'abc2', 'xyz9'];
      const result = service.suggest('abc1', terms, 2);
      expect(result).toEqual(['abc1', 'abc2']);
    });

    // ----- Fenêtre glissante — meilleur match au milieu du mot -----
    it('should find the best sliding window match in the middle of a word', () => {
      const terms = ['xxabcxx'];
      // "abc" dans "xxabcxx" : xx[a]=2, x[ab]=1, [abc]=0, bcx=2, cxx=3, ...
      // Meilleur = 0
      const result = service.suggest('abc', terms, 1);
      expect(result).toEqual(['xxabcxx']);
    });

    // ----- Vérification de la longueur minimale stricte -----
    it('should exclude candidates with length strictly less than term length', () => {
      const terms = ['ab', 'abc', 'abcd', 'abcde'];
      // terme "abc" (len 3) : ab(2) exclus, abc(3)→0, abcd(4)→0, abcde(5)→0
      const result = service.suggest('abc', terms, 4);
      expect(result).toEqual(['abc', 'abcd', 'abcde']);
    });

    // ----- Symétrie de la proximité de longueur -----
    it('should rank by absolute difference in length, not just shorter/longer', () => {
      // terme "abcd" (len 4)
      // Candidats avec score 0 : "abcd" (len 4, diff 0), "xabcdx" (len 6, diff 2), "xabcd" (len 5, diff 1)
      const terms = ['xabcdx', 'xabcd', 'abcd'];
      const result = service.suggest('abcd', terms, 3);
      // Tous score 0, tri par |longueur - 4| : abcd(0), xabcd(1), xabcdx(2)
      expect(result).toEqual(['abcd', 'xabcd', 'xabcdx']);
    });
  });
});
