import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './userService';

type RegisterInput = {
  email: string;
  password: string;
  username: string;
};

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail({ username, email, password }: RegisterInput) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(credential.user, username);
  await sendEmailVerification(credential.user);
  return credential;
}

export async function logoutUser() {
  await signOut(auth);
}

