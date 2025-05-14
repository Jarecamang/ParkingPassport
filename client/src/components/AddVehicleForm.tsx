import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Vehicle } from '@shared/schema';

interface AddVehicleFormProps {
  onClose: () => void;
  vehicle: Vehicle | null;
}

const AddVehicleForm = ({ onClose, vehicle }: AddVehicleFormProps) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!vehicle;
  
  const [formData, setFormData] = useState({
    plateNumber: '',
    apartment: '',
    ownerName: '',
    notes: ''
  });
  
  useEffect(() => {
    if (vehicle) {
      setFormData({
        plateNumber: vehicle.plateNumber,
        apartment: vehicle.apartment,
        ownerName: vehicle.ownerName || '',
        notes: vehicle.notes || ''
      });
    }
  }, [vehicle]);
  
  const addVehicleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/vehicles', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add vehicle",
        variant: "destructive",
      });
    }
  });
  
  const updateVehicleMutation = useMutation({
    mutationFn: async (data: { id: number; formData: typeof formData }) => {
      const res = await apiRequest('PUT', `/api/vehicles/${data.id}`, data.formData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vehicle",
        variant: "destructive",
      });
    }
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: id === 'plateNumber' ? value.toUpperCase() : value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plateNumber.trim() || !formData.apartment.trim()) {
      toast({
        title: "Missing information",
        description: "Plate number and apartment are required",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditing && vehicle) {
      updateVehicleMutation.mutate({
        id: vehicle.id,
        formData
      });
    } else {
      addVehicleMutation.mutate(formData);
    }
  };
  
  const isPending = addVehicleMutation.isPending || updateVehicleMutation.isPending;

  return (
    <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
      <CardContent className="p-0">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h3>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-secondary mb-1">
                License Plate Number
              </label>
              <Input
                id="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                className="focus:border-primary focus:ring-primary"
                placeholder="ABC123"
                disabled={isEditing}
              />
            </div>
            <div>
              <label htmlFor="apartment" className="block text-sm font-medium text-secondary mb-1">
                Apartment
              </label>
              <Input
                id="apartment"
                value={formData.apartment}
                onChange={handleChange}
                className="focus:border-primary focus:ring-primary"
                placeholder="101"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="ownerName" className="block text-sm font-medium text-secondary mb-1">
                Owner Name (optional)
              </label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="focus:border-primary focus:ring-primary"
                placeholder="John Smith"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-secondary mb-1">
                Notes (optional)
              </label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={handleChange}
                className="focus:border-primary focus:ring-primary"
                placeholder="Additional information"
                rows={2}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
            >
              {isPending ? 'Saving...' : 'Save Vehicle'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddVehicleForm;
