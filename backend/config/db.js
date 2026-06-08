const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true,
  };
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ DB Connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
