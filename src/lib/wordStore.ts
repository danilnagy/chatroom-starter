import { writable } from 'svelte/store';

interface WordLookup {
    [key: string]: string;
}

const wordStore = writable<WordLookup>({});

export default wordStore;