import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import axios from "axios";

// Slash fix: Remove trailing slash if exists
const baseURL = (
  process.env.NEXT_API_BASED_URL || "http://localhost:4000"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";
export const dynamicParams = true;

async function getBooking(id) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("accessToken")?.value || cookieStore.get("token")?.value;

  // Debugging: Check generated URL and ID
  const apiUrl = `${baseURL}/booking/get/${id}`;
  console.log("Fetching URL:", apiUrl);

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // Debugging: Check success response
    // console.log("API Response:", response.data);

    return response.data.data;
  } catch (error) {
    // Debugging: Print detailed error in terminal
    if (axios.isAxiosError(error)) {
      console.error("Axios Error Status:", error.response?.status);
      console.error("Axios Error Message:", error.message);
      // console.error("Axios Error Data:", error.response?.data);
    } else {
      console.error("Unexpected Error:", error);
    }
    return null;
  }
}

const Detail = ({ label, value }) => {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-3 border-b border-gray-100 last:border-0">
      <span className="col-span-1 font-medium text-gray-500">{label}:</span>
      <span className="col-span-2 text-gray-900 font-medium wrap-break-word">
        {value}
      </span>
    </div>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default async function Page({ params }) {
  const { id } = await params; // Next.js 15 uses await params

  const bookingData = await getBooking(id);

  if (!bookingData) {
    console.error("Booking Data is null, triggering notFound()");
    return notFound();
  }

  const { trvellerInfo = {} } = bookingData;

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8 mt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Booking Details</h2>
        <Link
          href="/admin/dashboard/bookings"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left Column: Dates & Status */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--admin-primary)] mb-4 border-b pb-2">
                Booking Information
              </h3>
              <Detail label="Booking ID" value={bookingData.id} />
              <Detail
                label="Booking Date"
                value={formatDate(bookingData.bookingDate)}
              />
              <Detail
                label="Pickup Date"
                value={formatDate(bookingData.pickupDate)}
              />
              <Detail
                label="Return Date"
                value={formatDate(bookingData.returnDate)}
              />
              <Detail
                label="Status"
                value={
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      bookingData.status?.toLowerCase() === "cancelled"
                        ? "bg-red-100 text-red-700"
                        : bookingData.status?.toLowerCase() === "confirmed"
                        ? "bg-[var(--admin-primary-soft-strong)] text-[var(--admin-primary-strong)]"
                        : "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]"
                    }`}
                  >
                    {bookingData.status}
                  </span>
                }
              />
            </div>

            {/* Right Column: Package Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--admin-primary)] mb-4 border-b pb-2">
                Package Details
              </h3>
              <Detail label="Package Name" value={bookingData.packageName} />
              <Detail label="Description" value={bookingData.details} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
            {/* Traveller Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--admin-primary)] mb-4 border-b pb-2">
                Traveller Information
              </h3>
              <Detail label="Full Name" value={trvellerInfo.fullName} />
              <Detail label="Email" value={trvellerInfo.email} />
              <Detail label="Contact" value={trvellerInfo.contactNumber} />
              <Detail
                label="Travel Date"
                value={formatDate(trvellerInfo.travelDate)}
              />
              <Detail label="Travellers" value={trvellerInfo.noOfTravellers} />
              <Detail
                label="Accommodation"
                value={trvellerInfo.accommodation}
              />
              <Detail label="Passport" value={trvellerInfo.passport} />
            </div>

            {/* Payment Info */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--admin-primary)] mb-4 border-b pb-2">
                Payment Details
              </h3>
              <Detail
                label="Total Amount"
                value={
                  bookingData.totalAmount
                    ? `Rs. ${bookingData.totalAmount}`
                    : "N/A"
                }
              />
              <Detail
                label="Payment Status"
                value={
                  <span
                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      bookingData.paymentStatus?.toLowerCase() === "paid"
                        ? "bg-[var(--admin-primary-soft)] text-[var(--admin-primary-strong)]"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {bookingData.paymentStatus}
                  </span>
                }
              />
            </div>
          </div>

          {/* Notes */}
          {trvellerInfo.details && (
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Traveller Notes
              </h3>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-gray-700">
                {trvellerInfo.details}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [];
}
