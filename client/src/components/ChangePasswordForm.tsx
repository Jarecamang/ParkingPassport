import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock, X, KeyRound } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ChangePasswordFormProps {
  onClose: () => void;
}

const ChangePasswordForm = ({ onClose }: ChangePasswordFormProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest('PUT', '/api/admin/password', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your password has been updated successfully.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to change password",
        description: error.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    // Check password complexity - don't allow common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin123'];
    if (commonPasswords.includes(newPassword.toLowerCase())) {
      toast({
        title: "Password too weak",
        description: "Please choose a more secure password.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if new password is same as current
    if (currentPassword === newPassword) {
      toast({
        title: "Same password",
        description: "New password must be different from current password.",
        variant: "destructive",
      });
      return;
    }
    
    // Basic password strength check
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecialChar))) {
      toast({
        title: "Password too weak",
        description: "Password should have uppercase, lowercase and either numbers or special characters.",
        variant: "destructive"
      });
      // Show error but still allow the user to proceed if they confirm
      
      // Ask for confirmation
      if (!confirm("Your password is weak. Are you sure you want to continue?")) {
        return;
      }
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    });
  };

  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Change Administrator Password</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-secondary hover:text-dark"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-secondary mb-1">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="focus:border-primary focus:ring-primary"
                placeholder="Enter current password"
              />
            </div>
            
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-secondary mb-1">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="focus:border-primary focus:ring-primary"
                placeholder="Enter new password"
              />
              <div className="text-xs text-secondary mt-1 space-y-1">
                <p>Password requirements:</p>
                <ul className="list-disc list-inside ml-1">
                  <li>At least 6 characters long</li>
                  <li>Mix of uppercase and lowercase letters</li>
                  <li>Include numbers or special characters</li>
                  <li>Cannot be a common password (e.g., "password")</li>
                </ul>
              </div>
            </div>
            
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-secondary mb-1">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="focus:border-primary focus:ring-primary"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={changePasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="bg-primary hover:bg-blue-600"
            >
              {changePasswordMutation.isPending ? (
                "Updating..."
              ) : (
                <>
                  <KeyRound className="h-4 w-4 mr-2" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordForm;