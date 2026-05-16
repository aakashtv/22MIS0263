require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  baseUrl: process.env.API_BASE_URL || 'http://localhost:8080/api',
  credentials: {
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    email: process.env.CLIENT_EMAIL,
    rollNo: process.env.CLIENT_ROLL_NO,
  },
};
