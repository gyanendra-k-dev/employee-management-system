const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, STATUSES } = require('../utils/constants');

const employeeSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index in MongoDB
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s()]{7,15}$/, 'Please enter a valid phone number'],
    },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    designation: { type: String, trim: true, maxlength: 60, default: '' },
    joiningDate: { type: Date, default: Date.now },
    status: { type: String, enum: STATUSES, default: 'active' },
    role: { type: String, enum: ROLES, default: 'employee' },

    // Credentials live in the same document but are hidden from every query by default.
    password: { type: String, required: true, minlength: 8, select: false },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// Hash the password only when it is new or changed.
employeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

employeeSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Never leak sensitive fields in JSON responses.
employeeSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Employee', employeeSchema);
