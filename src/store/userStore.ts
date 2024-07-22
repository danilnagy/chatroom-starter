import { writable } from 'svelte/store';

export interface User {
    email: string;
    uid: string;
    userName?: string;
    currentRoomId?: string;
    timestamp?: number;
    admin?: boolean;
}

const userStore = writable<User | null>(null);

export default userStore;
