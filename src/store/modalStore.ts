import { writable } from 'svelte/store';

interface ModalState {
    isOpen: boolean;
    signUpState: boolean;  // Add the signUpState property
    callback: Function;
}

export const modalState = writable<ModalState>({
    isOpen: false,
    signUpState: false,
    callback: () => { },
});

export function openModal(signUpState = false, callback: () => void) {
    modalState.set({ isOpen: true, signUpState, callback });
}

export function closeModal() {
    modalState.update(state => ({ ...state, isOpen: false }));
}

export function toggleState() {
    modalState.update(state => ({ ...state, signUpState: !state.signUpState }));
}