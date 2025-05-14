import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import AppTabs from '@/components/AppTabs';
import ResidentView from '@/components/ResidentView';
import AdminView from '@/components/AdminView';
import AppFooter from '@/components/AppFooter';

const Home = () => {
  const [activeTab, setActiveTab] = useState<'resident' | 'admin'>('resident');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AppHeader />
      <AppTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'resident' ? <ResidentView /> : <AdminView />}
      <AppFooter />
    </div>
  );
};

export default Home;
