const express = require("express");
const {
  createAdmin,
  loginAdmin,
  logoutAdmin,
  getAllAdmins,
  changePassword,
  deleteAdmin,
  updateAdmin,
} = require("../controller/admin.controller");
const isAuthenticated = require("../middleware/isAuthenticated");
const { isAuthorized } = require("../middleware/isAuthorized");

const router = express.Router();

router.post(
  "/create",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  createAdmin
);
router.get(
  "/getAll",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  getAllAdmins
);
router.post("/login", loginAdmin);
router.put("/logout", logoutAdmin);
router.patch(
  "/reset-password",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  changePassword
);
router.delete(
  "/delete",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  deleteAdmin
);
router.put(
  "/update/:id",
  isAuthenticated,
  isAuthorized(["admin", "superadmin"]),
  updateAdmin
);

module.exports = router;
