import { writable } from 'svelte/store';

export interface User {
    email: string;
    uid: string;
}

const userStore = writable<User | null>(null);

export default userStore;
