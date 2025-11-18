/* eslint-env node */
/* global process */
import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Seed database with initial data
 */
const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('🌱 Starting database seeding...\n');

    await client.query('BEGIN');

    // Seed Users
    console.log('👤 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      { name: 'Admin User', email: 'admin@leadscoring.com', password: hashedPassword, role: 'admin' },
      { name: 'Sales Agent 1', email: 'sales1@leadscoring.com', password: hashedPassword, role: 'sales' },
      { name: 'Sales Agent 2', email: 'sales2@leadscoring.com', password: hashedPassword, role: 'sales' },
      { name: 'Manager User', email: 'manager@leadscoring.com', password: hashedPassword, role: 'admin' },
    ];

    for (const user of users) {
      await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [user.name, user.email, user.password, user.role]
      );
    }

    console.log('✅ Users seeded successfully');
    console.log('   - admin@leadscoring.com / password123 (admin)');
    console.log('   - sales1@leadscoring.com / password123 (sales)');
    console.log('   - sales2@leadscoring.com / password123 (sales)');
    console.log('   - manager@leadscoring.com / password123 (admin)\n');

    // Seed Sample Customers
    console.log('👥 Seeding sample customers...');

    const sampleCustomers = [
      ['John Doe', 30, 'technician', 'married', 'secondary', false, true, false, 'cellular', 'may', 'mon', 2, 999, 0, 'unknown'],
      ['Jane Smith', 35, 'management', 'single', 'tertiary', false, false, false, 'cellular', 'jun', 'tue', 1, 999, 0, 'unknown'],
      ['Robert Johnson', 45, 'services', 'married', 'secondary', false, true, true, 'telephone', 'jul', 'wed', 3, 10, 2, 'success'],
      ['Maria Garcia', 38, 'blue-collar', 'married', 'secondary', false, false, false, 'cellular', 'may', 'thu', 1, 999, 0, 'unknown'],
      ['David Brown', 42, 'entrepreneur', 'divorced', 'tertiary', false, true, false, 'cellular', 'aug', 'fri', 2, 15, 1, 'failure'],
      ['Sarah Williams', 28, 'admin.', 'single', 'tertiary', false, false, false, 'cellular', 'may', 'mon', 1, 999, 0, 'unknown'],
      ['Michael Jones', 50, 'retired', 'married', 'primary', false, true, false, 'telephone', 'jun', 'tue', 4, 20, 3, 'success'],
      ['Emily Davis', 33, 'technician', 'single', 'secondary', false, false, true, 'cellular', 'jul', 'wed', 2, 999, 0, 'unknown'],
      ['James Miller', 55, 'management', 'married', 'tertiary', false, true, false, 'cellular', 'aug', 'thu', 1, 10, 1, 'success'],
      ['Lisa Anderson', 26, 'student', 'single', 'tertiary', false, false, false, 'cellular', 'may', 'fri', 1, 999, 0, 'unknown'],
    ];

    for (const customer of sampleCustomers) {
      await client.query(
        `INSERT INTO customers
         (name, age, job, marital, education, has_default, has_housing_loan, has_personal_loan,
          contact, month, day_of_week, campaign, pdays, previous, poutcome)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        customer
      );
    }

    console.log(`✅ Seeded ${sampleCustomers.length} sample customers\n`);

    await client.query('COMMIT');

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📝 You can now login with:');
    console.log('   Email: admin@leadscoring.com or sales1@leadscoring.com');
    console.log('   Password: password123\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run seeding
seedDatabase()
  .then(() => {
    console.log('✅ Seed script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
