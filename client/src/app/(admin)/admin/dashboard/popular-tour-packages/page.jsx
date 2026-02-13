"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  MapPin,
  AlertCircle,
  X,
  AlertTriangle,
} from "lucide-react";
import { BASE_URL } from "@/config/Config";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Cookies from "js-cookie";
import { getMediaObject, getMediaUrl } from "@/lib/media";

const Packages = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    package: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    const fetchAllPackages = async () => {
      try {
        const [packagesRes] = await Promise.all([
          axios.get(`${BASE_URL}/package-tour/`),
        ]);

        if (packagesRes.data.data) {
          setData(packagesRes.data.data);
        } else if (Array.isArray(packagesRes.data)) {
          setData(packagesRes.data);
        } else {
          setData([]);
        }

      } catch (error) {
        console.error("Error fetching packages:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPackages();
  }, []);

  const openDeleteModal = (pkg) => {
    const item = pkg.package || pkg;
    const packageId = pkg._id || pkg.id;
    setDeleteModal({
      isOpen: true,
      package: { ...item, id: packageId },
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, package: null });
  };

  const handleDelete = async () => {
    if (!deleteModal.package) return;

    setIsDeleting(true);
    const deletingToast = toast.loading("Deleting package...", {
      style: {
        background: "#3b82f6",
        color: "#ffffff",
        fontWeight: "600",
        borderRadius: "12px",
        padding: "16px",
      },
    });

    try {
      const accessToken = Cookies.get("accessToken") || Cookies.get("token");
      if (!accessToken) {
        toast.error("Authentication token not found. Please log in again.", {
          id: deletingToast,
          icon: "🔐",
          duration: 4000,
        });
        setIsDeleting(false);
        return;
      }

      await axios.delete(`${BASE_URL}/package-tour/${deleteModal.package.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setData((prevData) => {
        return prevData.filter((pkg) => {
          const currentId = pkg._id || pkg.id;
          return currentId !== deleteModal.package.id;
        });
      });

      toast.success("Package deleted successfully!", {
        id: deletingToast,
        icon: "✅",
        duration: 3000,
        style: {
          background: "#10b981",
          color: "#ffffff",
          fontWeight: "600",
          borderRadius: "12px",
          padding: "16px",
        },
      });

      closeDeleteModal();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to delete package. Please try again.",
        {
          id: deletingToast,
          icon: "❌",
          duration: 4000,
          style: {
            background: "#ef4444",
            color: "#ffffff",
            fontWeight: "600",
            borderRadius: "12px",
            padding: "16px",
          },
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (id) => {
    router.push(`/admin/dashboard/popular-tour-packages/update/${id}`);
  };

  const filteredData = data.filter((pkg) => {
    const item = pkg.package || pkg;
    const title = item.title || "";
    return title.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const pagedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-[var(--admin-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-gray-600 font-medium">Loading packages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
        <div className="text-lg text-gray-800 font-semibold">
          Error Loading Data
        </div>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 font-sans">
      <div className="w-full">
        <div className="flex flex-col mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Packages
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              Manage your tour listings efficiently
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title..."
              className="w-full sm:w-64 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]/30 focus:border-[var(--admin-primary-border)]"
            />
            <button
              onClick={() =>
                router.push("/admin/dashboard/popular-tour-packages/add")
              }
              className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-2 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-strong)] text-white font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Add New Package
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-[var(--admin-primary-soft-strong)] text-left text-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Image</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Duration</th>
                  <th className="px-4 py-3 text-left font-semibold">Price</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedData.map((pkg, index) => {
                    const item = pkg.package || pkg;
                    const packageId = pkg._id || pkg.id;
                    const media = getMediaObject(item.mainImage || item.image);
                    const imageSrc = getMediaUrl(media, "medium") || "/bhutan.jpg";
                    return (
                      <tr key={packageId || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <img
                            src={imageSrc}
                            alt={item.title || "Package"}
                            className="h-12 w-16 rounded-md object-cover border border-gray-200"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div className="font-semibold text-gray-800 line-clamp-1">
                            {item.title || "Untitled Package"}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-2">
                            {item.sub_description || "—"}
                          </div>
                          {item.slug && (
                            <div className="text-[12px] text-gray-400">
                              Slug: <span className="font-medium">{item.slug}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.duration || "N/A"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {item.cost ? `$ ${item.cost}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(packageId)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-[var(--admin-primary-soft)] text-[var(--admin-primary)] hover:bg-[var(--admin-primary-soft-strong)] text-xs font-semibold"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => openDeleteModal(pkg)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {!loading && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 bg-white border-t border-dashed border-gray-300">
              <div className="bg-gray-100 p-4 rounded-full mb-3">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No packages found</p>
              <button
                onClick={() =>
                  router.push("/admin/dashboard/popular-tour-packages/add")
                }
                className="mt-2 text-[var(--admin-primary)] hover:underline text-sm"
              >
                Create your first package
              </button>
            </div>
          )}

          {filteredData.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Page {currentPage} of {Math.ceil(filteredData.length / itemsPerPage)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(filteredData.length / itemsPerPage),
                        prev + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(filteredData.length / itemsPerPage)
                  }
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
            <div className="relative p-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="bg-red-100 p-3 rounded-full shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Delete Package?
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    This action cannot be undone
                  </p>
                </div>
                <button
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                  className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  You are about to delete:
                </p>
                <p className="font-semibold text-gray-900 text-base wrap-break-words">
                  {deleteModal.package?.title || "Untitled Package"}
                </p>
                {deleteModal.package?.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Duration: {deleteModal.package.duration}
                  </p>
                )}
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> All package data, images, and
                  itinerary details will be permanently removed from the system.
                </p>
              </div>

              <p className="text-sm text-gray-600">
                Are you absolutely sure you want to proceed with this deletion?
              </p>
            </div>

            <div className="p-6 bg-gray-50 rounded-b-2xl flex flex-col sm:flex-row gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Delete Package
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
};

export default Packages;
