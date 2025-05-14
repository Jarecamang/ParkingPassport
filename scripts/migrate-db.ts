import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for serverless environments
neonConfig.webSocketConstructor = ws;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Connect to the database
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Creating tables in the database...');

  // Create direct push of the schema
  try {
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `);

    // Create vehicles table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        plate_number TEXT NOT NULL UNIQUE,
        apartment TEXT NOT NULL,
        owner TEXT NOT NULL,
        make TEXT,
        model TEXT,
        color TEXT,
        permitted BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create search_history table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS search_history (
        id SERIAL PRIMARY KEY,
        plate_number TEXT NOT NULL,
        allowed BOOLEAN NOT NULL,
        apartment TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // Create admin_settings table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        id SERIAL PRIMARY KEY,
        password TEXT NOT NULL
      );
    `);

    // Create session table if it doesn't exist (for connect-pg-simple)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error creating database tables:', error);
    process.exit(1);
  }

  await pool.end();
}

main()
  .then(() => {
    console.log('Database migration completed successfully');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });