const { ADMIN_MAIL } = require("../../config/env");
const { hashPassword } = require("../lib/bcrypt/bcrypt");
const Admin = require("../../models/admin/admin.model");

async function createInitialAdmin() {
  let data = {
    name: "Admin",
    email: ADMIN_MAIL,
    password: "Test@123",
    profileImage:
      "https://imgs.search.brave.com/e0fED6UW-aal5SIE5jJnZiTvyBbcSKfej8nI1OjajpE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzAzLzYyLzU2LzI0/LzM2MF9GXzM2MjU2/MjQ5NV9HYXUwUE96/Y3dSOEpDZlF1aWtW/VVRxek1GVG83OHZr/Ri5qcGc",
  };
  data = {
    ...data,
    password: await hashPassword(data.password),
  };
  try {
    const isExistingAdmin = await Admin.findOne({
      where: { email: data.email },
    });
    if (isExistingAdmin) {
      return;
    }
    const admin = await Admin.create(data);
    console.log("Initial admin created successfully:");
  } catch (error) {
    console.error("Error creating initial admin:", error);
  }
}

module.exports = createInitialAdmin;
