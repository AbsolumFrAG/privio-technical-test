import { apiClient } from "@/lib/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: string;
  email: string;
  username: string;
  isPublic?: boolean;
  createdAt?: string;
  // Steam integration fields
  steamId?: string;
  steamUsername?: string;
  steamAvatarUrl?: string;
  steamLinkedAt?: string;
  steamSyncEnabled?: boolean;
  lastSteamSync?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from localStorage and verify with backend
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const accessToken = localStorage.getItem("accessToken");

      if (storedUser && accessToken) {
        try {
          // Verify token with backend
          const response = await apiClient.getCurrentUser();
          if (response.data?.user) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
          }
        } catch {
          // Failed to verify, clear storage
          localStorage.removeItem("user");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
      }

      setIsInitialized(true);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(email, password);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data?.user && response.data?.tokens) {
        const { user: userData, tokens } = response.data;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("refreshToken", tokens.refreshToken);
        apiClient.setAccessToken(tokens.accessToken);
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string) => {
      setIsLoading(true);
      try {
        const response = await apiClient.register(email, username, password);

        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data?.user && response.data?.tokens) {
          const { user: userData, tokens } = response.data;

          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          localStorage.setItem("refreshToken", tokens.refreshToken);
          apiClient.setAccessToken(tokens.accessToken);
        }
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Registration failed"
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch {
      // Continue with logout even if API call fails
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    apiClient.setAccessToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      login,
      register,
      logout,
      refreshUser,
      isLoading,
      isInitialized,
    }),
    [user, login, register, logout, refreshUser, isLoading, isInitialized]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}
