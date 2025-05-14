import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AdminLoginProps {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

const AdminLogin = ({ setIsLoggedIn, isLoading }: AdminLoginProps) => {
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await apiRequest('POST', '/api/admin/login', { password });
      return res.json();
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      toast({
        title: "Success",
        description: "You are now logged in as administrator",
      });
    },
    onError: () => {
      toast({
        title: "Invalid password",
        description: "The password you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      toast({
        title: "Missing password",
        description: "Please enter the administrator password",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate(password);
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
        <CardContent className="p-0">
          <h2 className="text-xl font-semibold mb-4">Administrator Login</h2>
          <p>Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
      <CardContent className="p-0">
        <h2 className="text-xl font-semibold mb-4">Administrator Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="admin-password" className="block text-sm font-medium text-secondary mb-1">
              Password
            </label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:border-primary focus:ring-primary"
              placeholder="Enter administrator password"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-blue-600"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                "Logging in..."
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminLogin;
