import { auth } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from 'firebase/auth';

import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import userStore, { type User } from '../store/userStore';
import usersStore, { type UserLookup } from '../store/usersStore';

export async function signUp(userName: string, email: string, password: string): Promise<void> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  const uid = user.uid;

  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { uid, userName, currentRoomId: '', timestamp: Date.now() });
  console.log(`Created new user document for user ${uid}`);

}

export async function logIn(email: string, password: string): Promise<void> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
}

export async function logOut(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function getUserData(uid: string): Promise<User | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = docSnap.data() as User;
      await updateUserTimestamp(userData);
      return userData;
    } else {
      // Create a new user document if it does not exist
      await setDoc(userRef, { uid, currentRoomId: '', timestamp: Date.now() });
      console.log(`Created new user document for user ${uid}`);
      return { uid, currentRoomId: '', timestamp: Date.now() } as User;
    }
  } catch (error) {
    console.error(`Failed to fetch data for user ${uid}:`, error);
    return null;
  }
}

export async function updateUserRoom(user: User, roomId: string): Promise<void> {
  const userRef = doc(db, 'users', user.uid);

  try {
    await setDoc(userRef, { uid: user.uid, currentRoomId: roomId }, { merge: true });
    userStore.set({ ...user, currentRoomId: roomId })
    console.log(`Updated currentRoomId for user ${user.uid} to ${roomId}`);
  } catch (error) {
    console.error(`Failed to update currentRoomId for user ${user.uid}:`, error);
  }
}

export async function updateUserTimestamp(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);

  try {
    await setDoc(userRef, { uid: user.uid, timestamp: Date.now() }, { merge: true });
    userStore.set({ ...user, timestamp: Date.now() })
    console.log(`Updated timestamp for user ${user.uid} to ${Date.now()}`);
  } catch (error) {
    console.error(`Failed to update timestamp for user ${user.uid}:`, error);
  }
}

function isUser(obj: any): obj is User {
  return obj && typeof obj === 'object' && 'userName' in obj;
}

// Listen to authentication state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userData: User | {} = await getUserData(user.uid) || {}
    userStore.set({
      email: user.email!,
      uid: user.uid,
      ...userData
    });

    const newLookup: UserLookup = {};
    newLookup[user.uid] = {
      // userName: isUser(userData) && userData.userName ? userData.userName : ''
      userName: 'You'
    };

    if (isUser(userData)) {
      usersStore.update(currentUsers => {
        return {
          ...currentUsers,
          ...newLookup
        };
      });
    }

  } else {
    userStore.set(null);
    usersStore.set({})
  }
});
