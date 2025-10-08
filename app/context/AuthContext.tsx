import React, { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
  user: User;
  login: (user: User) => void;
  logout: () => void;
  newSignup: (newUser: boolean) => void;
  newUser: boolean;
};

type User = {
  name: string;
  email: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<boolean>(false);

  const login = (userObj: User) => setUser(userObj);
  const logout = () => setUser({ name: '', email: '', password: '' });
  const newSignup = (newValue: boolean) => setNewUser(newValue);
  return (
    <AuthContext.Provider
      value={{
        user: (user ?? { name: '', email: '', password: '' }),
        login,
        logout,
        newSignup,
        newUser,
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

export type { User };

export default AuthProvider;