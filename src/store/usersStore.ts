import { writable } from 'svelte/store';

export interface ReducedUser {
    userName: string;
}

export interface UserLookup {
    [key: string]: ReducedUser;
}

const usersStore = writable<UserLookup>({});

export default usersStore;