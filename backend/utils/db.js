const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.tytzkeufaizdlqqnsnem:Welcome2OQT1997@aws-0-eu-central-1.pooler.supabase.com:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected');
    client.release();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  pool
};