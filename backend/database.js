const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false // commonly needed for cloud PG
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize DB schema
async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS praises (
        id VARCHAR(255) PRIMARY KEY,
        playerName VARCHAR(255) NOT NULL,
        game VARCHAR(255) NOT NULL,
        region VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL,
        comment TEXT NOT NULL,
        bountyAmount INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'none',
        timestamp VARCHAR(255) NOT NULL,
        upvotes INTEGER DEFAULT 0,
        claimerName VARCHAR(255),
        evidenceLink TEXT,
        chatScreenshot TEXT,
        claimedAt VARCHAR(255)
      )
    `);
    console.log('Connected to the PostgreSQL database and initialized schema.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
  }
}

initDb();

module.exports = {
  query: (text, params) => pool.query(text, params),
};
