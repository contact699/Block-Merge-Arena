// Firebase Authentication - Anonymous Login
import { auth, isConfigured } from './config';
import { signInAnonymously, signOut, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@block_merge:user_id';

/**
 * Get or create anonymous user
 * Returns a persistent user ID (either from Firebase or local storage)
 */
export async function getOrCreateUser(): Promise<string> {
  // If Firebase is configured, use Firebase Auth
  if (isConfigured() && auth) {
    try {
      // Check if already signed in
      if (auth.currentUser) {
        return auth.currentUser.uid;
      }

      // Sign in anonymously
      const userCredential = await signInAnonymously(auth);
      const userId = userCredential.user.uid;

      // Save to local storage as backup
      await AsyncStorage.setItem(USER_ID_KEY, userId);

      console.log('✅ Anonymous user created:', userId);
      return userId;
    } catch (error) {
      console.error('❌ Firebase auth error:', error);
      // Fall through to local ID
    }
  }

  // Fallback: Use local storage only
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);

    if (!userId) {
      // Generate a unique local ID
      userId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      console.log('✅ Local user ID created:', userId);
    }

    return userId;
  } catch (error) {
    console.error('❌ Error getting user ID:', error);
    // Last resort: generate temporary ID
    return `temp_${Date.now()}`;
  }
}

/**
 * Get current user ID (synchronous, may return null if not initialized)
 */
export function getCurrentUserId(): string | null {
  if (auth?.currentUser) {
    return auth.currentUser.uid;
  }
  return null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    return () => {}; // No-op unsubscribe
  }

  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!auth?.currentUser;
}

/**
 * Check if using Firebase (vs local-only mode)
 */
export function isUsingFirebase(): boolean {
  return isConfigured() && !!auth;
}

/**
 * Reset local progress — sweeps all @block_merge: AsyncStorage keys except
 * user preferences (settings), then signs out of the Firebase anonymous session.
 * A fresh anonymous identity will be created on the next call to getOrCreateUser().
 *
 * NOTE: This app uses anonymous-only auth (no passwords/emails), so there is no
 * "account" to sign out of in the traditional sense. This action is therefore
 * surfaced as "Reset local data" in the UI — it wipes the local identity and
 * all progress permanently while keeping the user's display/audio/display prefs.
 */
const STORAGE_PREFIX = '@block_merge:';
// Keys to PRESERVE across a local-data reset (user preferences, not progress).
const PRESERVE_KEYS = new Set<string>(['@block_merge:settings']);

export async function resetLocalData(): Promise<void> {
  // Sweep all @block_merge: keys, keeping user preferences
  const all = await AsyncStorage.getAllKeys();
  const toRemove = all.filter((k) => k.startsWith(STORAGE_PREFIX) && !PRESERVE_KEYS.has(k));
  if (toRemove.length > 0) {
    await AsyncStorage.multiRemove(toRemove);
  }

  // Also sign out of the Firebase anonymous session if active
  if (auth && isConfigured()) {
    await signOut(auth);
  }
}
