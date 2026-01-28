const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../../../config/env");

async function createJwtToken(id, expiresIn) {
  try {
    const token = await jwt.sign(id, JWT_SECRET, expiresIn);
    return token;
  } catch (error) {
    throw new Error("Error creating token: " + error.message);
  }
}

async function verifyJwtToken(token) {
  try {
    const decoded = await jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error("Error verifying token: " + error.message);
  }
}

module.exports = { createJwtToken, verifyJwtToken };
