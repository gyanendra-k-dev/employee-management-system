const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    // Job titles that belong to this department, e.g. ["Frontend Developer", "QA Engineer"]
    designations: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Department', departmentSchema);
