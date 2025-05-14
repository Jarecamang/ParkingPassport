import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pencil, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { Vehicle } from '@shared/schema';

interface VehiclesListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

const VehiclesList = ({ vehicles, isLoading, onEdit, onDelete }: VehiclesListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVehicles = vehicles.slice(startIndex, startIndex + itemsPerPage);
  
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-light">
            <TableRow>
              <TableHead className="text-xs font-medium text-secondary uppercase tracking-wider">Plate Number</TableHead>
              <TableHead className="text-xs font-medium text-secondary uppercase tracking-wider">Apartment</TableHead>
              <TableHead className="text-xs font-medium text-secondary uppercase tracking-wider">Owner</TableHead>
              <TableHead className="text-xs font-medium text-secondary uppercase tracking-wider">Added On</TableHead>
              <TableHead className="text-xs font-medium text-secondary uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-neutral-medium">
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">Loading vehicles...</TableCell>
              </TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">No vehicles found.</TableCell>
              </TableRow>
            ) : (
              paginatedVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    {vehicle.plateNumber}
                  </TableCell>
                  <TableCell>
                    {vehicle.apartment}
                  </TableCell>
                  <TableCell>
                    {vehicle.ownerName || '-'}
                  </TableCell>
                  <TableCell className="text-secondary">
                    {format(new Date(vehicle.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary hover:text-blue-700 mr-1"
                      onClick={() => onEdit(vehicle)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-error hover:text-red-700"
                      onClick={() => onDelete(vehicle)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="px-6 py-4 bg-neutral-light border-t border-neutral-medium flex items-center justify-between">
        <div className="text-sm text-secondary">
          Showing <span>{paginatedVehicles.length}</span> of <span>{vehicles.length}</span> vehicles
        </div>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={currentPage ? "default" : "outline"}
            size="sm"
            className="px-3 py-1"
          >
            {currentPage}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VehiclesList;
