import { auth } from './firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';

class AuthService {

    async signUp(email, password) {
        // the basic way to set this up:
        // 1. get userCredential JWT from firebase
        try {
            const userCredential = await createUserWithEmailAndPassword(email, password);
            return userCredential.user; // though we need some sort of error handling here - what if this doesn't resolve?
        } catch (error) {
            throw error; // we also need real error handling.
        }
    }

    async login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(email, password);
            return userCredential.user;
        } catch (error) {
            throw error;
        }
    }

    async logout() {
        try {
            await signOut();
        } catch(error) {
            throw error;
        }
    }

    // get google provider? STILL NEED TO CONFIGURE THIS IN THE BACK END DO NOT USE THIS FUNCTION
    async signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch(error) {
            throw error;
        }
    }
}

const authService = new AuthService();
export default authService;