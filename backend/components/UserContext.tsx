import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  token: string | null;
  email: string | null;
  displayName: string | null;
  googleId: string | null;
  photoUrl: string | null;
  loading: boolean;
  login: (token: string, email: string, displayName?: string, googleId?: string, photoUrl?: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType>({
  token: null,
  email: null,
  displayName: null,
  googleId: null,
  photoUrl: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [googleId, setGoogleId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const { token, email, displayName, googleId, photoUrl } = JSON.parse(saved);
        setToken(token);
        setEmail(email);
        setDisplayName(displayName || null);
        setGoogleId(googleId || null);
        setPhotoUrl(photoUrl || null);
        setLoading(false);
        console.log('[UserContext] Loaded from localStorage:', { token, email, displayName, googleId, photoUrl });
        return;
      } catch {}
    }
    fetch('/api/me', { credentials: 'include' })
      .then(res => {
        console.log('[UserContext] /api/me status:', res.status);
        if (res.ok) return res.json();
        throw new Error();
      })
      .then(data => {
        setToken('google-oauth');
        setEmail(data.email);
        setDisplayName(data.displayName || null);
        setGoogleId(data.id || null);
        setPhotoUrl(data.photoUrl || null);
        setLoading(false);
        console.log('[UserContext] /api/me success:', data);
      })
      .catch((err) => {
        setToken(null);
        setEmail(null);
        setDisplayName(null);
        setGoogleId(null);
        setPhotoUrl(null);
        setLoading(false);
        console.log('[UserContext] /api/me error:', err);
      });
  }, []);

  useEffect(() => {
    console.log('[UserContext] Render:', { token, email, displayName, googleId, photoUrl, loading });
  }, [token, email, displayName, googleId, photoUrl, loading]);

  const login = (token: string, email: string, displayName?: string, googleId?: string, photoUrl?: string) => {
    setToken(token);
    setEmail(email);
    setDisplayName(displayName || null);
    setGoogleId(googleId || null);
    setPhotoUrl(photoUrl || null);
    setLoading(false);
    localStorage.setItem('auth', JSON.stringify({ token, email, displayName, googleId, photoUrl }));
  };

  const logout = () => {
    setToken(null);
    setEmail(null);
    setDisplayName(null);
    setGoogleId(null);
    setPhotoUrl(null);
    setLoading(false);
    localStorage.removeItem('auth');
  };

  return (
    <UserContext.Provider value={{ token, email, displayName, googleId, photoUrl, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}; 