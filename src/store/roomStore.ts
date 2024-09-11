import { writable } from 'svelte/store';

export interface Room {
    id: string;
    name: string;
    timestamp: number;
    userCount: number;
    exposeCount: number;
    open: boolean;
    messageCount?: number;
}

export interface RoomPartial {
    userCount: number;
    open: boolean;
}

const roomStore = writable<Room | undefined>(undefined);

export default roomStore;
