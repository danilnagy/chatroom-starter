import { auth, db } from './firebase';
import {
	createUserWithEmailAndPassword,
	deleteUser,
	EmailAuthProvider,
	signInWithEmailAndPassword,
	reauthenticateWithCredential,
	onAuthStateChanged,
	signOut,
	sendEmailVerification,
	sendPasswordResetEmail,
	sendSignInLinkToEmail,
	getAuth,
	isSignInWithEmailLink,
	signInWithEmailLink,
	type User as FirebaseUser
} from 'firebase/auth';
import {
	collection,
	doc,
	addDoc,
	getDoc,
	setDoc,
	deleteDoc,
	query,
	orderBy,
	limit,
	getDocs,
	where
} from 'firebase/firestore';

import userStore, { type User } from '../store/userStore';
import usersStore, { type UserLookup } from '../store/usersStore';
import { modalState } from '../store/modalStore';

import { goHome } from '../lib/utils';
import { tick } from 'svelte';

export async function sendVerificationEmail(user: FirebaseUser): Promise<void> {
	await sendEmailVerification(user);
	console.log('Verification email sent!');
}

export async function signUp(userName: string, email: string, password: string, verify: boolean = false): Promise<void> {
	const userCredential = await createUserWithEmailAndPassword(auth, email, password);
	const user = userCredential.user;

	if (verify) await sendVerificationEmail(user);

	const uid = user.uid;
	const userRef = doc(db, 'users', uid);
	await setDoc(userRef, { uid, userName, currentRoomId: '', timestamp: Date.now(), rating: 5 });

	const emailsRef = collection(db, 'emails');
	await addDoc(emailsRef, { email });

	userStore.update((user) => {
		if (user) {
			return { ...user, userName }; // Update only `userName`
		}
		return user; // Return the original user object if it's `null`
	});

	console.log(`Created new user document for user ${uid}`);
}

export async function logIn(email: string, password: string): Promise<void> {
	await signInWithEmailAndPassword(auth, email, password);
	// const userCredential = await signInWithEmailAndPassword(auth, email, password);
	// const user = userCredential.user;
}

export async function logOut(): Promise<void> {
	await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
	await sendPasswordResetEmail(auth, email);
}

export async function sendSignInLink(email: string): Promise<void | null> {
	const actionCodeSettings = {
		// URL you want to redirect back to. The domain (www.example.com) for this
		// URL must be in the authorized domains list in the Firebase Console.
		url: 'https://tincann.ing/',
		// This must be true.
		handleCodeInApp: true
		// iOS: {
		//   bundleId: 'com.example.ios'
		// },
		// android: {
		//   packageName: 'com.example.android',
		//   installApp: true,
		//   minimumVersion: '12'
		// },
		// dynamicLinkDomain: 'example.page.link'
	};

	await sendSignInLinkToEmail(auth, email, actionCodeSettings);
	window.localStorage.setItem('emailForSignIn', email);
}

export function parseSignInLink() {
	// Confirm the link is a sign-in with email link.
	const auth = getAuth();
	if (isSignInWithEmailLink(auth, window.location.href)) {
		// Additional state parameters can also be passed via URL.
		// This can be used to continue the user's intended action before triggering
		// the sign-in operation.
		// Get the email if available. This should be available if the user completes
		// the flow on the same device where they started it.
		let email = window.localStorage.getItem('emailForSignIn');
		if (!email) {
			// User opened the link on a different device. To prevent session fixation
			// attacks, ask the user to provide the associated email again. For example:
			email = window.prompt('Please enter your email address to confirm');
		}
		// The client SDK will parse the code from the link for you.
		signInWithEmailLink(auth, email || '', window.location.href)
			.then((result) => {
				// Clear email from storage.
				window.localStorage.removeItem('emailForSignIn');
				// You can access the new user by importing getAdditionalUserInfo
				// and calling it with result:
				// getAdditionalUserInfo(result)
				// You can access the user's profile via:
				// getAdditionalUserInfo(result)?.profile
				// You can check if the user is new or existing:
				// getAdditionalUserInfo(result)?.isNewUser
				goHome();
			})
			.catch((error) => {
				// Some error occurred, you can inspect the code: error.code
				// Common errors could be invalid email and invalid or expired OTPs.
				console.error('Sign in error:', error);
			});
	}
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
			// await setDoc(userRef, { uid, currentRoomId: '', timestamp: Date.now() });
			// console.log(`Created new user document for user ${uid}`);
			// return { uid, currentRoomId: '', timestamp: Date.now() } as User;
			return null;
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
		userStore.set({ ...user, currentRoomId: roomId });
		console.log(`Updated currentRoomId for user ${user.uid} to ${roomId}`);
	} catch (error) {
		console.error(`Failed to update currentRoomId for user ${user.uid}:`, error);
	}
}

