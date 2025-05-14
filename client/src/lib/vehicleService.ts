import { apiRequest } from './queryClient';
import { Vehicle, InsertVehicle } from '@shared/schema';

export const checkVehiclePlate = async (plateNumber: string) => {
  try {
    const response = await fetch(`/api/vehicles/plate/${plateNumber}`);
    if (!response.ok) {
      throw new Error('Failed to check plate number');
    }
    return response.json();
  } catch (error) {
    throw new Error('Failed to check plate number');
  }
};

export const getVehicles = async () => {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('Failed to get vehicles');
    }
    return response.json();
  } catch (error) {
    throw new Error('Failed to get vehicles');
  }
};

export const addVehicle = async (vehicle: InsertVehicle) => {
  try {
    const response = await apiRequest('POST', '/api/vehicles', vehicle);
    return response.json();
  } catch (error) {
    throw new Error('Failed to add vehicle');
  }
};

export const updateVehicle = async (id: number, vehicle: Partial<InsertVehicle>) => {
  try {
    const response = await apiRequest('PUT', `/api/vehicles/${id}`, vehicle);
    return response.json();
  } catch (error) {
    throw new Error('Failed to update vehicle');
  }
};

export const deleteVehicle = async (id: number) => {
  try {
    const response = await apiRequest('DELETE', `/api/vehicles/${id}`);
    return response.json();
  } catch (error) {
    throw new Error('Failed to delete vehicle');
  }
};

export const getSearchHistory = async () => {
  try {
    const response = await fetch('/api/search-history');
    if (!response.ok) {
      throw new Error('Failed to get search history');
    }
    return response.json();
  } catch (error) {
    throw new Error('Failed to get search history');
  }
};

export const verifyAdminPassword = async (password: string) => {
  try {
    const response = await apiRequest('POST', '/api/admin/login', { password });
    return response.json();
  } catch (error) {
    throw new Error('Failed to verify password');
  }
};
