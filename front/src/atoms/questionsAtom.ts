import { atom } from 'jotai';
import { Question } from '../interfaces/question';

const questionsAtom = atom<Question[]>([]);

export default questionsAtom;