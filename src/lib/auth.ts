import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

import userStore from './userStore';

export async function signUp(email: string, password: string): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
}

export async function logIn(email: string, password: string): Promise<void> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Listen to authentication state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    userStore.set({ email: user.email!, uid: user.uid });
  } else {
    userStore.set(null);
  }
});
