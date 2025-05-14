import { drizzle } from 'drizzle-orm/neon-serverless';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Connection to database using env variables
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });