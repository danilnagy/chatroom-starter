import { writable } from 'svelte/store';

const loadedStore = writable<boolean>(false);

export default loadedStore;
