import { 
  Vehicle, 
  InsertVehicle, 
  SearchHistory,
  InsertSearchHistory,
  AdminSettings,
  InsertAdminSettings,
  User,
  InsertUser
} from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private searchHistories: Map<number, SearchHistory>;
  private adminSettings: Map<number, AdminSettings>;
  private userCurrentId: number;
  private vehicleCurrentId: number;
  private searchHistoryCurrentId: number;
  private adminSettingsCurrentId: number;

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.searchHistories = new Map();
    this.adminSettings = new Map();
    
    this.userCurrentId = 1;
    this.vehicleCurrentId = 1;
    this.searchHistoryCurrentId = 1;
    this.adminSettingsCurrentId = 1;
    
    // Initialize admin password (default: admin)
    // We'll update this with bcrypt hash in the routes.ts file
    this.initializeAdminPassword("$2b$10$8nFJHmkXVqIePkNN3LbnFeuQDpYh7.QSh0cAwoVGDc7b349o2IODO"); // "admin" hashed with bcrypt
    
    // Add some sample vehicles for testing
    this.createVehicle({
      plateNumber: "ABC123",
      apartment: "304",
      ownerName: "Maria Rodriguez",
      notes: ""
    });
    
    this.createVehicle({
      plateNumber: "DEF456",
      apartment: "101",
      ownerName: "John Smith",
      notes: ""
    });
    
    this.createVehicle({
      plateNumber: "GHI789",
      apartment: "205",
      ownerName: "David Johnson",
      notes: ""
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Vehicle methods
  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).sort((a, b) => a.id - b.id);
  }
  
  async getVehicleById(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicleByPlate(plateNumber: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      (vehicle) => vehicle.plateNumber.toLowerCase() === plateNumber.toLowerCase(),
    );
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleCurrentId++;
    const createdAt = new Date();
    const vehicle: Vehicle = { 
      ...insertVehicle, 
      id,
      createdAt,
      ownerName: insertVehicle.ownerName || null,
      notes: insertVehicle.notes || null
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  
  async updateVehicle(id: number, vehicleData: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    
    if (!existingVehicle) {
      return undefined;
    }
    
    const updatedVehicle = {
      ...existingVehicle,
      ...vehicleData
    };
    
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }
  
  // Search history methods
  async getSearchHistory(limit: number = 10): Promise<SearchHistory[]> {
    return Array.from(this.searchHistories.values())
      .sort((a, b) => Number(b.searchedAt) - Number(a.searchedAt))
      .slice(0, limit);
  }
  
  async addSearchHistory(insertSearchHistory: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.searchHistoryCurrentId++;
    const searchedAt = new Date();
    const searchHistory: SearchHistory = { 
      ...insertSearchHistory, 
      id,
      searchedAt,
      apartmentNumber: insertSearchHistory.apartmentNumber || null
    };
    this.searchHistories.set(id, searchHistory);
    return searchHistory;
  }
  
  // Admin settings methods
  async getAdminSettings(): Promise<AdminSettings | undefined> {
    // We only have one admin settings entry with ID 1
    return this.adminSettings.get(1);
  }
  
  async updateAdminPassword(password: string): Promise<AdminSettings> {
    const adminSettings = await this.getAdminSettings();
    
    if (!adminSettings) {
      return this.initializeAdminPassword(password);
    }
    
    const updatedSettings: AdminSettings = {
      ...adminSettings,
      password
    };
    
    this.adminSettings.set(1, updatedSettings);
    return updatedSettings;
  }
  
  async initializeAdminPassword(password: string): Promise<AdminSettings> {
    const adminSettings: AdminSettings = {
      id: 1,
      password
    };
    
    this.adminSettings.set(1, adminSettings);
    return adminSettings;
  }
}

export const storage = new MemStorage();
