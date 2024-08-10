import { atom } from 'jotai';

export const selectedOptionsAtom = atom<string[]>([]);
export const submissionStateAtom = atom<'correct' | 'wrong' | null>(null);
export const questionSubmissionStateAtom = atom<(null | 'correct' | 'wrong')[]>([]);
export const selectedOptionsPerQuestionAtom = atom<string[][]>([]);
