import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertSearchHistorySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get admin settings (password)
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

  // Verify admin password
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Admin settings not found" });
      }
      
      if (settings.password !== password) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to verify password" });
    }
  });

  // Change admin password
  app.put("/api/admin/password", async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Admin settings not found" });
      }
      
      if (settings.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      const updatedSettings = await storage.updateAdminPassword(newPassword);
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Get all vehicles
  app.get("/api/vehicles", async (req: Request, res: Response) => {
    try {
      const vehicles = await storage.getAllVehicles();
      return res.json(vehicles);
    } catch (error) {
      return res.status(500).json({ message: "Failed to get vehicles" });
    }
  });

  // Get vehicle by ID
  app.get("/api/vehicles/:id", async (req: Request, res: Response) => {
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

  // Create a new vehicle
  app.post("/api/vehicles", async (req: Request, res: Response) => {
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

  // Update a vehicle
  app.put("/api/vehicles/:id", async (req: Request, res: Response) => {
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

  // Delete a vehicle
  app.delete("/api/vehicles/:id", async (req: Request, res: Response) => {
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

  // Get search history
  app.get("/api/search-history", async (req: Request, res: Response) => {
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
