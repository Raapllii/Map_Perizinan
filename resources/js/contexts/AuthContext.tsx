import React, { createContext, useContext } from 'react';

interface AuthContextType {
  user: any;
  setUser: React.Dispatch<React.SetStateAction<any>>;
}

export const AuthContext = createContext<AuthContextType>({ user: null, setUser: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
