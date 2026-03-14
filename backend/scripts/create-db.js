/**
 * Creates the IMS database (ims_db) if it doesn't exist.
 * Uses DATABASE_URL from .env but connects to the default "postgres" database to run CREATE DATABASE.
 * Run once after installing PostgreSQL and setting your password in .env.
 */
require('dotenv').config();
const { Client } = require('pg');

function parseDatabaseUrl(url) {
  const u = new URL(url.replace('postgresql://', 'http://'));
  return {
    user: u.username,
    password: u.password,
    host: u.hostname,
    port: u.port || 5432,
    database: u.pathname.slice(1) || 'postgres',
  };
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }
  const config = parseDatabaseUrl(url);
  const dbToCreate = config.database;
  const client = new Client({
    user: config.user,
    password: config.password,
    host: config.host,
    port: parseInt(config.port, 10),
    database: 'postgres',
  });
  try {
    await client.connect();
    const res = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbToCreate]
    );
    if (res.rows.length === 0) {
      await client.query(`CREATE DATABASE "${dbToCreate}"`);
      console.log(`Database "${dbToCreate}" created.`);
    } else {
      console.log(`Database "${dbToCreate}" already exists.`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === '28P01') {
      console.error('\nAuthentication failed. Update .env with your PostgreSQL username and password.');
      console.error('Example: DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ims_db"');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
