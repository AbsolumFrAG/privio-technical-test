import { BarChart3, Compass, Library, Settings, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import "./App.css";
import { LoginForm } from "./components/auth/login-form";
import { RegisterForm } from "./components/auth/register-form";
import { GameList } from "./components/games/game-list";
import { ModeToggle } from "./components/mode-toggle";
import { DiscoveryPage } from "./components/public/discovery-page";
import { SettingsPage } from "./components/settings/settings-page";
import { GameStats } from "./components/stats/game-stats";
import { ThemeProvider } from "./components/theme-provider";
import { Button } from "./components/ui/button";
import { UsersPage } from "./components/users/users-page";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { GamesProvider, useGames } from "./contexts/games-context";

function AuthenticatedApp() {
  const { user, logout } = useAuth();
  const { loadGames } = useGames();
  const [activeView, setActiveView] = useState<
    "library" | "discovery" | "users" | "stats" | "settings"
  >("library");

  useEffect(() => {
    // Load games when the user is authenticated and viewing library or stats
    if (activeView === "library" || activeView === "stats") {
      loadGames();
    }
  }, [loadGames, activeView]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">GameTracker</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button variant="outline" onClick={logout}>
              Sign Out
            </Button>
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={activeView === "library" ? "default" : "ghost"}
              onClick={() => setActiveView("library")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Library className="w-4 h-4 mr-2" />
              My Library
            </Button>
            <Button
              variant={activeView === "discovery" ? "default" : "ghost"}
              onClick={() => setActiveView("discovery")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Compass className="w-4 h-4 mr-2" />
              Discover
            </Button>
            <Button
              variant={activeView === "users" ? "default" : "ghost"}
              onClick={() => setActiveView("users")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Users className="w-4 h-4 mr-2" />
              Users
            </Button>
            <Button
              variant={activeView === "stats" ? "default" : "ghost"}
              onClick={() => setActiveView("stats")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Button>
            <Button
              variant={activeView === "settings" ? "default" : "ghost"}
              onClick={() => setActiveView("settings")}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeView === "library" ? (
          <GameList />
        ) : activeView === "discovery" ? (
          <DiscoveryPage />
        ) : activeView === "users" ? (
          <UsersPage />
        ) : activeView === "stats" ? (
          <GameStats />
        ) : (
          <SettingsPage />
        )}
      </main>
    </div>
  );
}

function UnauthenticatedApp() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">GameTracker</h1>
          <p className="text-muted-foreground">
            {showRegister ? "Create your account" : "Sign in to your account"}
          </p>
          <div className="absolute top-4 right-4">
            <ModeToggle />
          </div>
        </div>

        {showRegister ? <RegisterForm /> : <LoginForm />}

        <div className="text-center mt-6">
          <Button variant="link" onClick={() => setShowRegister(!showRegister)}>
            {showRegister
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <GamesProvider>
          <AppContent />
          <Toaster />
        </GamesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
