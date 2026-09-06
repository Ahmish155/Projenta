import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, facebookProvider, githubProvider } from "../firebase.js";
import api from "../api/axios.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null); // our workspace-scoped user record
  const [workspace, setWorkspace] = useState(null);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsWorkspace, setNeedsWorkspace] = useState(false); // signed into Firebase but no linked workspace yet

  // Runs after ANY successful Firebase sign-in (email, Google, Facebook, GitHub)
  // to resolve which workspace/role this Firebase account belongs to.
  const syncWithBackend = useCallback(async (fbUser) => {
    const idToken = await fbUser.getIdToken();
    try {
      const res = await api.post("/auth/sync", { idToken });
      setUser(res.data.user);
      setWorkspace(res.data.workspace);
      setTeam(res.data.team);
      setNeedsWorkspace(false);
      return res.data.user;
    } catch (err) {
      if (err.response?.status === 404) {
        // Valid login, but nobody has created a workspace for them yet
        setNeedsWorkspace(true);
        setUser(null);
        setWorkspace(null);
        return null;
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        await syncWithBackend(fbUser).catch(() => {});
      } else {
        setUser(null);
        setWorkspace(null);
        setTeam(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [syncWithBackend]);

  const loginWithEmail = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return syncWithBackend(cred.user);
  }, [syncWithBackend]);

  const loginWithProvider = useCallback(async (providerName) => {
    const provider = { google: googleProvider, facebook: facebookProvider, github: githubProvider }[providerName];
    const cred = await signInWithPopup(auth, provider);
    return syncWithBackend(cred.user);
  }, [syncWithBackend]);

  // Sign-up path used only from the "Create workspace" page
  const signUpWithEmail = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return cred.user; // caller then calls createWorkspace() with the idToken
  }, []);

  const createWorkspace = useCallback(async (fbUser, workspaceName) => {
    const idToken = await fbUser.getIdToken(true);
    const res = await api.post("/auth/create-workspace", { idToken, workspaceName });
    setUser(res.data.user);
    setWorkspace(res.data.workspace);
    setNeedsWorkspace(false);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setWorkspace(null);
    setTeam(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        workspace,
        team,
        loading,
        needsWorkspace,
        loginWithEmail,
        loginWithProvider,
        signUpWithEmail,
        createWorkspace,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
