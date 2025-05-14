import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import AddVehicleForm from './AddVehicleForm';
import VehiclesList from './VehiclesList';
import SearchHistory from './SearchHistory';
import DeleteConfirmation from './DeleteConfirmation';
import { Vehicle } from '@shared/schema';

const AdminDashboard = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  
  // Fetch all vehicles
  const vehiclesQuery = useQuery({
    queryKey: ['/api/vehicles'],
  });

  // Fetch search history
  const searchHistoryQuery = useQuery({
    queryKey: ['/api/search-history'],
  });

  // Filter vehicles based on search term
  const filteredVehicles = vehiclesQuery.data ? vehiclesQuery.data.filter((vehicle: Vehicle) => {
    const searchLower = searchTerm.toLowerCase();
    return vehicle.plateNumber.toLowerCase().includes(searchLower) || 
           vehicle.apartment.toLowerCase().includes(searchLower) ||
           (vehicle.ownerName && vehicle.ownerName.toLowerCase().includes(searchLower));
  }) : [];
  
  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setShowAddForm(true);
  };
  
  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };
  
  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingVehicle(null);
  };
  
  const handleDeleteClick = (vehicle: Vehicle) => {
    setVehicleToDelete(vehicle);
  };
  
  const handleCancelDelete = () => {
    setVehicleToDelete(null);
  };

  return (
    <div>
      {/* Admin actions */}
      <Card className="bg-white rounded-lg shadow-md p-6 mb-6">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-xl font-semibold">Manage Allowed Vehicles</h2>
            <Button 
              onClick={handleAddVehicle}
              className="mt-2 sm:mt-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Vehicle
            </Button>
          </div>
          
          {/* Search vehicles */}
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                id="admin-vehicle-search"
                className="pl-10"
                placeholder="Search by plate number or apartment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary">
                <Search className="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Add/Edit Vehicle Form */}
      {showAddForm && (
        <AddVehicleForm 
          onClose={handleCloseForm} 
          vehicle={editingVehicle}
        />
      )}
      
      {/* Vehicles List */}
      <VehiclesList 
        vehicles={filteredVehicles} 
        isLoading={vehiclesQuery.isLoading}
        onEdit={handleEditVehicle}
        onDelete={handleDeleteClick}
      />
      
      {/* Search History */}
      <SearchHistory 
        searchHistory={searchHistoryQuery.data || []}
        isLoading={searchHistoryQuery.isLoading}
      />
      
      {/* Delete Confirmation */}
      {vehicleToDelete && (
        <DeleteConfirmation 
          vehicle={vehicleToDelete}
          onCancel={handleCancelDelete}
          onConfirm={() => {
            setVehicleToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
