import { atom } from 'jotai';
import { Question } from '../interfaces';

export const questionsAtom = atom<Question[]>([]);
export const questionCountAtom = atom<number>(0);
