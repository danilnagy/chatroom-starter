import { db } from './firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';

export interface Message {
    from: string;
    content: string;
    timestamp: number;
}

export async function sendMessage(user: string, content: string): Promise<void> {
    const messagesRef = collection(db, 'messages');
    await addDoc(messagesRef, {
        from: user,
        content,
        timestamp: Date.now()
    });
}

export function subscribeToMessages(callback: (messages: Message[]) => void): void {
    const messagesRef = collection(db, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));
    onSnapshot(q, (snapshot) => {
        const messages: Message[] = [];
        snapshot.forEach((doc) => {
            messages.push(doc.data() as Message);
        });
        callback(messages);
    });
}
