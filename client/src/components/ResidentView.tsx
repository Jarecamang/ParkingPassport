import { useState } from 'react';
import SearchForm from './SearchForm';
import SearchResults from './SearchResults';
import { Vehicle } from '@shared/schema';

const ResidentView = () => {
  const [searchResult, setSearchResult] = useState<{
    allowed: boolean;
    vehicle?: Vehicle;
    searched: boolean;
    plateNumber: string;
  } | null>(null);

  return (
    <div className="mb-8">
      <SearchForm setSearchResult={setSearchResult} />
      <SearchResults searchResult={searchResult} />
    </div>
  );
};

export default ResidentView;
