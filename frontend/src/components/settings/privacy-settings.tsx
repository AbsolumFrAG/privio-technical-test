import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, EyeOff, Users, Lock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export function PrivacySettings() {
  const { user, refreshUser } = useAuth();
  const [isPublic, setIsPublic] = useState(user?.isPublic ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePrivacyToggle = async (newPublicState: boolean) => {
    setIsLoading(true);
    
    try {
      const response = await apiClient.updateProfile({
        isPublic: newPublicState
      });

      if (response.error) {
        toast.error(`Échec de la mise à jour des paramètres de confidentialité : ${response.error}`);
        return;
      }

      setIsPublic(newPublicState);
      await refreshUser(); // Refresh the user data in context
      
      toast.success(
        newPublicState 
          ? "Votre profil est maintenant public - les autres utilisateurs peuvent vous rechercher et voir votre bibliothèque de jeux"
          : "Votre profil est maintenant privé - vous seul pouvez voir votre bibliothèque de jeux"
      );
    } catch (error) {
      console.error("Privacy settings update error:", error);
      toast.error("Échec de la mise à jour des paramètres de confidentialité. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Paramètres de Confidentialité
        </CardTitle>
        <CardDescription>
          Contrôlez qui peut voir votre bibliothèque de jeux et vos statistiques.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label 
                htmlFor="public-profile" 
                className="text-base font-medium flex items-center gap-2"
              >
                {isPublic ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    Profil Public
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-600" />
                    Profil Privé
                  </>
                )}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic 
                ? "Les autres utilisateurs peuvent vous rechercher et voir votre bibliothèque de jeux"
                : "Vous seul pouvez voir votre bibliothèque de jeux - votre profil n'apparaîtra pas dans les résultats de recherche"
              }
            </p>
          </div>
          <Switch
            id="public-profile"
            checked={isPublic}
            onCheckedChange={handlePrivacyToggle}
            disabled={isLoading}
          />
        </div>

        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            {isPublic ? (
              <>
                <Users className="h-4 w-4 text-green-600" />
                Ce que les autres peuvent voir :
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gray-600" />
                Ce qui est privé :
              </>
            )}
          </h4>
          
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Votre nom d'utilisateur et informations de profil
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Votre bibliothèque de jeux complète
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Notes des jeux, heures jouées et statut de jeu
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Statistiques de jeu et réussites
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Informations du profil Steam (si lié)
            </li>
          </ul>
          
          {!isPublic && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              Note : Vos jeux peuvent encore contribuer aux statistiques publiques anonymes
            </p>
          )}
        </div>

        {isPublic && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/50 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Votre profil est découvrable
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Les autres utilisateurs peuvent vous trouver via la recherche d'utilisateurs et explorer vos préférences de jeu. 
                  Vous pouvez rendre votre profil privé à nouveau à tout moment.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Informations de Confidentialité</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Votre adresse email n'est jamais partagée avec d'autres utilisateurs</p>
            <p>• Les notes privées sur les jeux ne sont jamais visibles par les autres</p>
            <p>• Vous pouvez modifier vos paramètres de confidentialité à tout moment</p>
            <p>• Les jeux supprimés sont immédiatement retirés de la vue publique</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}