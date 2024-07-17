import { writable } from 'svelte/store';

export interface Message {
    from: string;
    content: string;
    timestamp: number;
}

const messageStore = writable<Message[]>([]);

export default messageStore;
