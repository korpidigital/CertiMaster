import { atom } from 'jotai';

// Atom to store if the user has an active subscription
export const isSubscriptionActiveAtom = atom<boolean>(false);

// Atom to store user's email
export const userEmailAtom = atom<string>('');

