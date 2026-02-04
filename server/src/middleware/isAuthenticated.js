const { JWT_SECRET } = require("../../config/env");
const { verifyJwtToken } = require("../lib/jwt/jwt");

async function isAuthenticated(req, res, next) {
  try {
    console.log('isAuthenticated - req.body:', req.body);
    const headerToken = req.headers.authorization;
    const cookieToken = req.cookies.token || req.cookies.accessToken;
    let tokenString = headerToken ? headerToken : cookieToken;

    if (tokenString && tokenString.startsWith("Bearer ")) {
      tokenString = tokenString.split(" ")[1];
    }

    if (!tokenString || tokenString === "undefined" || tokenString === "null") {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
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
