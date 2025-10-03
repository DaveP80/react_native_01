import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  user: User;
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

  const login = (userObj: User) => setUser(userObj);
  const logout = () => setUser({ name: '', email: '', password: '' });

  return (
    <AuthContext.Provider
      value={{
        user: (user ?? { name: '', email: '', password: '' }),
        login: (userObj: any) => setUser(userObj),
        logout,
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