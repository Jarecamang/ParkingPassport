import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { rateLimit } from 'express-rate-limit';
import bcrypt from 'bcrypt';
import createMemoryStore from 'memorystore';
import { storage } from './storage';

// Extend the Express session with our custom fields
declare module 'express-session' {
  interface SessionData {
    isAuthenticated?: boolean;
  }
}

const MemoryStore = createMemoryStore(session);

// Generate a random session secret
const SESSION_SECRET = process.env.SESSION_SECRET || 
  Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

// Configure rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

export function setupAuth(app: Express) {
  // Set trust proxy for rate limiter to work properly in Replit environment
  app.set('trust proxy', 1);
  
  // Set up session middleware
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Middleware to check if user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.isAuthenticated) {
      next();
    } else {
      res.status(401).json({ message: 'Authentication required' });
    }
  };

  // Verify admin password
  app.post('/api/admin/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }
      
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Admin settings not found' });
      }
      
      // For backward compatibility during transition - allow direct "admin" password
      // This is temporary and should be removed in production
      let isPasswordValid = false;
      
      if (password === "admin" || settings.password === password) {
        isPasswordValid = true;
        
        // If we're using the default password, hash it properly for next time
        if (password === "admin") {
          const hashedPassword = await bcrypt.hash("admin", 10);
          await storage.updateAdminPassword(hashedPassword);
        }
      } else {
        // Try to compare with bcrypt
        try {
          isPasswordValid = await bcrypt.compare(password, settings.password);
        } catch (error) {
          console.error("BCrypt comparison error:", error);
          // If bcrypt fails (malformed hash), fallback to direct comparison
          isPasswordValid = settings.password === password;
        }
      }
      
      if (!isPasswordValid) {
        console.log(`Login failed with password: ${password.substr(0, 2)}*** (hash: ${settings.password.substr(0, 10)}...)`);
        return res.status(401).json({ message: 'Invalid password' });
      }
      
      // Set authentication status in session
      req.session.isAuthenticated = true;
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to verify password' });
    }
  });

  // Logout endpoint
  app.post('/api/admin/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ success: true });
    });
  });

  // Check auth status
  app.get('/api/admin/auth-status', (req: Request, res: Response) => {
    res.json({ 
      isAuthenticated: req.session.isAuthenticated || false 
    });
  });

  // Change admin password
  app.put('/api/admin/password', requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Admin settings not found' });
      }
      
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, settings.password);
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update the password
      await storage.updateAdminPassword(hashedPassword);
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Protect vehicle management endpoints
  app.post('/api/vehicles', requireAuth, (req, res, next) => next());
  app.put('/api/vehicles/:id', requireAuth, (req, res, next) => next());
  app.delete('/api/vehicles/:id', requireAuth, (req, res, next) => next());

  return { requireAuth };
}