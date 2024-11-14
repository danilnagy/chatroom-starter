import { writable } from 'svelte/store';
import { type User } from '../store/userStore';

interface ModalState {
    isOpen: boolean;
    state: string;  // Add the signUpState property
    callback: Function;
    onClose?: Function;
}

export const modalState = writable<ModalState>({
    isOpen: false,
    state: 'SIGNUP',
    callback: () => { },
});

export function openModal(state = 'SIGNUP', callback: (user: User, run: boolean) => void, onClose: () => void) {
    modalState.set({ isOpen: true, state, callback, onClose });
}

export function closeModal() {
    modalState.update(current => {
        if (typeof current.onClose === 'function') {
            current.onClose();
        }
        return { ...current, isOpen: false }
    });
}

export function toggleState() {
    modalState.update(current => ({ ...current, state: current.state === 'SIGNUP' ? 'LOGIN' : 'SIGNUP' }));
}