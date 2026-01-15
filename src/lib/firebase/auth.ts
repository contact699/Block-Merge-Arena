// Firebase Authentication - Anonymous Login
import { auth, isConfigured } from './config';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@block_merge_arena:user_id';

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
