const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 8, select: false },
  resetPasswordToken:   { type: String },
  resetPasswordExpires: { type: Date },
  avatar:   { type: String, default: '' },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
  refreshToken: { type: String, select: false },

  // Emergency contact — notified ONLY on true crisis
  emergencyContact: { type: String, default: '' },  // email or phone
  emergencyName:    { type: String, default: '' },  // their name

  therapyGoals:        [String],
  preferredActivities: [String],
  totalSessions:   { type: Number, default: 0 },
  streakDays:      { type: Number, default: 0 },
  lastActiveDate:  Date,

  settings: {
    darkMode:      { type: Boolean, default: false },
    notifications: { type: Boolean, default: true },
    language:      { type: String,  default: 'en' },
  },
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateStreak = function() {
  const today = new Date(); today.setHours(0,0,0,0);
  if (!this.lastActiveDate) { this.streakDays = 1; }
  else {
    const last = new Date(this.lastActiveDate); last.setHours(0,0,0,0);
    const diff = (today - last) / (1000*60*60*24);
    if (diff === 1) this.streakDays += 1;
    else if (diff > 1) this.streakDays = 1;
  }
  this.lastActiveDate = new Date();
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password; delete obj.refreshToken; delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);