export interface AnswerScoreModel {
  answer: string;
  specialties: string[];
}

export interface TestQuestionModel {
  id: number;
  text: string;
  options: string[];
  answer_scores: AnswerScoreModel[];
  image_url?: string | null;
  documents: any[];
  multiple_choice: boolean;
}
