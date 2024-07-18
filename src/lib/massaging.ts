import { db } from './firebase';

import { collection, addDoc, doc, getDocs, increment, limit, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';

import { type Message } from './messageStore';
import roomStore, { type Room } from './roomStore';
import wordStore from './wordStore';
import { type User } from './userStore';

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
        timestamp: Date.now(),
        userCount: 1,
        exposeCount: 0,
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

export async function incrementExposeCount(roomId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);

    try {
        await updateDoc(roomRef, {
            exposeCount: increment(1),
        });
        console.log(`Incremented exposeCount for room ${roomId}`);
    } catch (error) {
        console.error(`Failed to increment exposeCount for room ${roomId}:`, error);
    }
}

export async function incrementUserCount(roomId: string): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);

    try {
        await updateDoc(roomRef, {
            userCount: increment(1),
        });
        console.log(`Incremented userCount for room ${roomId}`);
    } catch (error) {
        console.error(`Failed to increment userCount for room ${roomId}:`, error);
    }
}

export async function setUserCount(roomId: string, userCount: number): Promise<void> {
    const roomRef = doc(db, 'rooms', roomId);

    try {
        await updateDoc(roomRef, {
            userCount,
        });
        console.log(`Set userCount for room ${roomId}`);
    } catch (error) {
        console.error(`Failed to set userCount for room ${roomId}:`, error);
    }
}

export async function fetchSingleRoom(user: User, callback: (messages: Message[]) => void) {
    const q = query(
        collection(db, 'rooms'),
        where('userCount', '==', 1),
        orderBy('exposeCount'),
        orderBy('timestamp'),
        limit(1)
    );
    const querySnapshot = await getDocs(q);

    const rooms: Room[] = [];

    querySnapshot.forEach((doc) => {
        rooms.push({ ...doc.data() as Room, id: doc.id });
    });

    roomStore.set(rooms);

    if (rooms.length > 0) {
        const room = rooms[0];
        await incrementExposeCount(room.id);

        console.log(`Subscribing User: ${user.email} to Room:  ${room.id}`);
        subscribeToMessages(room.id, (newMessages) => {
            callback(newMessages);
        });
    }
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

export async function fetchWords() {
    const wordsRef = collection(db, 'words');
    const wordsSnapshot = await getDocs(wordsRef);
    const words: { [key: string]: string } = {};

    wordsSnapshot.forEach((doc) => {
        const data = doc.data();
        words[data.key] = data.url;
    });

    console.log(`Received: ${Object.keys(words).length} words`);
    wordStore.set(words);
}
