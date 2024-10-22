import { writable } from 'svelte/store';
import { type User } from '../store/userStore';

interface ModalState {
    isOpen: boolean;
    state: string;  // Add the signUpState property
    callback: Function;
}

export const modalState = writable<ModalState>({
    isOpen: false,
    state: 'SIGNUP',
    callback: () => { },
});

export function openModal(state = 'SIGNUP', callback: (user: User, run: boolean) => void) {
    modalState.set({ isOpen: true, state, callback });
}

export function closeModal() {
    modalState.update(current => ({ ...current, isOpen: false }));
}

export function toggleState() {
    modalState.update(current => ({ ...current, state: current.state === 'SIGNUP' ? 'LOGIN' : 'SIGNUP' }));
}