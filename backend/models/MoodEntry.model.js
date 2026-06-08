const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  emotion:  { type: String, enum: ['happy','sad','anxious','angry','calm','neutral','fear','disgust','surprise'], required: true },
  score:    { type: Number, min: 1, max: 10 },           // self-rated mood score
  mlScore:  { type: Number, min: 0, max: 1 },            // ML confidence
  sentiment:{ type: Number, min: -1, max: 1 },
  note:     { type: String, maxlength: 500 },
  triggers: [String],                                    // e.g. ['work','family','sleep']
  source:   { type: String, enum: ['chat','manual','checkin'], default: 'chat' },
  isCrisis: { type: Boolean, default: false },
  date:     { type: Date, default: Date.now },
}, { timestamps: true });

// Index for efficient date-range queries
moodEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
