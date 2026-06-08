const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role:    { type: String, enum: ['user','assistant'], required: true },
  content: { type: String, required: true, maxlength: 2000 },
  emotion: { type: String, enum: ['happy','sad','anxious','angry','calm','neutral','fear','disgust','surprise'], default: 'neutral' },
  emotionScore:    { type: Number, default: 0 },  // ML confidence 0-1
  sentimentScore:  { type: Number, default: 0 },  // -1 to 1
  isCrisis:        { type: Boolean, default: false },
  crisisScore:     { type: Number, default: 0 },
  timestamp:       { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, default: 'Therapy Session' },
  messages: [messageSchema],
  dominantEmotion: { type: String, default: 'neutral' },
  sessionSummary:  { type: String, default: '' },
  tags:   [String],
  isActive: { type: Boolean, default: true },
  startedAt:  { type: Date, default: Date.now },
  endedAt:    Date,
  duration:   Number, // in minutes
}, { timestamps: true });

// Auto-generate title from first user message
sessionSchema.pre('save', function(next) {
  if (this.isNew && this.messages.length === 0) {
    this.title = `Session – ${new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}`;
  }
  next();
});

module.exports = mongoose.model('Session', sessionSchema);
