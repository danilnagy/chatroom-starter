import { writable } from 'svelte/store';
import { type User as FirebaseUser } from 'firebase/auth';

export interface User {
    email: string;
    uid: string;
    verified: boolean;
    firebaseUser: FirebaseUser;
    userName?: string;
    currentRoomId?: string;
    timestamp?: number;
    admin?: boolean;
    rating?: number;
}

const userStore = writable<User | null>(null);

export default userStore;
