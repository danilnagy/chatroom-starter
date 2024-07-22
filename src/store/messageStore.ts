import { writable } from 'svelte/store';

export interface Message {
    from: string; // user email
    uid: string;
    content: string;
    timestamp: number;
}

const messageStore = writable<Message[]>([]);

export default messageStore;
