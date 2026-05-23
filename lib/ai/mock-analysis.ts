import type { AnalysisResult } from './schemas'
import { calculateScore } from '@/lib/scoring/calculate-score'

const criteria_scores: AnalysisResult['criteria_scores'] = [
  { criterion: 'goal_clarity', raw_score_0_10: 7, rationale: 'Cel jest częściowo jasny, ale brakuje mierzalnego rezultatu.', improvement_suggestion: 'Dodaj konkretny cel i kryteria sukcesu.' },
  { criterion: 'context_completeness', raw_score_0_10: 6, rationale: 'Kontekst jest zbyt ogólny.', improvement_suggestion: 'Dodaj odbiorcę, branżę i ograniczenia wejściowe.' },
  { criterion: 'structure', raw_score_0_10: 7, rationale: 'Prompt ma sens, ale wymaga sekcji.', improvement_suggestion: 'Podziel prompt na rolę, zadanie, dane, ograniczenia i format.' },
  { criterion: 'constraints', raw_score_0_10: 5, rationale: 'Brakuje twardych ograniczeń.', improvement_suggestion: 'Dodaj limity długości, styl i zakazy.' },
  { criterion: 'output_format', raw_score_0_10: 4, rationale: 'Nie określono formatu odpowiedzi.', improvement_suggestion: 'Wskaż listę, tabelę, JSON albo checklistę.' },
  { criterion: 'model_profile_fit', raw_score_0_10: 7, rationale: 'Prompt jest ogólnie zgodny z profilem LLM.', improvement_suggestion: 'Unikaj niezweryfikowanych wymagań specyficznych dla modelu.' },
  { criterion: 'resistance_to_misinterpretation', raw_score_0_10: 6, rationale: 'Istnieje ryzyko różnej interpretacji zakresu.', improvement_suggestion: 'Dodaj definicje, przykłady i kryteria odrzucenia.' },
  { criterion: 'cost_efficiency', raw_score_0_10: 7, rationale: 'Prompt nie jest ekstremalnie długi.', improvement_suggestion: 'Usuń powtórzenia i niepotrzebne konteksty.' },
  { criterion: 'safety', raw_score_0_10: 8, rationale: 'Brak oczywistych sekretów w mocku.', improvement_suggestion: 'Zachowaj ostrzeżenie o danych wrażliwych.' },
  { criterion: 'testability', raw_score_0_10: 6, rationale: 'Brakuje sposobu oceny wyniku.', improvement_suggestion: 'Dodaj checklistę akceptacji odpowiedzi.' }
]

const score = calculateScore(criteria_scores)

export const mockAnalysisResult: AnalysisResult & { overallScore: number; scoreLevel: string } = {
  overall_summary: 'Prompt ma dobry kierunek, ale wymaga jaśniejszego celu, formatu odpowiedzi i kryteriów jakości.',
  detected_task_type: 'general_prompt_improvement',
  criteria_scores,
  top_weaknesses: [
    'Brak precyzyjnego formatu wyniku.',
    'Za mało kontekstu o odbiorcy i celu.',
    'Brak kryteriów jakości i ograniczeń.'
  ],
  improvement_plan: [
    'Zdefiniuj rolę modelu.',
    'Dodaj cel zadania i kontekst.',
    'Wskaż format wyniku.',
    'Dodaj ograniczenia i kryteria akceptacji.'
  ],
  improved_prompt: `Jesteś ekspertem od prompt engineeringu.

Zadanie: przeanalizuj poniższy prompt i popraw go tak, aby dawał bardziej precyzyjne, praktyczne i powtarzalne odpowiedzi.

Kontekst: użytkownik chce otrzymać wynik gotowy do użycia w pracy.

Wynik zwróć w formacie:
1. Krótka diagnoza.
2. Lista 3–5 najważniejszych problemów.
3. Poprawiony prompt w bloku kodu.
4. Wyjaśnienie zmian.

Ograniczenia: nie wydłużaj promptu bez potrzeby, nie wymyślaj faktów i oznacz dane niepewne.`,
  change_explanations: [
    'Dodano rolę i konkretny cel.',
    'Dodano wymagany format odpowiedzi.',
    'Dodano ograniczenia ograniczające halucynacje i nadmierną długość.'
  ],
  model_fit_notes: ['Profil modelu jest traktowany jako ogólny; nie zakładamy niezweryfikowanych capabilities.'],
  uncertainty_warnings: ['Nie podawaj cen, benchmarków ani limitów modeli bez aktualnego źródła.'],
  safety_notes: ['Nie wklejaj sekretów, haseł, tokenów ani danych klientów.'],
  overallScore: score.overallScore,
  scoreLevel: score.scoreLevel
}
