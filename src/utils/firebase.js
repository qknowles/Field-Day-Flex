// Firebase import
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// SKD's that are available:
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: 'AIzaSyD8lwhJTJX9lZe4oM5b5NRn56DUMCtJfOM',
    authDomain: 'field-day-flex.firebaseapp.com',
    projectId: 'field-day-flex',
    storageBucket: 'field-day-flex.firebasestorage.app',
    messagingSenderId: '331468313856',
    appId: '1:331468313856:web:017637e807a4f725b78fe5',
    measurementId: 'G-2ESB8VM51N',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
