import { writable } from 'svelte/store';

export interface Message {
    from: string; // user email
    uid: string;
    content: string;
    timestamp: number;
}

const messageStore = writable<Message[]>([]);

export function getMetrics(messages: Message[], targetUid: string) {
    let S = 0; // Words sent by the user with the provided ID
    let R = 0; // Words sent by other users

    messages.forEach(message => {
        const wordCount = message.content.split(' ').filter(word => word.length > 0).length;

        if (message.uid === targetUid) {
            S += wordCount;
        } else {
            R += wordCount;
        }
    });

    return { S, R };
}

export default messageStore;
