const {
  createAdminService,
  loginAdminService,
  getAllAdminsService,
  changePasswordService,
  deleteAdminService,
} = require("../services/admin.service");

exports.createAdmin = async (req, res, next) => {
  const { name, email, password, role, profileImage } = req.body;
  try {
    const result = await createAdminService(
      name,
      email,
      password,
      role,
      profileImage
    );
    if (!result) {
      return res.status(400).json({ message: "Error creating admin" });
    }
    return res
      .status(201)
      .json({ message: "Admin created successfully", data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginAdmin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await loginAdminService(email, password);
    if (!result) {
      return res
        .status(400)
        .json({ success: false, code: 400, message: "User login failed" });
    }
    return res
      .cookie("token", result.token)
      .status(200)
      .json({
        success: true,
        code: 200,
        message: "Admin logged in successfully",
        data: result,
      });
  } catch (error) {
    res.status(500).json({ success: false, code: 500, message: error.message });
  }
};
exports.logoutAdmin = async (req, res, next) => {
  try {
    res.status(200).clearCookie("token").json({
      success: true,
      message: "Admin Logged Out Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllAdmins = async (req, res, next) => {
  try {
    const result = await getAllAdminsService();
    if (!result) {
      return res.status(400).json({ message: "Error fetching admins" });
    }
    return res
      .status(200)
      .json({ message: "Admins fetched successfully", data: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res, next) => {
  const id = req._id;
  const password = req.body.password;

  try {
    const result = await changePasswordService(password, id);
    res.status(200).json({
      success: true,
      message: "Password Changed Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAdmin = async (req, res, next) => {
  const id = req.query.id;

  try {
    const result = await deleteAdminService(id);
    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
      data: result,
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
