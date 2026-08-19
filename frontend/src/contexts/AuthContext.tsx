import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type UserType } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

type AuthContextType = {
  user: UserType | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: UserType) => void;
  logout: () => void;
  updateUser: (user: UserType) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('campusconnect_token');
      const storedUser = localStorage.getItem('campusconnect_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        connectSocket(storedToken);
        
        try {
          // Sync with backend to ensure the token is still valid
          const res = await authApi.getMe();
          setUser(res.data.user);
          localStorage.setItem('campusconnect_user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Failed to sync auth session', err);
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: UserType) => {
    localStorage.setItem('campusconnect_token', newToken);
    localStorage.setItem('campusconnect_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);
  };

  const logout = () => {
    localStorage.removeItem('campusconnect_token');
    localStorage.removeItem('campusconnect_user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: UserType) => {
    localStorage.setItem('campusconnect_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
