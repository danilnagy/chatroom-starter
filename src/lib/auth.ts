import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { subscribeToMessages, type Message } from '../lib/massaging';

import userStore from './userStore';
import messageStore from './messageStore';

export async function signUp(email: string, password: string): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  userStore.set({ email: user.email!, uid: user.uid });
}

export async function logIn(email: string, password: string): Promise<void> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  userStore.set({ email: user.email!, uid: user.uid });
}

export async function logOut(): Promise<void> {
  await signOut(auth);
  userStore.set(null);
}

// Listen to authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    userStore.set({ email: user.email!, uid: user.uid });
    console.log(`Subscribing user: ${user.email}`)
    subscribeToMessages((newMessages: Message[]) => {
      messageStore.set(newMessages);
    });
  } else {
    userStore.set(null);
  }
});
