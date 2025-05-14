import { vehicles, users, searchHistory, adminSettings } from '@shared/schema';
import type { Vehicle, InsertVehicle, SearchHistory, InsertSearchHistory, AdminSettings, InsertAdminSettings, User, InsertUser } from '@shared/schema';
import { z } from 'zod';
import session from 'express-session';
import { eq, desc } from 'drizzle-orm';
import connectPg from 'connect-pg-simple';
import { db } from './db';

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle methods
  getAllVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: number): Promise<Vehicle | undefined>;
  getVehicleByPlate(plateNumber: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Search history methods
  getSearchHistory(limit?: number): Promise<SearchHistory[]>;
  addSearchHistory(searchHistory: InsertSearchHistory): Promise<SearchHistory>;
  
  // Admin settings methods
  getAdminSettings(): Promise<AdminSettings | undefined>;
  updateAdminPassword(password: string): Promise<AdminSettings>;
  initializeAdminPassword(password: string): Promise<AdminSettings>;
  
  // Session store for auth
  sessionStore: session.Store;
}

// Create a database storage class
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Set up the session store with PostgreSQL
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
    
    // Initialize sample data (this will only happen once)
    this.initSampleData();
  }
  
  async initSampleData() {
    try {
      // Check if we have any vehicles
      const existingVehicles = await db.select().from(vehicles);
      
      // If no vehicles exist, add sample data
      if (existingVehicles.length === 0) {
        console.log('Adding sample vehicle data...');
        
        await db.insert(vehicles).values([
          {
            plateNumber: 'ABC123',
            apartment: '304',
            ownerName: 'John Doe',
            notes: 'Toyota Camry, Blue'
          },
          {
            plateNumber: 'XYZ789',
            apartment: '102',
            ownerName: 'Jane Smith',
            notes: 'Honda Civic, Red'
          },
          {
            plateNumber: 'DEF456',
            apartment: '201',
            ownerName: 'Bob Johnson',
            notes: 'Ford Focus, Black'
          }
        ]);
      }
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Vehicle methods
  async getAllVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles);
  }

  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleByPlate(plateNumber: string): Promise<Vehicle | undefined> {
    // Convert to uppercase for consistent search
    const searchPlate = plateNumber.toUpperCase();
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.plateNumber, searchPlate));
    return vehicle;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    // Convert plate to uppercase for consistency
    const vehicleData = {
      ...insertVehicle,
      plateNumber: insertVehicle.plateNumber.toUpperCase()
    };
    
    const [vehicle] = await db.insert(vehicles).values(vehicleData).returning();
    return vehicle;
  }

  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    // If plate number is being updated, ensure it's uppercase
    if (vehicleData.plateNumber) {
      vehicleData.plateNumber = vehicleData.plateNumber.toUpperCase();
    }
    
    const [updatedVehicle] = await db
      .update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<boolean> {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return true; // If no error was thrown, deletion was successful
  }

  // Search history methods
  async getSearchHistory(limit: number = 10): Promise<SearchHistory[]> {
    return await db
      .select()
      .from(searchHistory)
      .orderBy(desc(searchHistory.searchedAt))
      .limit(limit);
  }

  async addSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    // Convert plate to uppercase for consistency
    const searchHistoryData = {
      ...insertSearchHistory,
      plateNumber: insertSearchHistory.plateNumber.toUpperCase()
    };
    
    const [newSearchHistory] = await db
      .insert(searchHistory)
      .values(searchHistoryData)
      .returning();
    
    return newSearchHistory;
  }

  // Admin settings methods
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings);
    return settings;
  }

  async updateAdminPassword(password: string): Promise<AdminSettings> {
    const existingSettings = await this.getAdminSettings();
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db
        .update(adminSettings)
        .set({ password })
        .where(eq(adminSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Create new settings if they don't exist
      const [newSettings] = await db
        .insert(adminSettings)
        .values({ password })
        .returning();
      
      return newSettings;
    }
  }

  async initializeAdminPassword(password: string): Promise<AdminSettings> {
    // Same as updateAdminPassword for PostgreSQL
    return this.updateAdminPassword(password);
  }
}

export const storage = new DatabaseStorage();