const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

async function check() {
  const dotenvPath = path.resolve(__dirname, '../../backend/.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }

  const client = new Client({
    host: process.env.SUPABASE_DB_HOST,
    port: process.env.SUPABASE_DB_PORT,
    database: process.env.SUPABASE_DB_NAME,
    user: process.env.SUPABASE_DB_USER,
    password: process.env.SUPABASE_DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // 1. Check total count
    const countRes = await client.query('SELECT count(*) FROM jobs');
    console.log('Total Jobs:', countRes.rows[0].count);

    // 2. Check for potential duplicates (Title + Company + Location)
    const dupRes = await client.query(`
      SELECT LOWER(TRIM(title)) as t, LOWER(TRIM(company_name)) as c, LOWER(TRIM(location)) as l, COUNT(*) 
      FROM jobs 
      GROUP BY 1, 2, 3 
      HAVING COUNT(*) > 1
    `);
    console.log('Duplicate groups found:', dupRes.rowCount);
    if (dupRes.rowCount > 0) {
        console.log('Sample duplicates:', dupRes.rows.slice(0, 3));
    }

    // 3. Sample a few rows to see if they look normalized
    const sampleRes = await client.query('SELECT title, company_name, location, job_type FROM jobs LIMIT 10');
    console.log('Sample Data:');
    console.table(sampleRes.rows);

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    await client.end();
  }
}

check();
