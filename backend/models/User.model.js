const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, select: false },
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date },
  
  role:     { type: String, enum: ['user','admin'], default: 'user' },

  refreshToken: { type: String, select: false },

  
  emergencyContact: { type: String, default: '' },  // email 
  emergencyName:    { type: String, default: '' },  // their name

 
 
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};



userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password; delete obj.refreshToken; delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);