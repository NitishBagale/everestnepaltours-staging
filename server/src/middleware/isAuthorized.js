const Admin = require("../../models/admin/admin.model");

exports.isAuthorized = (roles) => {
  return async (req, res, next) => {
    try {
      console.log("isAuthorized - req.body:", req.body);
      let id = req._id;
      let result = await Admin.findByPk(id);
      let tokenRole = result.role;

      // console.log(" isAuthorized - User ID:", id);
      // console.log(" isAuthorized - User role from DB:", tokenRole);
      // console.log(" isAuthorized - Required roles:", roles);

      // Convert roles to array if it's a string
      const rolesArray = Array.isArray(roles) ? roles : [roles];
   
      const normalizedTokenRole = tokenRole?.toLowerCase();
      const normalizedRoles = rolesArray.map((r) => r.toLowerCase());

      if (normalizedRoles.includes(normalizedTokenRole)) {
        console.log("✅ Authorization successful");
        next();
      } else {
        console.log(" Authorization failed - role mismatch");
        res.status(403).json({
          success: false,
          message: "User not authorized",
          error: "You don't have permission to access this resource",
        });
      }
    } catch (error) {
      res.status(403).json({
        success: false,
        message: "User not authorized",
        error: error.message,
      });
    }
  };
};
