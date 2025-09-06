import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { User } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { SteamIntegration } from "../steam/steam-integration";
import { PrivacySettings } from "./privacy-settings";

export function SettingsPage() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get("steamLinked") === "true") {
      const steamUsername = urlParams.get("steamUsername");
      toast.success(`Compte Steam ${steamUsername} lié avec succès !`);

      window.history.replaceState({}, "", window.location.pathname);
      refreshUser();
    } else if (urlParams.get("steamError")) {
      const errorMessage = urlParams.get("steamError");
      toast.error(errorMessage || "Liaison Steam échouée");

      // Clean up URL parameters
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos paramètres de compte et préférences.
        </p>
      </div>

      <Separator />

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du Compte
          </CardTitle>
          <CardDescription>
            Consultez et gérez les détails de votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Les paramètres de base du compte seront disponibles ici dans les futures mises à jour.
          </p>
        </CardContent>
      </Card>

      {/* Steam Integration */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Intégration Steam</h2>
        <SteamIntegration />
      </div>

      {/* Privacy Settings */}
      <PrivacySettings />
    </div>
  );
}
