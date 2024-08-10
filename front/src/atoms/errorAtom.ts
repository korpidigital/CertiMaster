import { atom } from 'jotai';

const errorAtom = atom<string | null>(null);

export default errorAtom;