const { hashPassword, comparePassword } = require("../lib/bcrypt/bcrypt");
const { createJwtToken } = require("../lib/jwt/jwt");
const Admin = require("../../models/admin/admin.model");

async function createAdminService(name, email, password, role, profileImage) {
  try {
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      throw new Error("Admin with this email already exists");
    }
    const hashedPassword = await hashPassword(password);
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
      profileImage,
    });
    return newAdmin;
  } catch (error) {
    throw new Error("Error creating admin: " + error.message);
  }
}

async function loginAdminService(email, password) {
  try {
    const admin = await Admin.findOne({ where: { email } });

    if (!admin) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = await createJwtToken(
      { id: admin.id, role: admin.role },
      { expiresIn: "1d" }
    );

    const { password: _, ...adminData } = admin.toJSON();

    return {
      admin: adminData,
      token,
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

async function getAllAdminsService() {
  try {
    const admins = await Admin.findAll();
    return admins;
  } catch (error) {
    throw new Error("Error fetching admins: " + error.message);
  }
}

async function changePasswordService(password, id) {
  try {
    const hashedPassword = await hashPassword(password);
    const result = await Admin.update(
      { password: hashedPassword },
      { where: { id: id } }
    );
    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function deleteAdminService(id) {
  try {
    const result = await Admin.destroy({
      where: { id },
    });

    if (result === 0) {
      throw new Error("Admin not found or already deleted");
    }

    return result;
  } catch (error) {
    throw new Error(error.message);
  }
}

async function updateAdminService(id, payload) {
  try {
    const admin = await Admin.findByPk(id);
    if (!admin) {
      throw new Error("Admin not found");
    }

    const updateData = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.email && payload.email !== admin.email) {
      const existing = await Admin.findOne({ where: { email: payload.email } });
      if (existing && existing.id !== admin.id) {
        throw new Error("Admin with this email already exists");
      }
      updateData.email = payload.email;
    }
    if (payload.role) updateData.role = payload.role;
    if (payload.profileImage !== undefined)
      updateData.profileImage = payload.profileImage;

    await Admin.update(updateData, { where: { id } });
    const updated = await Admin.findByPk(id);
    if (!updated) return null;
    const { password: _, ...adminData } = updated.toJSON();
    return adminData;
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = {
  createAdminService,
  loginAdminService,
  getAllAdminsService,
  changePasswordService,
  deleteAdminService,
  updateAdminService,
};
