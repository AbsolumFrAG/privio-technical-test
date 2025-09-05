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
        toast.error(`Failed to update privacy settings: ${response.error}`);
        return;
      }

      setIsPublic(newPublicState);
      await refreshUser(); // Refresh the user data in context
      
      toast.success(
        newPublicState 
          ? "Your profile is now public - other users can search for you and view your game library"
          : "Your profile is now private - only you can see your game library"
      );
    } catch (error) {
      console.error("Privacy settings update error:", error);
      toast.error("Failed to update privacy settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </CardTitle>
        <CardDescription>
          Control who can see your gaming library and statistics.
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
                    Public Profile
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-600" />
                    Private Profile
                  </>
                )}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPublic 
                ? "Other users can search for you and view your game library"
                : "Only you can see your game library - your profile won't appear in search results"
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
                What others can see:
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-gray-600" />
                What's private:
              </>
            )}
          </h4>
          
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Your username and profile information
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Your complete game library
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Game ratings, hours played, and play status
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Gaming statistics and achievements
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
              Steam profile information (if linked)
            </li>
          </ul>
          
          {!isPublic && (
            <p className="text-xs text-muted-foreground mt-3 italic">
              Note: Your games may still contribute to anonymous public statistics
            </p>
          )}
        </div>

        {isPublic && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/50 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Your profile is discoverable
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Other users can find you through the Users search and explore your gaming preferences. 
                  You can make your profile private again at any time.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Privacy Information</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Your email address is never shared with other users</p>
            <p>• Private notes on games are never visible to others</p>
            <p>• You can change your privacy settings at any time</p>
            <p>• Deleted games are immediately removed from public view</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}