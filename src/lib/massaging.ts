import { db } from './firebase';
import {
	collection,
	addDoc,
	doc,
	getDoc,
	getDocs,
	increment,
	limit,
	query,
	where,
	orderBy,
	onSnapshot,
	updateDoc,
	writeBatch
} from 'firebase/firestore';

import { updateUserRoom } from '../lib/auth';
import { reloadPage } from '../lib/utils';

import { get } from 'svelte/store';
import messageStore, { type Message } from '../store/messageStore';
import roomStore, { type Room, type RoomPartial } from '../store/roomStore';
import wordStore from '../store/wordStore';
import { type User } from '../store/userStore';
import usersStore, { type ReducedUser, type UserLookup } from '../store/usersStore';
import loadedStore from '../store/loadedStore';

async function fetchUserNames(userIds: string[]): Promise<void> {
	const newUsers: ReducedUser[] = [];
	const newLookup: UserLookup = {};

	for (const uid of userIds) {
		const userRef = doc(db, 'users', uid);

		const userSnap = await getDoc(userRef);

		if (userSnap.exists()) {
			const userData = userSnap.data();
			if (userData) {
				const newUser: ReducedUser = { userName: userData.userName };
				console.log(`Got data for new User: ${uid} - ${newUser.userName}`);
				newUsers.push(newUser);
				newLookup[uid] = newUser;
			}
		}
	}

	usersStore.update((currentUsers) => {
		return {
			...currentUsers,
			...newLookup
		};
	});
}

function getUniqueUIDs(messages: { uid: string; [key: string]: any }[]): string[] {
	const uidSet = new Set<string>();

	messages.forEach((message) => {
		if (message.uid && !Object.keys(get(usersStore)).includes(message.uid)) {
			uidSet.add(message.uid);
		}
	});

	return Array.from(uidSet);
}

export function subscribeToRoom(roomId: string, callback: (room: Room) => void): void {
	const roomRef = doc(db, 'rooms', roomId);

	const unsubscribe = onSnapshot(roomRef, (doc) => {
		if (doc.exists()) {
			const data = doc.data();
			if (data) {
				callback({ ...(doc.data() as Room), id: doc.id } as Room);
			}
		}
	});
}

export function subscribeToRooms(callback: (rooms: Room[]) => void): void {
	const roomsRef = collection(db, `rooms`);
	const q = query(roomsRef, orderBy('timestamp', 'desc'), limit(50));

	const unsubscribe = onSnapshot(q, async (snapshot) => {
		const rooms: Room[] = [];
		for (const doc of snapshot.docs) {
			const room = doc.data();
			rooms.push({ id: doc.id, ...room } as Room);
		}
		callback(rooms);
	});
}

export function subscribeToMessages(roomId: string, callback: (messages: Message[]) => void): void {
	const messagesRef = collection(db, `rooms/${roomId}/messages`);
	const q = query(messagesRef, orderBy('timestamp'));

	const unsubscribe = onSnapshot(q, (snapshot) => {
		const messages: Message[] = [];
		snapshot.forEach((doc) => {
			messages.push(doc.data() as Message);
		});
		callback(messages);
	});
}

export function subscribeToUsers(callback: (users: User[]) => void): void {
	const usersRef = collection(db, `users`);
	const q = query(usersRef, orderBy('timestamp', 'desc'), limit(50));

	const unsubscribe = onSnapshot(q, (snapshot) => {
		const users: User[] = [];
		snapshot.forEach((doc) => {
			users.push(doc.data() as User);
		});
		callback(users);
	});
}

export async function subscribeAll(
	user: User | null,
	roomId: string,
	temp: boolean,
	callback: Function
) {
	subscribeToRoom(roomId, async (roomData) => {
		console.log('-> Incoming [roomData]: ', roomData);
		if (roomData.userCount === 0) {
			if (user) {
				await updateUserRoom(user, '');
			}
			reloadPage();
		}
		if (temp && (roomData.userCount === 2 || roomData.open === false)) {
			reloadPage();
		}
		roomStore.set(roomData);
		callback();
	});
	subscribeToMessages(roomId, async (messageData) => {
		console.log('-> Incoming [messageData]: ', messageData);

		// process incoming messages
		const uniqueIds = getUniqueUIDs(messageData);
		if (uniqueIds.length > 0) await fetchUserNames(uniqueIds);

		messageStore.set(messageData);
	});
}

