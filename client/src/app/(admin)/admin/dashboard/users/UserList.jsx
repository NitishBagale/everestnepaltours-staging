"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2"; // For elegant confirmation alerts
import toast, { Toaster } from "react-hot-toast"; // For generic success/error messages
import { BASE_URL } from "@/config/Config";

const UserList = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [filterRole, setFilterRole] = useState("All");
  const [loading, setLoading] = useState(false);

  // Error state is handled by toast now, but keeping for inline generic errors if needed
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper function to extract error message
  const getErrorMessage = (err) => {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 404) {
        return "API Endpoint not found (404). Check your Backend URL.";
      }
      return (
        err.response?.data?.message || err.message || "Something went wrong!"
      );
    }
    return "An unexpected error occurred.";
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${BASE_URL}/admin/getAll`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = response.data;

      // Robust data checking
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
        console.warn("Unexpected API response format:", data);
        toast.error("Received unexpected data format from server.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const msg = getErrorMessage(err);
      setError(msg); // Show inline for initial load
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsCreateMode(true);
    setCurrentUser({ name: "", email: "", role: "Editor", password: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setIsCreateMode(false);
    setCurrentUser({ ...user, password: "" }); // Clear password for security logic
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    // 1. SweetAlert Confirmation
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    // 2. Loading Toast
    const toastId = toast.loading("Deleting user...");

    try {
      // 3. API Call
      await axios.delete(`${BASE_URL}/admin/delete`, {
        params: { id },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 4. Update UI
      setUsers((prevUsers) =>
        prevUsers.filter((user) => (user.id || user._id) !== id)
      );

      // 5. Success Message
      toast.success("User deleted successfully!", { id: toastId });
    } catch (err) {
      console.error("Delete error details:", err);
      const msg = getErrorMessage(err);
      toast.error(msg, { id: toastId });
    }
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (!currentUser.name || !currentUser.email) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const toastId = toast.loading(
      isCreateMode ? "Creating user..." : "Updating user..."
    );

    if (isCreateMode) {
      try {
        const response = await axios.post(
          `${BASE_URL}/admin/create`,
          {
            name: currentUser.name,
            email: currentUser.email,
            password: currentUser.password,
            role: currentUser.role,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const newUser = response.data;
        // Fix: Handle cases where backend returns { data: user } or just user
        const userToAdd = newUser.user || newUser.data || newUser;

        setUsers((prev) => [...prev, userToAdd]);
        setIsModalOpen(false);
        setCurrentUser(null);
        toast.success("User created successfully!", { id: toastId });
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(msg, { id: toastId });
      }
    } else {
      // EDIT Logic (Local update for now, unless you add an API endpoint)
      try {
        // NOTE: Add axios.put() here if you have an endpoint like /admin/update/{id}

        setUsers(
          users.map((user) =>
            user.id === currentUser.id ? { ...currentUser } : user
          )
        );
        setIsModalOpen(false);
        setCurrentUser(null);
        toast.success("User updated locally (API not connected)", {
          id: toastId,
        });
      } catch (err) {
        toast.error("Failed to update", { id: toastId });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUser({ ...currentUser, [name]: value });
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;
    const userName = user.name?.toLowerCase() || "";
    const userEmail = user.email?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      userName.includes(searchLower) || userEmail.includes(searchLower);

    const userRole = user.role?.toLowerCase() || "";
    const filterRoleLower = filterRole.toLowerCase();
    const matchesRole = filterRole === "All" || userRole === filterRoleLower;

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role?.toLowerCase() === "admin").length,
    editors: users.filter((u) => u.role?.toLowerCase() === "editor").length,
  };

  return (
    <div className="w-full">
      {/* Toast Notification Container */}
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Inline Error for initial load issues */}
      {error && !loading && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
          <span>{error}</span>
          <button
            onClick={fetchUsers}
            className="text-sm underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600">Total Users</h3>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-[var(--admin-primary)]">Admins</h3>
          <p className="text-2xl font-bold">{stats.admins}</p>
        </div>
        <div className="bg-white p-4 rounded shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-[var(--admin-primary)]">Editors</h3>
          <p className="text-2xl font-bold">{stats.editors}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
        />
        <div className="flex gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="editor">Editor</option>
          </select>
          <button
            onClick={openCreateModal}
            className="bg-[var(--admin-primary)] text-white px-4 py-2 rounded hover:bg-[var(--admin-primary-strong)] transition"
          >
            Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-primary-border)]"></div>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-4 text-left font-semibold">Name</th>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-left font-semibold">Role</th>
                <th className="p-4 text-left font-semibold">Created At</th>
                <th className="p-4 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id || user._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4 text-gray-600">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          user.role?.toLowerCase() === "admin"
                            ? "bg-[var(--admin-primary-soft-strong)] text-[var(--admin-primary-strong)]"
                            : "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No users found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md animate-fade-in-down">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {isCreateMode ? "Create New User" : "Edit User"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={currentUser?.name || ""}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={currentUser?.email || ""}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                  required
                />
              </div>
              {isCreateMode && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={currentUser?.password || ""}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                    required={isCreateMode}
                  />
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Role
                </label>
                <div className="relative">
                  <select
                    name="role"
                    value={currentUser?.role || "Editor"}
                    onChange={handleInputChange}
                    className="w-full appearance-none border bg-white px-3 py-2 pr-10 rounded outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--admin-primary)] text-white rounded hover:bg-[var(--admin-primary-strong)]"
                >
                  {isCreateMode ? "Create User" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
