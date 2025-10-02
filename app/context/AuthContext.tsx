import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  user: string | null;
  login: (user: string) => void;
  logout: () => void;
};

type User = {
  name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: User) => setUser(username);
  const logout = () => setUser({ name: '', email: '', password: '' });

  return (
    <AuthContext.Provider
      value={{
        user: user ? user.name : null,
        login: (username: string) =>
          setUser({ name: username, email: '', password: '' }),
        logout: () => setUser(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};