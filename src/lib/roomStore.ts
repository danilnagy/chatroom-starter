import { writable } from 'svelte/store';

export interface Room {
    id: string;
    name: string;
    timestamp: number;
}

const roomStore = writable<Room[]>([]);

export default roomStore;
