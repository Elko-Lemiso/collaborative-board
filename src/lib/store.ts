// lib/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  username: string | null;
}

interface UserStore extends User {
  setUsername: (username: string) => void;
  clearUsername: () => void;
}

export const useStore = create<UserStore>()(
  persist(
    (set) => ({
      username: null,
      setUsername: (username) => set({ username }),
      clearUsername: () => set({ username: null }),
    }),
    {
      name: "user-storage",
    }
  )
);
