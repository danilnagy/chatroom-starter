import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { type Message } from './messageStore';

export async function sendMessage(roomId: string, user: string, content: string): Promise<void> {
    const messagesRef = collection(db, `rooms/${roomId}/messages`);
    await addDoc(messagesRef, {
        from: user,
        content,
        timestamp: Date.now()
    });
}

export function subscribeToMessages(roomId: string, callback: (messages: Message[]) => void): void {
    const messagesRef = collection(db, `rooms/${roomId}/messages`);
    const q = query(messagesRef, orderBy('timestamp'));
    onSnapshot(q, (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
            messages.push(doc.data() as Message);
        });
        callback(messages);
    });
}

export async function createRoom(name: string): Promise<string> {
    const roomsRef = collection(db, 'rooms');
    const roomDoc = await addDoc(roomsRef, { name });
    return roomDoc.id;
}

export function subscribeToRooms(callback: (rooms: { id: string; name: string }[]) => void): void {
    const roomsRef = collection(db, 'rooms');
    onSnapshot(roomsRef, (snapshot) => {
        const rooms: { id: string; name: string }[] = [];
        snapshot.forEach((doc) => {
            rooms.push({ id: doc.id, name: doc.data().name });
        });
        callback(rooms);
    });
}

