import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
import { type Message } from './messageStore';
import roomStore, { type Room } from './roomStore';

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
    const roomDoc = await addDoc(roomsRef, {
        name,
        timestamp: Date.now()
    });
    return roomDoc.id;
}

export async function fetchRooms() {
    const roomsRef = collection(db, 'rooms');
    const roomsSnapshot = await getDocs(roomsRef);

    const rooms: Room[] = [];

    roomsSnapshot.forEach((doc) => {
        rooms.push({ ...doc.data() as Room, id: doc.id });
    });

    console.log(`Received: ${rooms.length} rooms`);

    roomStore.set(rooms);
}

export function subscribeToRooms(callback: (rooms: Room[]) => void): void {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, orderBy('timestamp'));
    onSnapshot(q, (snapshot) => {
        const rooms: Room[] = [];
        snapshot.forEach((doc) => {
            rooms.push({ ...doc.data() as Room, id: doc.id });
        });
        callback(rooms);
    });
}
