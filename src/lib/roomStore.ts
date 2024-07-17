import { writable } from 'svelte/store';

export interface Room {
    id: string;
    name: string;
}

const roomStore = writable<Room[]>([]);

export default roomStore;
