"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { getClientAuth, getClientDb } from "@/lib/firebase/client";
import {
  onIdTokenChanged,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import {
  canEditSettings as canEditSettingsFor,
  canManageMembers as canManageMembersFor,
  canSendMessages as canSendMessagesFor,
  isAccountRole,
  type AccountRole,
} from "@/lib/auth/roles";

export interface AuthUser {
  id: string;
  uid: string;
  email: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string | null;
  beta_features: string[];
  account_id: string | null;
  account_role: AccountRole | null;
}

interface AccountSummary {
  id: string;
  name: string;
  default_currency: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  accountId: string | null;
  accountRole: AccountRole | null;
  account: AccountSummary | null;
  defaultCurrency: string;
  isOwner: boolean;
  isAdmin: boolean;
  isAgent: boolean;
  isViewer: boolean;
  canManageMembers: boolean;
  canEditSettings: boolean;
  canSendMessages: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getAuthCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuthCache(key: string, val: any) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => getAuthCache('wacrm_cached_profile'));
  const [account, setAccount] = useState<AccountSummary | null>(() => getAuthCache('wacrm_cached_account'));
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(() => !getAuthCache('wacrm_cached_profile'));

  const lastFetchedUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    lastFetchedUserIdRef.current = userId;
    try {
      const auth = getClientAuth();
      const currentUser = auth.currentUser;
      const db = getClientDb();
      const userDocRef = doc(db, "users", userId);
      
      let userSnap: any = null;
      try {
        userSnap = await getDoc(userDocRef);
      } catch (firestoreErr: any) {
        console.warn("[AuthProvider] Client Firestore permission fallback active:", firestoreErr?.message || firestoreErr);
      }

      const adminEmails = [
        'ansarisaifuddin732@gmail.com',
        'kisandeveloper2@gmail.com',
        ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
      ];

      if (userSnap && userSnap.exists && userSnap.exists()) {
        const data = userSnap.data();
        let accountRow: AccountSummary | null = null;

        const accId = data.accountId || data.account_id;
        if (accId) {
          try {
            const accDocRef = doc(db, "accounts", accId);
            const accSnap = await getDoc(accDocRef);
            if (accSnap && accSnap.exists && accSnap.exists()) {
              const accData = accSnap.data();
              accountRow = {
                id: accSnap.id,
                name: accData.name || "My Account",
                default_currency: accData.default_currency || accData.defaultCurrency || DEFAULT_CURRENCY,
              };
            }
          } catch (_accErr) {}
        }

        const rawRole = data.accountRole || data.account_role;
        const accountRole = isAccountRole(rawRole) ? rawRole : "owner";
        const email = data.email || currentUser?.email || "";
        const isSuperAdminEmail = Boolean(email && adminEmails.includes(email.toLowerCase()));

        const newProfile: Profile = {
          id: userSnap.id,
          full_name: data.full_name || data.fullName || currentUser?.displayName || null,
          email,
          avatar_url: data.avatar_url || data.avatarUrl || currentUser?.photoURL || null,
          role: data.role || (isSuperAdminEmail ? "admin" : "user"),
          beta_features: data.beta_features || [],
          account_id: accId || null,
          account_role: accountRole,
        };

        setProfile(newProfile);
        setAccount(accountRow);
        setAuthCache('wacrm_cached_profile', newProfile);
        if (accountRow) setAuthCache('wacrm_cached_account', accountRow);
      } else {
        const fallbackEmail = currentUser?.email || "";
        const isSuperAdminEmail = Boolean(fallbackEmail && adminEmails.includes(fallbackEmail.toLowerCase()));

        const fallbackProfile: Profile = {
          id: userId,
          full_name: currentUser?.displayName || (fallbackEmail ? fallbackEmail.split('@')[0] : "User"),
          email: fallbackEmail,
          avatar_url: currentUser?.photoURL || null,
          role: isSuperAdminEmail ? "admin" : "user",
          beta_features: [],
          account_id: null,
          account_role: "owner",
        };

        setProfile(fallbackProfile);
        setAuthCache('wacrm_cached_profile', fallbackProfile);

        // Auto-create basic user doc in Firestore (ignore permission errors quietly)
        setDoc(userDocRef, {
          email: fallbackEmail,
          full_name: fallbackProfile.full_name,
          role: fallbackProfile.role,
          accountRole: "owner",
          createdAt: new Date().toISOString(),
        }, { merge: true }).catch(() => {});
      }
    } catch (err: any) {
      console.warn("[AuthProvider] fetchProfile resilient warning:", err?.message || err);
      lastFetchedUserIdRef.current = null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const auth = getClientAuth();

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthProvider] Firebase Auth state timeout after 3s");
        setLoading(false);
        setProfileLoading(false);
      }
    }, 3000);

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!mounted) return;

      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken();
          document.cookie = `__session=${freshToken}; path=/; max-age=86400; SameSite=Lax`;
        } catch (cookieErr) {
          console.warn("[AuthProvider] session cookie update warning:", cookieErr);
        }

        const formattedUser: AuthUser = {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          created_at: firebaseUser.metadata.creationTime || null,
          createdAt: firebaseUser.metadata.creationTime || null,
          user_metadata: {
            full_name: firebaseUser.displayName || undefined,
            avatar_url: firebaseUser.photoURL || undefined,
          },
        };
        setUser(formattedUser);

        if (firebaseUser.uid !== lastFetchedUserIdRef.current) {
          fetchProfile(firebaseUser.uid);
        }
      } else {
        lastFetchedUserIdRef.current = null;
        setUser(null);
        setProfile(null);
        setAccount(null);
        setProfileLoading(false);
      }

      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      const auth = getClientAuth();
      await firebaseSignOut(auth);
    } catch {}
    setUser(null);
    setProfile(null);
    setAccount(null);
    if (typeof window !== "undefined") {
      try {
        document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    }
    window.location.href = "/login";
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  const derived = useMemo(() => {
    const role = profile?.account_role ?? null;
    const adminEmails = [
      'ansarisaifuddin732@gmail.com',
      'kisandeveloper2@gmail.com',
      ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS ? process.env.NEXT_PUBLIC_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [])
    ];
    const isSuperAdmin = Boolean(
      profile?.role === 'admin' ||
      profile?.role === 'superadmin' ||
      (user?.email && adminEmails.includes(user.email.toLowerCase())) ||
      (profile?.email && adminEmails.includes(profile.email.toLowerCase()))
    );

    const effectiveRole: AccountRole = isSuperAdmin ? "owner" : (role ?? "owner");

    return {
      accountRole: effectiveRole,
      accountId: profile?.account_id ?? null,
      isSuperAdmin,
      isOwner: isSuperAdmin || effectiveRole === "owner",
      isAdmin: isSuperAdmin || effectiveRole === "admin",
      isAgent: effectiveRole === "agent",
      isViewer: effectiveRole === "viewer",
      canManageMembers: isSuperAdmin || canManageMembersFor(effectiveRole),
      canEditSettings: isSuperAdmin || canEditSettingsFor(effectiveRole),
      canSendMessages: isSuperAdmin || canSendMessagesFor(effectiveRole),
    };
  }, [profile?.account_role, profile?.account_id, profile?.role, profile?.email, user?.email]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileLoading,
        signOut,
        refreshProfile,
        account,
        defaultCurrency: account?.default_currency ?? DEFAULT_CURRENCY,
        ...derived,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
      signOut: async () => {
        window.location.href = "/login";
      },
      refreshProfile: async () => {},
      account: null,
      defaultCurrency: DEFAULT_CURRENCY,
      accountId: null,
      accountRole: null,
      isOwner: false,
      isAdmin: false,
      isAgent: false,
      isViewer: false,
      canManageMembers: false,
      canEditSettings: false,
      canSendMessages: false,
      isSuperAdmin: false,
    };
  }
  return ctx;
}
