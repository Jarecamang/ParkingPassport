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
      
      // Check if password is valid
      let isPasswordValid = false;
      
      // First check if we're still using the default password "admin"
      // To do this properly, let's verify if the stored password matches "admin"
      let isUsingDefaultPassword = false;
      
      try {
        // If the stored hash is from the word "admin", this will return true
        isUsingDefaultPassword = await bcrypt.compare("admin", settings.password);
      } catch (error) {
        console.error("BCrypt comparison error:", error);
        // Fallback to direct comparison for backward compatibility
        isUsingDefaultPassword = settings.password === "admin";
      }
      
      // Only allow "admin" login if we're still using the default password
      if (password === "admin" && isUsingDefaultPassword) {
        console.log("Logging in with default admin password");
        isPasswordValid = true;
      } 
      // Next check if password matches directly (legacy support)
      else if (settings.password === password) {
        console.log("Logging in with direct password match (legacy)");
        isPasswordValid = true;
      } 
      // Finally check with bcrypt (preferred method)
      else {
        try {
          isPasswordValid = await bcrypt.compare(password, settings.password);
          if (isPasswordValid) {
            console.log("Logging in with bcrypt password match");
          }
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

  // Configure password change rate limiting
  const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 password change attempts per hour
    message: 'Too many password change attempts, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Change admin password
  app.put('/api/admin/password', requireAuth, passwordChangeLimiter, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required' });
      }
      
      // Password complexity validation
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      
      // Prevent common passwords
      const commonPasswords = ['password', '123456', 'qwerty', 'admin123'];
      if (commonPasswords.includes(newPassword.toLowerCase())) {
        return res.status(400).json({ message: 'Please choose a more secure password' });
      }
      
      // Prevent new password from being the same as current
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password must be different from current password' });
      }
      
      const settings = await storage.getAdminSettings();
      
      if (!settings) {
        return res.status(404).json({ message: 'Admin settings not found' });
      }
      
      // Verify current password
      let isCurrentPasswordValid = false;
      
      // First check if we're still using the default password "admin"
      let isUsingDefaultPassword = false;
      
      try {
        // If the stored hash is from the word "admin", this will return true
        isUsingDefaultPassword = await bcrypt.compare("admin", settings.password);
      } catch (error) {
        console.error("BCrypt comparison error:", error);
        isUsingDefaultPassword = settings.password === "admin";
      }
      
      // Only allow "admin" as current password if we're still using the default
      if (currentPassword === "admin" && isUsingDefaultPassword) {
        console.log("Verifying with default admin password");
        isCurrentPasswordValid = true;
      }
      // Next check if password matches directly (legacy support)
      else if (settings.password === currentPassword) {
        console.log("Verifying with direct password match (legacy)");
        isCurrentPasswordValid = true;
      }
      // Finally check with bcrypt (preferred method)
      else {
        try {
          isCurrentPasswordValid = await bcrypt.compare(currentPassword, settings.password);
          if (isCurrentPasswordValid) {
            console.log("Verifying with bcrypt password match");
          }
        } catch (error) {
          console.error("BCrypt comparison error:", error);
          isCurrentPasswordValid = settings.password === currentPassword;
        }
      }
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password with a stronger work factor (12 vs default 10)
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      // Update the password
      await storage.updateAdminPassword(hashedPassword);
      
      // Log password change (but not the actual password)
      console.log(`Admin password changed successfully at ${new Date().toISOString()}`);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({ message: 'Failed to update password' });
    }
  });

  // Protect vehicle management endpoints
  app.post('/api/vehicles', requireAuth, (req, res, next) => next());
  app.put('/api/vehicles/:id', requireAuth, (req, res, next) => next());
  app.delete('/api/vehicles/:id', requireAuth, (req, res, next) => next());

  return { requireAuth };
}