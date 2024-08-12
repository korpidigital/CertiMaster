import { atom } from 'jotai';

export interface QuestionSubmission {
    questionId: string;
    correct: boolean;
    selectedOptions: string[];
}

export const selectedOptionsAtom = atom<string[]>([]);
export const submissionStateAtom = atom<'correct' | 'wrong' | null>(null);
export const questionSubmissionStateAtom = atom<QuestionSubmission[]>([]);
export const selectedOptionsPerQuestionAtom = atom<string[][]>([]);
