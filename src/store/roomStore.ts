import { writable } from 'svelte/store';

export interface Room {
    id: string;
    name: string;
    timestamp: number;
    userCount: number;
    exposeCount: number;
    messageCount?: number;
}

const roomStore = writable<Room | undefined>(undefined);

export default roomStore;