export async function updateUserTimestamp(user: User): Promise<void> {
	const userRef = doc(db, 'users', user.uid);

	try {
		await setDoc(userRef, { uid: user.uid, timestamp: Date.now() }, { merge: true });
		// userStore.set({ ...user, timestamp: Date.now() })
		console.log(`Updated timestamp for user ${user.uid} to ${Date.now()}`);
	} catch (error) {
		console.error(`Failed to update timestamp for user ${user.uid}:`, error);
	}
}

export async function updateUserUserName(user: User, userName: string): Promise<void> {
	const userRef = doc(db, 'users', user.uid);

	try {
		await setDoc(userRef, { uid: user.uid, userName }, { merge: true });
		console.log(`Updated userName for user ${user.uid} to ${userName}`);
	} catch (error) {
		console.error(`Failed to update userName for user ${user.uid}:`, error);
	}
}

export async function addUserRating(
	userId: string,
	feedback: number,
	conversation: number
): Promise<void> {
	const ratingsRef = collection(db, `users/${userId}/ratings`);
	try {
		await addDoc(ratingsRef, {
			feedback,
			conversation,
			timestamp: Date.now()
		});
		console.log(`Added rating for user ${userId}`);
	} catch (error) {
		console.error(`Failed to add rating for user ${userId}:`, error);
	}
}

export async function getLastFiveRatings(userId: string) {
	const ratingsRef = collection(db, `users/${userId}/ratings`);
	const q = query(ratingsRef, orderBy('timestamp', 'desc'), limit(5)); // Order by timestamp in descending order, limit to 5

	try {
		const querySnapshot = await getDocs(q);
		const ratings = querySnapshot.docs.map((doc) => doc.data());
		console.log('Last 5 ratings:', ratings);
		return ratings;
	} catch (error) {
		console.error(`Failed to get last 5 ratings for user ${userId}:`, error);
	}
}

export async function updateUserRating(userId: string, rating: number): Promise<void> {
	const userRef = doc(db, 'users', userId);

	try {
		await setDoc(userRef, { uid: userId, rating: rating }, { merge: true });
		console.log(`Updated rating for user ${userId} to ${rating}`);
	} catch (error) {
		console.error(`Failed to update currentRoomId for user ${userId}:`, error);
	}
}

export async function reAuth(user: FirebaseUser, email: string, password: string): Promise<void> {
	const credential = EmailAuthProvider.credential(email, password);
	await reauthenticateWithCredential(user, credential);
}

export async function deleteUserAccount(user: FirebaseUser): Promise<void> {
	// delete email from emails collection
	const emailsRef = collection(db, 'emails');
	const q = query(emailsRef, where("email", "==", user.email));
	const querySnapshot = await getDocs(q);

	// Iterate through each matching document and delete it
	querySnapshot.forEach(async (doc) => {
		await deleteDoc(doc.ref);
		console.log(`Deleted document with email: ${user.email}`);
	});

	// delete firebase auth user
	await deleteUser(user);

	console.log(`Deleted user account for user ${user.uid}`);
	userStore.set(null);
	usersStore.set({});
}

function isUser(obj: any): obj is User {
	return obj && typeof obj === 'object' && 'userName' in obj;
}

export async function checkEmailRegistered(email: string): Promise<boolean> {
	try {
		console.warn("checking email")

		const emailsRef = collection(db, 'emails');
		const q = query(emailsRef, where("email", "==", email));
		const querySnapshot = await getDocs(q);

		// Check if there are any documents in the snapshot
		if (!querySnapshot.empty) {
			console.log("Email is already registered.");
			return true;
		} else {
			console.log("Email is not registered.");
			return false;
		}
	} catch (error) {
		console.error("Error checking email:", error);
		return false;
	}
};

// Subscribe to modalState store to get the callback function
let callback: Function;

// Subscribe to the store
modalState.subscribe((value) => {
	callback = value.callback;
});

// Listen to authentication state changes
onAuthStateChanged(auth, async (user) => {
	if (user) {
		const userData: User | {} = (await getUserData(user.uid)) || {};

		const newUser = {
			email: user.email!,
			uid: user.uid,
			verified: true, // user.emailVerified,
			firebaseUser: user,
			...userData
		};

		userStore.set(newUser);

		const newLookup: UserLookup = {};
		newLookup[user.uid] = {
			userName: isUser(userData) && userData.userName ? userData.userName : ''
			// userName: 'You'
		};

		if (isUser(userData)) {
			usersStore.update((currentUsers) => {
				return {
					...currentUsers,
					...newLookup
				};
			});

			if (user.emailVerified) {
				if (!userData.currentRoomId && callback) {
					await tick();
					callback(newUser, true);
				} else {
					console.warn(`User ${user.email} already assigned to room`);
					callback(newUser, false);
				}
			} else {
				console.warn('New user not verified, skipping callback');
			}
		}
	} else {
		userStore.set(null);
		usersStore.set({});
	}
});
