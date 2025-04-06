/**
 * UseAuthListener
 *
 * Hook to get current authenticated user from Firebase
 */
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { currentUserEmail } from "../utils/jotai.js";
import { useSetAtom } from 'jotai';

/**
 * Hook that updates the user email atom when Firebase authentication changes.
 */
export function useAuthListener() {
    const setEmail = useSetAtom(currentUserEmail);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if(user) {
                setEmail(user.email);
            } else {
                setEmail(null);
            }
        });

        return unsubscribe;
    }, [setCurrentUser])
}