import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertSearchHistorySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with sessions, bcrypt, and rate limiting
  const { requireAuth } = setupAuth(app);

  // Get admin settings
  app.get("/api/admin/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Admin settings not found" });
      }
      
      return res.json({ hasPassword: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to get admin settings" });
    }
  });

  // Get all vehicles - requires authentication
  app.get("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    try {
      const vehicles = await storage.getAllVehicles();
      return res.json(vehicles);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get vehicles" });
    }
  });

  // Get vehicle by ID - requires authentication
  app.get("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      const vehicle = await storage.getVehicleById(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      return res.json(vehicle);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get vehicle" });
    }
  });

  // Check if a plate number is allowed
  app.get("/api/vehicles/plate/:plateNumber", async (req: Request, res: Response) => {
    try {
      const plateNumber = req.params.plateNumber;
      
      if (!plateNumber) {
        return res.status(400).json({ message: "Plate number is required" });
      }
      
      const vehicle = await storage.getVehicleByPlate(plateNumber);
      
      // Add to search history
      await storage.addSearchHistory({
        plateNumber,
        allowed: !!vehicle,
        apartmentNumber: vehicle?.apartment,
      });
      
      if (!vehicle) {
        return res.json({ allowed: false });
      }
      
      return res.json({
        allowed: true,
        vehicle
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to check plate number" });
    }
  });

  // Create a new vehicle - requires authentication
  app.post("/api/vehicles", requireAuth, async (req: Request, res: Response) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      
      // Check if plate number already exists
      const existingVehicle = await storage.getVehicleByPlate(vehicleData.plateNumber);
      
      if (existingVehicle) {
        return res.status(409).json({ message: "A vehicle with this plate number already exists" });
      }
      
      const vehicle = await storage.createVehicle(vehicleData);
      return res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  // Update a vehicle - requires authentication
  app.put("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      // Partial validation
      const updatedData = insertVehicleSchema.partial().parse(req.body);
      
      // Check if vehicle exists
      const existingVehicle = await storage.getVehicleById(id);
      
      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      // If plate number is being updated, check for uniqueness
      if (updatedData.plateNumber && updatedData.plateNumber !== existingVehicle.plateNumber) {
        const vehicleWithSamePlate = await storage.getVehicleByPlate(updatedData.plateNumber);
        
        if (vehicleWithSamePlate) {
          return res.status(409).json({ message: "A vehicle with this plate number already exists" });
        }
      }
      
      const vehicle = await storage.updateVehicle(id, updatedData);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      return res.json(vehicle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      return res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Delete a vehicle - requires authentication
  app.delete("/api/vehicles/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid vehicle ID" });
      }
      
      // Check if vehicle exists
      const existingVehicle = await storage.getVehicleById(id);
      
      if (!existingVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      const success = await storage.deleteVehicle(id);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete vehicle" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete vehicle" });
    }
  });

  // Get search history - requires authentication
  app.get("/api/search-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await storage.getSearchHistory(limit);
      return res.json(history);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get search history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
