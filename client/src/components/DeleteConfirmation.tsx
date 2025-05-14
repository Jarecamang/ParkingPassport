import { useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Vehicle } from '@shared/schema';

interface DeleteConfirmationProps {
  vehicle: Vehicle;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmation = ({ vehicle, onCancel, onConfirm }: DeleteConfirmationProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/vehicles/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
      onConfirm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vehicle",
        variant: "destructive",
      });
    }
  });
  
  const handleConfirmDelete = () => {
    deleteVehicleMutation.mutate(vehicle.id);
  };
  
  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
        <p className="mb-4">
          Are you sure you want to remove the vehicle with plate number 
          <span className="font-semibold"> {vehicle.plateNumber}</span>?
        </p>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={deleteVehicleMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            disabled={deleteVehicleMutation.isPending}
          >
            {deleteVehicleMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
