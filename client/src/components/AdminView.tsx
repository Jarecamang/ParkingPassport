import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import ChangePasswordForm from './ChangePasswordForm';
import { Button } from '@/components/ui/button';
import { LogOut, KeyRound } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AdminView = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { toast } = useToast();

  // Check if admin settings exist
  const adminSettingsQuery = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !isLoggedIn
  });

  // Define a type for the auth status response
  interface AuthStatus {
    isAuthenticated: boolean;
  }

  // Check if user is already authenticated
  const authStatusQuery = useQuery<AuthStatus>({
    queryKey: ['/api/admin/auth-status']
  });

  // Set login state based on auth status
  useEffect(() => {
    if (authStatusQuery.data) {
      setIsLoggedIn(authStatusQuery.data.isAuthenticated);
    }
  }, [authStatusQuery.data]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      setIsLoggedIn(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/auth-status'] });
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  const handleChangePasswordClick = () => {
    setShowChangePassword(true);
  };

  const handleCloseChangePassword = () => {
    setShowChangePassword(false);
  };

  if (authStatusQuery.isLoading || adminSettingsQuery.isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      {!isLoggedIn ? (
        <AdminLogin 
          setIsLoggedIn={setIsLoggedIn}
          isLoading={adminSettingsQuery.isLoading}
        />
      ) : (
        <>
          <div className="flex justify-end mb-4 space-x-2">
            <Button 
              variant="outline" 
              onClick={handleChangePasswordClick}
              className="text-primary"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Change Password
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="text-secondary"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>

          {showChangePassword && (
            <ChangePasswordForm onClose={handleCloseChangePassword} />
          )}
          
          {!showChangePassword && <AdminDashboard />}
        </>
      )}
    </div>
  );
};

export default AdminView;
