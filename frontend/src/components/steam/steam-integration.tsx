import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { ExternalLink, Gamepad2, UserCheck, Settings, RotateCw, Unlink2, AlertCircle } from 'lucide-react';

interface SteamProfile {
  steamId: string;
  steamUsername: string;
  steamAvatarUrl: string;
  steamLinkedAt: string;
  steamSyncEnabled: boolean;
  lastSteamSync?: string;
  steamGameCount: number;
  profileUrl: string;
}

interface SteamSyncStatus {
  canSync: boolean;
  nextSyncTime?: string;
  lastSync?: string;
  syncEnabled: boolean;
  steamGameCount: number;
  history: Array<{
    id: string;
    status: 'PENDING' | 'SUCCESS' | 'ERROR';
    gamesProcessed?: number;
    gamesImported?: number;
    gamesUpdated?: number;
    gamesSkipped?: number;
    errorMessage?: string;
    startedAt: string;
    completedAt?: string;
  }>;
}

export function SteamIntegration() {
  const { user } = useAuth();
  const [steamProfile, setSteamProfile] = useState<SteamProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SteamSyncStatus | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [manualSteamId, setManualSteamId] = useState('');
  const [keepGamesOnUnlink, setKeepGamesOnUnlink] = useState(true);
  const [syncSettings, setSyncSettings] = useState({
    skipExisting: true,
    updatePlaytime: true,
    minimumPlaytime: 0,
    maxGamesToProcess: 1000,
  });
  const [isFixingImages, setIsFixingImages] = useState(false);

  const isLinked = Boolean(user?.steamId);

  useEffect(() => {
    if (isLinked) {
      loadSteamData();
    }
  }, [isLinked]);

  const loadSteamData = async () => {
    try {
      const [profileResponse, statusResponse] = await Promise.all([
        apiClient.getSteamProfile(),
        apiClient.getSteamSyncStatus(),
      ]);

      if (profileResponse.data?.profile) {
        setSteamProfile(profileResponse.data.profile);
      }

      if (statusResponse.data) {
        setSyncStatus(statusResponse.data);
      }
    } catch (error) {
      console.error('Failed to load Steam data:', error);
    }
  };

  const handleSteamOAuthLink = async () => {
    setIsLinking(true);
    try {
      const response = await apiClient.getSteamAuthUrl();
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data?.authUrl) {
        // Store state for validation when user returns
        localStorage.setItem('steamAuthState', response.data.state);
        
        // Create message listener for popup communication
        const handleMessage = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin.replace('5173', '3001')) {
            return;
          }
          
          if (event.data.type === 'STEAM_AUTH_SUCCESS') {
            // Steam authentication successful
            toast.success('Steam account linked successfully!');
            setIsLinking(false);
            window.removeEventListener('message', handleMessage);
            
            // Refresh user data by reloading the page
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else if (event.data.type === 'STEAM_AUTH_ERROR') {
            // Steam authentication failed
            toast.error(event.data.error || 'Steam authentication failed');
            setIsLinking(false);
            window.removeEventListener('message', handleMessage);
          }
        };
        
        // Add message listener
        window.addEventListener('message', handleMessage);
        
        // Open Steam authentication in new window
        const authWindow = window.open(
          response.data.authUrl,
          'steamAuth',
          'width=800,height=600,scrollbars=yes,resizable=yes'
        );

        // Fallback: Poll for window close in case postMessage fails
        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            setIsLinking(false);
            // Refresh user data to check if linking was successful
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }, 1000);
        
        // Cleanup after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (!authWindow?.closed) {
            authWindow?.close();
          }
          setIsLinking(false);
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error('Steam OAuth error:', error);
      toast.error('Failed to initiate Steam authentication');
      setIsLinking(false);
    }
  };

  const handleManualLink = async () => {
    if (!manualSteamId.trim()) {
      toast.error('Please enter a valid Steam ID');
      return;
    }

    setIsLinking(true);
    try {
      const response = await apiClient.linkSteamAccount(manualSteamId);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Steam account linked successfully!');
      setShowLinkDialog(false);
      setManualSteamId('');
      window.location.reload(); // Refresh to get updated user data
    } catch (error) {
      console.error('Manual Steam link error:', error);
      toast.error('Failed to link Steam account');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    setIsUnlinking(true);
    try {
      const response = await apiClient.unlinkSteamAccount(keepGamesOnUnlink);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      toast.success('Steam account unlinked successfully');
      setShowUnlinkDialog(false);
      window.location.reload(); // Refresh to get updated user data
    } catch (error) {
      console.error('Steam unlink error:', error);
      toast.error('Failed to unlink Steam account');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.syncSteamLibrary(syncSettings);
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      const result = response.data?.result;
      if (result) {
        toast.success(
          `Sync completed! Imported: ${result.gamesImported}, Updated: ${result.gamesUpdated}, Skipped: ${result.gamesSkipped}`
        );
        
        if (result.errors.length > 0) {
          toast.warning(`${result.errors.length} errors occurred during sync`);
        }
        
        loadSteamData(); // Refresh data
      }
    } catch (error) {
      console.error('Steam sync error:', error);
      toast.error('Failed to sync Steam library');
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleSyncEnabled = async () => {
    if (!steamProfile) return;

    try {
      const response = await apiClient.updateSteamSettings({
        steamSyncEnabled: !steamProfile.steamSyncEnabled,
      });
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      setSteamProfile(prev => prev ? {
        ...prev,
        steamSyncEnabled: !prev.steamSyncEnabled
      } : null);
      
      toast.success(`Steam sync ${steamProfile.steamSyncEnabled ? 'disabled' : 'enabled'}`);
    } catch (error) {
      console.error('Failed to update Steam settings:', error);
      toast.error('Failed to update Steam settings');
    }
  };

  const handleFixImages = async () => {
    setIsFixingImages(true);
    try {
      const response = await apiClient.fixSteamImages();
      
      if (response.error) {
        toast.error(response.error);
        return;
      }

      if (response.data) {
        toast.success(
          `Fixed images for ${response.data.updatedCount} games out of ${response.data.totalFound} checked`
        );
      }
    } catch (error) {
      console.error('Failed to fix Steam images:', error);
      toast.error('Failed to fix Steam game images');
    } finally {
      setIsFixingImages(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isLinked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Steam Integration
          </CardTitle>
          <CardDescription>
            Link your Steam account to import your game library and keep it synchronized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSteamOAuthLink}
              disabled={isLinking}
              className="flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              {isLinking ? 'Connecting...' : 'Link with Steam'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowLinkDialog(true)}
              disabled={isLinking}
            >
              Link Manually
            </Button>
          </div>

          <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Link Steam Account Manually</DialogTitle>
                <DialogDescription>
                  Enter your Steam ID (64-bit format) to link your account manually.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="steamId">Steam ID</Label>
                  <Input
                    id="steamId"
                    placeholder="76561198000000000"
                    value={manualSteamId}
                    onChange={(e) => setManualSteamId(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    You can find your Steam ID at{' '}
                    <a
                      href="https://steamid.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      steamid.io
                    </a>
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowLinkDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleManualLink}
                    disabled={isLinking || !manualSteamId.trim()}
                  >
                    {isLinking ? 'Linking...' : 'Link Account'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Steam Profile Card */}
      {steamProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Steam Profile
              <Badge variant="secondary" className="ml-auto">
                <UserCheck className="h-3 w-3 mr-1" />
                Linked
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img
                src={steamProfile.steamAvatarUrl}
                alt="Steam Avatar"
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{steamProfile.steamUsername}</h3>
                <p className="text-sm text-muted-foreground">
                  Linked on {formatDate(steamProfile.steamLinkedAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {steamProfile.steamGameCount} games in library
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(steamProfile.profileUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Profile
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowUnlinkDialog(true)}
                >
                  <Unlink2 className="h-4 w-4 mr-1" />
                  Unlink
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Settings Card */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sync Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Steam Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Allow automatic synchronization of your Steam library
                </p>
              </div>
              <Switch
                checked={steamProfile?.steamSyncEnabled || false}
                onCheckedChange={toggleSyncEnabled}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumPlaytime">Minimum Playtime (minutes)</Label>
                <Input
                  id="minimumPlaytime"
                  type="number"
                  value={syncSettings.minimumPlaytime}
                  onChange={(e) =>
                    setSyncSettings(prev => ({
                      ...prev,
                      minimumPlaytime: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxGames">Max Games to Process</Label>
                <Input
                  id="maxGames"
                  type="number"
                  value={syncSettings.maxGamesToProcess}
                  onChange={(e) =>
                    setSyncSettings(prev => ({
                      ...prev,
                      maxGamesToProcess: parseInt(e.target.value) || 1000,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={syncSettings.skipExisting}
                  onCheckedChange={(checked) =>
                    setSyncSettings(prev => ({ ...prev, skipExisting: checked }))
                  }
                />
                <Label>Skip existing games</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={syncSettings.updatePlaytime}
                  onCheckedChange={(checked) =>
                    setSyncSettings(prev => ({ ...prev, updatePlaytime: checked }))
                  }
                />
                <Label>Update playtime from Steam</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status and Actions */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCw className="h-5 w-5" />
              Library Synchronization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Last sync:</p>
                <p className="text-sm text-muted-foreground">
                  {syncStatus.lastSync
                    ? formatDate(syncStatus.lastSync)
                    : 'Never synchronized'
                  }
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleSync}
                  disabled={!syncStatus.canSync || isSyncing || !steamProfile?.steamSyncEnabled}
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleFixImages}
                  disabled={isFixingImages}
                >
                  {isFixingImages ? 'Fixing Images...' : 'Fix Images'}
                </Button>
              </div>
            </div>

            {!syncStatus.canSync && syncStatus.nextSyncTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                Next sync available: {formatDate(syncStatus.nextSyncTime)}
              </div>
            )}

            {/* Sync History */}
            {syncStatus.history.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Sync History</h4>
                <div className="space-y-2">
                  {syncStatus.history.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              log.status === 'SUCCESS'
                                ? 'default'
                                : log.status === 'ERROR'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {log.status}
                          </Badge>
                          <span className="text-sm">
                            {formatDate(log.startedAt)}
                          </span>
                        </div>
                        {log.status === 'SUCCESS' && (
                          <p className="text-sm text-muted-foreground">
                            Processed: {log.gamesProcessed}, Imported: {log.gamesImported}, 
                            Updated: {log.gamesUpdated}, Skipped: {log.gamesSkipped}
                          </p>
                        )}
                        {log.errorMessage && (
                          <p className="text-sm text-red-600">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlink Steam Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to unlink your Steam account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={keepGamesOnUnlink}
                onCheckedChange={setKeepGamesOnUnlink}
              />
              <Label>Keep imported Steam games in library</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              {keepGamesOnUnlink
                ? 'Your imported Steam games will remain in your library as regular games.'
                : 'All imported Steam games will be removed from your library.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUnlinkDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={isUnlinking}
              >
                {isUnlinking ? 'Unlinking...' : 'Unlink Steam Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}