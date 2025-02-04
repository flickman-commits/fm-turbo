import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  vimeoConnected: boolean;
  vimeoUserId?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true
});

export function useUser() {
  return useContext(UserContext);
}

interface UserProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  // In a real app, you'd probably fetch the user data here
  // and handle authentication state

  return (
    <UserContext.Provider value={{ user: initialUser, isLoading: false }}>
      {children}
    </UserContext.Provider>
  );
} 