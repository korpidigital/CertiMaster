import { atom } from 'jotai';

interface Question {
    id: string;
    certification: string;
    topic: string;
    subtopic: string;
    detail: string;
    type: string;
    question: string;
    options: string[];
    correctAnswer: string[];
    explanation: string;
    order: string;
    approved: boolean;
}

const questionsAtom = atom<Question[]>([]);

export default questionsAtom;