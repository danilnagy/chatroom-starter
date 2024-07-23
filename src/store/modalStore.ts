import { writable } from 'svelte/store';

interface ModalState {
    isOpen: boolean;
    signUpState: boolean;  // Add the signUpState property
}

export const modalState = writable<ModalState>({
    isOpen: false,
    signUpState: false,
});

export function openModal(signUpState = false) {
    modalState.set({ isOpen: true, signUpState });
}

export function closeModal() {
    modalState.update(state => ({ ...state, isOpen: false }));
}

export function toggleState() {
    modalState.update(state => ({ ...state, signUpState: !state.signUpState }));
}