import { writable } from 'svelte/store';

export const popupVisible = writable<boolean>(false);
export const scrolling = writable<boolean>(false);
export const menuOpenStore = writable<boolean>(false);
export const soundsEnabledStore = writable<boolean>(true);
export const notificationsEnabledStore = writable<boolean>(true);
export const soundsAvailableStore = writable<boolean>(false);
export const notificationsAvailableStore = writable<boolean>(false);
