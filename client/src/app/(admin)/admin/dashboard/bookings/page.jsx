"use client";

import React, { useState, useEffect } from "react";
import { EyeIcon, CheckCircle, XCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

// --- 1. Styles Maps ---
const paymentColor = {
  paid: "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]",
  unpaid: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800",
};

const statusColor = {
  confirmed: "bg-[var(--admin-primary-soft-strong)] text-[var(--admin-primary-strong)]",
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]",
  cancelled: "bg-red-100 text-red-800",
};

// --- 2. Pagination Component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-between items-center mt-4 px-2">
      <span className="text-sm text-gray-600">
        Showing Page {currentPage} of {totalPages}
      </span>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-100"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const BookingsPage = () => {
  const router = useRouter();

  // --- State Definitions ---
  const [bookings, setBookings] = useState([]); // Raw data from API
  const [filteredBookings, setFilteredBookings] = useState([]); // Data after search/filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // For modal actions
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Pagination Constants
  const itemsPerPage = 10;

  // --- API Fetch Logic ---
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("accessToken") || Cookies.get("token");

      if (!token) {
        showToast("No authentication token found", "error");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BASE_URL}/booking/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data.data || response.data || [];
      console.log("Fetched bookings:", data);

      // Sort by newest first (optional)
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
        : [];

      setBookings(sortedData);
      setFilteredBookings(sortedData);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError("Failed to fetch bookings.");
      showToast("Failed to fetch bookings from server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // --- Search Logic ---
  useEffect(() => {
    if (!searchQuery) {
      setFilteredBookings(bookings);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = bookings.filter((booking) => {
        const name = `${booking.passengerInfo?.firstName || ""} ${
          booking.passengerInfo?.lastName || ""
        }`.toLowerCase();
        const vehicle = booking.vehicleName?.toLowerCase() || "";
        const id = booking.id?.toString() || "";
        return (
          name.includes(lowerQuery) ||
          vehicle.includes(lowerQuery) ||
          id.includes(lowerQuery)
        );
      });
      setFilteredBookings(filtered);
    }
    setCurrentPage(1); // Reset to page 1 on search
  }, [searchQuery, bookings]);

  // --- Pagination Logic ---
  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredBookings.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // --- Handlers ---

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = Cookies.get("accessToken") || Cookies.get("token");
      if (!token) return showToast("Unauthorized", "error");

      // API Call to confirm booking
      await axios.put(
        `${BASE_URL}/booking/confirm/${id}`,
        { status: "confirmed" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Booking confirmed successfully", "success");

      // Update local state
      setBookings((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "confirmed" } : item
        )
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to confirm booking", "error");
    }
  };

  const handleCancelBooking = (id) => {
    setSelectedRideId(id);
    setShowCancelModal(true);
  };

  const cancelModal = () => {
    setShowCancelModal(false);
    setCancellationReason("");
    setSelectedRideId(null);
  };

  const confirmCancellation = async () => {
    if (!cancellationReason.trim()) {
      alert("Please provide a reason");
      return;
    }

    try {
      setIsProcessing(true);
      const token = Cookies.get("accessToken") || Cookies.get("token");

      // API Call to cancel using specific cancel endpoint
      await axios.put(
        `${BASE_URL}/booking/cancel/${selectedRideId}`,
        { reason: cancellationReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast("Booking cancelled successfully", "success");

      // Update local state
      setBookings((prev) =>
        prev.map((item) =>
          item.id === selectedRideId ? { ...item, status: "cancelled" } : item
        )
      );

      cancelModal();
    } catch (err) {
      console.error(err);
      showToast("Failed to cancel booking", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => hideToast(), 3000);
  };

  const hideToast = () => {
    setToast({ ...toast, show: false });
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <div className="w-full">
        <main className="mb-10">
          <h1 className="text-2xl font-bold mb-4">Bookings Management</h1>
          {/* Search Header */}
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Search ID, Client or Vehicle..."
              className="border p-2 rounded w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary-ring)]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </main>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--admin-primary-border)]"></div>
            <span className="ml-3 text-gray-500">Loading bookings...</span>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-[900px] w-full bg-white shadow-md rounded-md overflow-hidden">
              <thead className="bg-[var(--admin-primary-soft-strong)] text-left text-gray-700">
                <tr>
                  <th className="p-3 font-semibold text-sm">SN</th>
                  <th className="p-3 font-semibold text-sm">Booking Date</th>
                  <th className="p-3 font-semibold text-sm">Client Name</th>

                  <th className="p-3 font-semibold text-sm">Trip Date</th>
                  <th className="p-3 font-semibold text-sm">Payment</th>
                  <th className="p-3 font-semibold text-sm">Status</th>
                  <th className="p-3 font-semibold text-sm">Actions</th>
                  <th className="p-3 font-semibold text-sm">View</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center p-8 text-gray-400 text-lg"
                    >
                      No Bookings found
                    </td>
                  </tr>
                ) : (
                  currentItems.map((ride, index) => (
                    <tr
                      key={ride.id}
                      className="text-sm border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-gray-600">
                        {startIndex + index + 1}
                      </td>
                      <td className="p-3">
                        {ride.bookingDate
                          ? new Date(ride.bookingDate)
                              .toISOString()
                              .split("T")[0]
                          : "N/A"}
                      </td>
                      <td className="p-3 font-medium text-gray-800">
                        {ride.trvellerInfo?.fullName || "N/A"}
                      </td>

                      <td className="p-3 text-xs text-gray-600">
                        <div>
                          <span className="font-semibold">P:</span>{" "}
                          {ride.pickupDate?.split("T")[0] || "N/A"}
                        </div>
                        <div>
                          <span className="font-semibold">R:</span>{" "}
                          {ride.returnDate?.split("T")[0] || "N/A"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-700">
                            {ride.payment || ride.totalAmount}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase w-fit ${
                              paymentColor[ride.paymentStatus?.toLowerCase()] ||
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {ride.paymentStatus || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div
                          className={`inline-block px-2 py-1 rounded font-medium text-xs capitalize ${
                            statusColor[ride.status?.toLowerCase()] ||
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ride.status || "Pending"}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            className="bg-[var(--admin-primary)] text-white px-2 py-1 rounded hover:bg-[var(--admin-primary-strong)] disabled:opacity-50 text-xs shadow-sm transition"
                            onClick={() => handleUpdateStatus(ride.id)}
                            disabled={
                              ride.status === "confirmed" ||
                              ride.status === "completed" ||
                              ride.status === "cancelled"
                            }
                            title="Confirm Booking"
                          >
                            Confirm
                          </button>
                          <button
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:opacity-50 text-xs shadow-sm transition"
                            onClick={() => handleCancelBooking(ride.id)}
                            disabled={ride.status === "cancelled"}
                            title="Cancel Booking"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          className="p-2 text-gray-600 hover:text-[var(--admin-primary)] hover:bg-[var(--admin-primary-soft)] rounded-full transition"
                          title="View Details"
                          onClick={() =>
                            router.push(`/admin/dashboard/bookings/${ride.id}`)
                          }
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Component */}
        {!loading && currentItems.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* Cancellation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={cancelModal}
            ></div>

            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl z-10 relative animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Cancel Booking
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to cancel this booking? This action cannot
                be undone.
              </p>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                rows={3}
                placeholder="Please enter a reason for cancellation..."
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={cancelModal}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmCancellation}
                  disabled={isProcessing}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {isProcessing ? "Processing..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast.show && (
          <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
            <div
              className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
                toast.type === "success"
                  ? "bg-white border-[var(--admin-primary-border)] text-[var(--admin-primary-strong)]"
                  : "bg-white border-red-500 text-red-700"
              }`}
            >
              {toast.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-[var(--admin-primary)]" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium text-sm text-gray-800">
                {toast.message}
              </span>
              <button
                onClick={hideToast}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </RoleProtectedRoute>
  );
};

export default BookingsPage;
