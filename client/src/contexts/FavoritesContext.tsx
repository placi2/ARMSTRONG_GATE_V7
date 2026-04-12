import React, { createContext, useState, useEffect, ReactNode } from "react";

export type FavoriteType = "employee" | "team";

export interface Favorite {
  id: string;
  type: FavoriteType;
  name: string;
  addedAt: number;
  notes?: string;
}

interface FavoritesContextType {
  favorites: Favorite[];
  addFavorite: (id: string, type: FavoriteType, name: string) => void;
  removeFavorite: (id: string, type: FavoriteType) => void;
  isFavorite: (id: string, type: FavoriteType) => boolean;
  updateNotes: (id: string, type: FavoriteType, notes: string) => void;
  getFavoritesByType: (type: FavoriteType) => Favorite[];
  clearAllFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

const STORAGE_KEY = "goldmine_favorites";

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch (error) {
        console.error("Failed to parse favorites from localStorage:", error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = (id: string, type: FavoriteType, name: string) => {
    setFavorites((prev) => {
      // Check if already exists
      const exists = prev.some((fav) => fav.id === id && fav.type === type);
      if (exists) return prev;

      return [
        ...prev,
        {
          id,
          type,
          name,
          addedAt: Date.now(),
        },
      ];
    });
  };

  const removeFavorite = (id: string, type: FavoriteType) => {
    setFavorites((prev) =>
      prev.filter((fav) => !(fav.id === id && fav.type === type))
    );
  };

  const isFavorite = (id: string, type: FavoriteType): boolean => {
    return favorites.some((fav) => fav.id === id && fav.type === type);
  };

  const updateNotes = (id: string, type: FavoriteType, notes: string) => {
    setFavorites((prev) =>
      prev.map((fav) =>
        fav.id === id && fav.type === type ? { ...fav, notes } : fav
      )
    );
  };

  const getFavoritesByType = (type: FavoriteType): Favorite[] => {
    return favorites.filter((fav) => fav.type === type);
  };

  const clearAllFavorites = () => {
    setFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        isFavorite,
        updateNotes,
        getFavoritesByType,
        clearAllFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = React.useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
