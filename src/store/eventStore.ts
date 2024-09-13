import { writable } from 'svelte/store';

export const popupVisible = writable<boolean>(false);
export const scrolling = writable<boolean>(false);
export const menuOpenStore = writable<boolean>(false);