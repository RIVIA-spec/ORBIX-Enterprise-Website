import { onAuthStateChanged, type User } from 'firebase/auth';
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { auth } from '../../services/firebase';
import { logoutUser } from '../../services/authService';
import { getUserProfile } from '../../services/userService';
import { hasAdminAccess, isOwnerProfile } from '../../lib/adminAccess';
import type { UserProfile } from '../../types/models';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      return;
    }
    try {
      const userProfile = await getUserProfile(currentUser.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Failed to load user profile from users/{uid}.', error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      try {
        await loadProfile(currentUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(auth.currentUser);
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      profile,
      loading,
      isAuthenticated: Boolean(user),
      // TODO: Move privileged authorization to Firebase Custom Claims when the backend supports it.
      isAdmin: hasAdminAccess(profile),
      isOwner: isOwnerProfile(profile),
      logout,
      refreshProfile,
    };
  }, [loading, logout, profile, refreshProfile, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
