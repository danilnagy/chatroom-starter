import { writable } from 'svelte/store';

export interface User {
    email: string;
    uid: string;
    userName?: string;
    currentRoomId?: string;
    timestamp?: number;
    admin?: boolean;
    rating?: number;
}

const userStore = writable<User | null>(null);

export default userStore;
