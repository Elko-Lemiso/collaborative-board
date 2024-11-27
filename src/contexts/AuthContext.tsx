// contexts/AuthContext.tsx

"use client";
import React, { createContext, useState, useEffect, ReactNode } from "react";

interface AuthContextProps {
  username: string | null;
  setUsername: (username: string | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  username: null,
  setUsername: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve username from cookies or another persistent storage
    const storedUsername = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];
    if (storedUsername) {
      setUsername(decodeURIComponent(storedUsername));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ username, setUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
