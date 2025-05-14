import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search } from 'lucide-react';
import { Vehicle } from '@shared/schema';

interface SearchFormProps {
  setSearchResult: React.Dispatch<React.SetStateAction<{
    allowed: boolean;
    vehicle?: Vehicle;
    searched: boolean;
    plateNumber: string;
  } | null>>;
}

const SearchForm = ({ setSearchResult }: SearchFormProps) => {
  const [plateNumber, setPlateNumber] = useState('');
  const { toast } = useToast();

  const checkPlateMutation = useMutation({
    mutationFn: async (plate: string) => {
      const response = await fetch(`/api/vehicles/plate/${plate}`);
      if (!response.ok) {
        throw new Error('Failed to check plate number');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setSearchResult({
        allowed: data.allowed,
        vehicle: data.vehicle,
        searched: true,
        plateNumber
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to check plate number. Please try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!plateNumber.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please enter a license plate number.',
        variant: 'destructive',
      });
      return;
    }
    
    checkPlateMutation.mutate(plateNumber.trim());
  };

  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
      <CardContent className="p-0">
        <h2 className="text-xl font-semibold mb-4">Check if a vehicle is allowed</h2>
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-4">
            <label htmlFor="plate-search" className="block text-sm font-medium text-secondary mb-1">
              License Plate Number
            </label>
            <div className="flex">
              <Input
                id="plate-search"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                className="rounded-r-none focus:border-primary focus:ring-primary"
                placeholder="Enter plate number (e.g. ABC123)"
              />
              <Button 
                type="submit" 
                className="rounded-l-none"
                disabled={checkPlateMutation.isPending}
              >
                {checkPlateMutation.isPending ? (
                  "Searching..."
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-secondary mt-1">Enter the complete license plate number</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchForm;
