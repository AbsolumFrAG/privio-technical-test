import { useEffect } from 'react';
import { SteamIntegration } from '../steam/steam-integration';
import { PrivacySettings } from './privacy-settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Database, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export function SettingsPage() {
  const { refreshUser } = useAuth();

  // Handle Steam callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('steamLinked') === 'true') {
      const steamUsername = urlParams.get('steamUsername');
      toast.success(`Steam account ${steamUsername} linked successfully!`);
      
      // Clean up URL parameters and refresh user data
      window.history.replaceState({}, '', window.location.pathname);
      refreshUser(); // Refresh user data from API
    } else if (urlParams.get('steamError')) {
      const errorMessage = urlParams.get('steamError');
      toast.error(errorMessage || 'Steam linking failed');
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshUser]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <Separator />

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            View and manage your account details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Basic account settings will be available here in future updates.
          </p>
        </CardContent>
      </Card>

      {/* Steam Integration */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Steam Integration</h2>
        <SteamIntegration />
      </div>

      {/* Privacy Settings */}
      <PrivacySettings />

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your data, manage backups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Data management tools will be available here in future updates.
          </p>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of GameTracker.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Theme and appearance options will be available here in future updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}