// Creates the FIRST admin account (there is no public way to create one).
// Usage: set ADMIN_* values in .env, then run:  npm run seed:admin
require('dotenv').config();
const mongoose = require('mongoose');
const Employee = require('../models/Employee');

(async () => {
  try {
    const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PHONE, ADMIN_PASSWORD } = process.env;
    if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error('MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }

    await mongoose.connect(MONGO_URI);

    const existing = await Employee.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log(`User ${ADMIN_EMAIL} already exists (role: ${existing.role}). Nothing changed.`);
    } else {
      await Employee.create({
        fullName: ADMIN_NAME || 'System Admin',
        email: ADMIN_EMAIL,
        phone: ADMIN_PHONE || '9999999999',
        password: ADMIN_PASSWORD,
        role: 'admin',
        status: 'active',
        designation: 'Administrator',
      });
      console.log(`Admin created: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
