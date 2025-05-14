import { Card, CardContent } from '@/components/ui/card';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { SearchHistory as SearchHistoryType } from '@shared/schema';

interface SearchHistoryProps {
  searchHistory: SearchHistoryType[];
  isLoading: boolean;
}

const SearchHistory = ({ searchHistory, isLoading }: SearchHistoryProps) => {
  const formatSearchTime = (date: Date | string) => {
    const searchDate = new Date(date);
    
    if (isToday(searchDate)) {
      return `Today, ${format(searchDate, 'h:mm a')}`;
    } else if (isYesterday(searchDate)) {
      return `Yesterday, ${format(searchDate, 'h:mm a')}`;
    } else {
      return format(searchDate, 'MMM d, h:mm a');
    }
  };
  
  return (
    <Card className="mt-6 bg-white rounded-lg shadow-md p-6">
      <CardContent className="p-0">
        <h3 className="text-lg font-semibold mb-4">Recent Search History</h3>
        
        {isLoading ? (
          <p>Loading search history...</p>
        ) : searchHistory.length === 0 ? (
          <p className="text-secondary">No search history yet.</p>
        ) : (
          <div className="space-y-2">
            {searchHistory.map((search) => (
              <div 
                key={search.id} 
                className="p-3 bg-neutral-light rounded-lg flex justify-between items-center"
              >
                <div>
                  <span className="font-medium">{search.plateNumber}</span>
                  <span className={`text-sm ml-2 ${search.allowed ? 'text-accent' : 'text-secondary'}`}>
                    {search.allowed 
                      ? `- Allowed (Apt ${search.apartmentNumber})` 
                      : '- Not allowed'}
                  </span>
                </div>
                <div className="text-xs text-secondary">
                  {formatSearchTime(search.searchedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchHistory;