export async function createRoom(name: string): Promise<string> {
	const roomsRef = collection(db, 'rooms');
	const roomDoc = await addDoc(roomsRef, {
		name,
		timestamp: Date.now(),
		userCount: 1,
		exposeCount: 0,
		messageCount: 0,
		open: true
	});
	return roomDoc.id;
}

export async function clearRoom(roomId: string): Promise<void> {
	const batch = writeBatch(db);
	const messagesRef = collection(db, `rooms/${roomId}/messages`);
	const querySnapshot = await getDocs(messagesRef);

	querySnapshot.forEach((doc) => {
		batch.delete(doc.ref);
	});

	try {
		await batch.commit();
		console.log(`All messages in room ${roomId} have been cleared.`);
	} catch (error) {
		console.error(`Failed to clear messages in room ${roomId}:`, error);
	}
}

export async function incrementExposeCount(roomId: string): Promise<void> {
	const roomRef = doc(db, 'rooms', roomId);

	try {
		await updateDoc(roomRef, {
			exposeCount: increment(1),
			timestamp: Date.now()
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
			timestamp: Date.now()
		});
		console.log(`Incremented userCount for room ${roomId}`);
	} catch (error) {
		console.error(`Failed to increment userCount for room ${roomId}:`, error);
	}
}

export async function incrementMessageCount(roomId: string): Promise<void> {
	const roomRef = doc(db, 'rooms', roomId);

	try {
		await updateDoc(roomRef, {
			messageCount: increment(1),
			timestamp: Date.now()
		});
		console.log(`Incremented messageCount for room ${roomId}`);
	} catch (error) {
		console.error(`Failed to increment messageCount for room ${roomId}:`, error);
	}
}

export async function updateRoom(roomId: string, payload: RoomPartial): Promise<void> {
	const roomRef = doc(db, 'rooms', roomId);

	try {
		await updateDoc(roomRef, {
			...payload,
			timestamp: Date.now()
		});
		console.log(`Update room ${roomId}`);
	} catch (error) {
		console.error(`Failed to update room ${roomId}:`, error);
	}
}

export async function fetchRoom(user: User | null, callback: Function) {
	if (user) {
		if (user.currentRoomId) {
			console.log(`Subscribing User: ${user.email} to existing Room: ${user.currentRoomId}`);
			await subscribeAll(user, user.currentRoomId, false, callback);
		} else {
			const room = await fetchSingleRoom();
			if (room) {
				await incrementExposeCount(room.id);
				console.log(`Subscribing User: ${user.email} to new Room: ${room.id}`);
				await subscribeAll(user, room.id, true, callback);
			} else {
				callback();
			}
		}
	} else {
		const room = await fetchSingleRoom();
		if (room) {
			await incrementExposeCount(room.id);
			console.log(`Subscribing Anonymous user to new Room: ${room.id}`);
			await subscribeAll(null, room.id, true, callback);
		} else {
			callback();
		}
	}
}

export async function fetchSingleRoom() {
	const q = query(
		collection(db, 'rooms'),
		where('userCount', '==', 1),
		where('open', '==', true),
		orderBy('exposeCount'),
		orderBy('timestamp'),
		limit(1)
	);
	const querySnapshot = await getDocs(q);

	const rooms: Room[] = [];

	querySnapshot.forEach((doc) => {
		rooms.push({ ...(doc.data() as Room), id: doc.id });
	});

	return rooms[0];
}

export async function sendMessage(roomId: string, user: User, content: string): Promise<void> {
	const messagesRef = collection(db, `rooms/${roomId}/messages`);
	await addDoc(messagesRef, {
		// from: user.email,
		uid: user.uid,
		content,
		timestamp: Date.now()
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
