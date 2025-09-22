const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./user-service/models/user');

async function listUsers() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  const users = await User.find();
  console.log('Users:', users);
  await mongoose.disconnect();
}

listUsers().catch(console.error);
