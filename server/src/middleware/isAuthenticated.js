const { JWT_SECRET } = require("../../config/env");
const { verifyJwtToken } = require("../lib/jwt/jwt");

async function isAuthenticated(req, res, next) {
  try {
    console.log('isAuthenticated - req.body:', req.body);
    let tokenString = req.headers.authorization || req.cookies.token;

    if (!tokenString) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    if (tokenString.startsWith("Bearer ")) {
      tokenString = tokenString.split(" ")[1];
    }

    const result = await verifyJwtToken(tokenString, JWT_SECRET);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Invalid Token",
      });
    }

    req._id = result.id;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = isAuthenticated;
