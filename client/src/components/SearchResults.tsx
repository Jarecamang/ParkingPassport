import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Car } from 'lucide-react';
import { Vehicle } from '@shared/schema';
import { format } from 'date-fns';

interface SearchResultsProps {
  searchResult: {
    allowed: boolean;
    vehicle?: Vehicle;
    searched: boolean;
    plateNumber: string;
  } | null;
}

const SearchResults = ({ searchResult }: SearchResultsProps) => {
  if (!searchResult) {
    return (
      <Card className="bg-white rounded-lg shadow-md p-6 text-center">
        <CardContent className="p-0">
          <Car className="h-12 w-12 mx-auto text-secondary mb-4" />
          <p className="text-lg">Enter a license plate number to check if it's allowed in the building.</p>
        </CardContent>
      </Card>
    );
  }

  if (!searchResult.searched) {
    return null;
  }

  if (searchResult.allowed && searchResult.vehicle) {
    return (
      <Card className="bg-white rounded-lg shadow-md p-6">
        <CardContent className="p-0">
          <div className="flex items-center mb-4">
            <div className="bg-accent/10 p-3 rounded-full mr-4">
              <Check className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Vehicle is allowed</h3>
              <p className="text-secondary">{searchResult.plateNumber}</p>
            </div>
          </div>
          <div className="border-t border-neutral-medium pt-4">
            <p className="font-medium">Vehicle Information:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm text-secondary">Apartment</p>
                <p>{searchResult.vehicle.apartment}</p>
              </div>
              <div>
                <p className="text-sm text-secondary">Added on</p>
                <p>{format(new Date(searchResult.vehicle.createdAt), 'MMM d, yyyy')}</p>
              </div>
              {searchResult.vehicle.ownerName && (
                <div>
                  <p className="text-sm text-secondary">Owner</p>
                  <p>{searchResult.vehicle.ownerName}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-md p-6">
      <CardContent className="p-0">
        <div className="flex items-center mb-4">
          <div className="bg-error/10 p-3 rounded-full mr-4">
            <X className="h-6 w-6 text-error" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Vehicle is not allowed</h3>
            <p className="text-secondary">{searchResult.plateNumber}</p>
          </div>
        </div>
        <div className="border-t border-neutral-medium pt-4">
          <p className="text-secondary">This vehicle is not registered in the allowed vehicles database.</p>
          <p className="mt-2">If you believe this is an error, please contact your building administrator.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResults;
