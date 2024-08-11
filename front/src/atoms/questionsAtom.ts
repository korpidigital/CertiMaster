import { atom } from 'jotai';
import { Question } from '../interfaces';

const questionsAtom = atom<Question[]>([]);

export default questionsAtom;