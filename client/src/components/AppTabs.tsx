import { type Dispatch, type SetStateAction } from 'react';

interface AppTabsProps {
  activeTab: 'resident' | 'admin';
  setActiveTab: Dispatch<SetStateAction<'resident' | 'admin'>>;
}

const AppTabs = ({ activeTab, setActiveTab }: AppTabsProps) => {
  return (
    <div className="mb-8">
      <div className="flex border-b border-neutral-dark">
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'resident' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-secondary'
          }`}
          onClick={() => setActiveTab('resident')}
        >
          Resident View
        </button>
        <button 
          className={`px-4 py-2 font-medium ${
            activeTab === 'admin' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-secondary'
          }`}
          onClick={() => setActiveTab('admin')}
        >
          Admin View
        </button>
      </div>
    </div>
  );
};

export default AppTabs;
