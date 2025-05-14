import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminView = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if admin settings exist
  const adminSettingsQuery = useQuery({
    queryKey: ['/api/admin/settings'],
    enabled: !isLoggedIn
  });

  return (
    <div>
      {!isLoggedIn ? (
        <AdminLogin 
          setIsLoggedIn={setIsLoggedIn}
          isLoading={adminSettingsQuery.isLoading}
        />
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
};

export default AdminView;
