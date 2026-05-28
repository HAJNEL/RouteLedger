import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth as fbAuth, isRealFirebase } from "../../lib/firebase";
import { UserSession } from "../../types";

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have real firebase, sync with onAuthStateChanged
    if (isRealFirebase && fbAuth) {
      const unsubscribe = onAuthStateChanged(fbAuth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            userId: firebaseUser.uid,
            email: firebaseUser.email || "user@routeledger.local"
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline fallback: check localStorage
      const savedUser = localStorage.getItem("rl_user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Pre-authenticate for smooth initial demonstration
        const defaultUser = { userId: "simulated-user", email: "hajnel20@gmail.com" };
        setUser(defaultUser);
        localStorage.setItem("rl_user", JSON.stringify(defaultUser));
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isRealFirebase && fbAuth) {
        const credential = await signInWithEmailAndPassword(fbAuth, email, password);
        setUser({
          userId: credential.user.uid,
          email: credential.user.email || email
        });
      } else {
        // High fidelity simulated check
        if (!email.includes("@")) {
          throw new Error("Invalid email address format.");
        }
        if (password.length < 4) {
          throw new Error("Password must be at least 4 characters long.");
        }
        const newUser = { userId: "simulated-user", email };
        setUser(newUser);
        localStorage.setItem("rl_user", JSON.stringify(newUser));
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      if (isRealFirebase && fbAuth) {
        const credential = await createUserWithEmailAndPassword(fbAuth, email, password);
        setUser({
          userId: credential.user.uid,
          email: credential.user.email || email
        });
      } else {
        if (!email.includes("@")) {
          throw new Error("Invalid email address format.");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        const newUser = { userId: "simulated-user", email };
        setUser(newUser);
        localStorage.setItem("rl_user", JSON.stringify(newUser));
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isRealFirebase && fbAuth) {
        const provider = new GoogleAuthProvider();
        const credential = await signInWithPopup(fbAuth, provider);
        setUser({
          userId: credential.user.uid,
          email: credential.user.email || "google-user@routeledger.local"
        });
      } else {
        // High fidelity simulated login with Google using user email from metadata or generic address
        const newUser = { userId: "google-simulated-user", email: "hajnel20@gmail.com" };
        setUser(newUser);
        localStorage.setItem("rl_user", JSON.stringify(newUser));
      }
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (isRealFirebase && fbAuth) {
        await fbSignOut(fbAuth);
      }
      setUser(null);
      localStorage.removeItem("rl_user");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, signUp, loginWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
