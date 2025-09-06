import {
  BarChart3,
  Compass,
  Library,
  Settings,
  Users,
  LogOut,
  Gamepad2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import "./App.css";
import { LoginForm } from "./components/auth/login-form";
import { RegisterForm } from "./components/auth/register-form";
import { GameList } from "./components/games/game-list";
import { DiscoveryPage } from "./components/public/discovery-page";
import { SettingsPage } from "./components/settings/settings-page";
import { GameStats } from "./components/stats/game-stats";
import { Button } from "./components/ui/button";
import { UsersPage } from "./components/users/users-page";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { GamesProvider, useGames } from "./contexts/games-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./components/ui/avatar";

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  GameTracker
                </h1>
                <p className="text-xs text-muted-foreground leading-none">
                  Votre Hub Gaming
                </p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Ouvrir le menu utilisateur</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.username}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveView("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card/50 backdrop-blur">
          <nav className="p-4 space-y-2">
            {[
              {
                key: "library",
                label: "Ma Bibliothèque",
                icon: Library,
                desc: "Votre collection de jeux",
              },
              {
                key: "discovery",
                label: "Découvrir",
                icon: Compass,
                desc: "Trouver de nouveaux jeux",
              },
              {
                key: "stats",
                label: "Statistiques",
                icon: BarChart3,
                desc: "Analyses de jeu",
              },
              {
                key: "users",
                label: "Communauté",
                icon: Users,
                desc: "Autres joueurs",
              },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setActiveView(item.key as typeof activeView)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left group hover:bg-accent/50 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? "text-primary-foreground" : ""
                    }`}
                  />
                  <div>
                    <div
                      className={`font-medium text-sm ${
                        isActive ? "text-primary-foreground" : ""
                      }`}
                    >
                      {item.label}
                    </div>
                    <div
                      className={`text-xs transition-colors ${
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground group-hover:text-foreground/60"
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500">
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function UnauthenticatedApp() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white shadow-2xl">
              <Gamepad2 className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
            GameTracker
          </h1>
          <p className="text-slate-300 text-lg mb-2">
            {showRegister ? "Rejoindre la Communauté Gaming" : "Bon retour, Joueur"}
          </p>
          <p className="text-slate-400 text-sm">
            {showRegister
              ? "Créez votre compte pour commencer à suivre vos jeux"
              : "Connectez-vous pour accéder à votre bibliothèque de jeux"}
          </p>
        </div>

        {/* Auth Forms */}
        <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          {showRegister ? <RegisterForm /> : <LoginForm />}
        </div>

        {/* Toggle Auth Mode */}
        <div className="text-center mt-8">
          <Button
            variant="ghost"
            onClick={() => setShowRegister(!showRegister)}
            className="text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            {showRegister
              ? "Vous avez déjà un compte ? Connectez-vous"
              : "Vous n'avez pas de compte ? Inscrivez-vous"}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-xs">
          <p>Suivre • Noter • Découvrir • Connecter</p>
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
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <GamesProvider>
        <AppContent />
        <Toaster />
      </GamesProvider>
    </AuthProvider>
  );
}

export default App;
