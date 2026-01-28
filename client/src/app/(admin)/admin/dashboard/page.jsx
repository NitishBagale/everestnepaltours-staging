"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { Banknote, Users, Ticket, ChevronDown } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

// --- Dummy Data (Kept exactly same) ---
const earningSummaryData = [
  { name: "Jan", value: 12000 },
  { name: "Feb", value: 15000 },
  { name: "Mar", value: 30000 },
  { name: "Apr", value: 18000 },
  { name: "May", value: 22000 },
  { name: "Jun", value: 14000 },
];

const vehicleStatusData = [
  { name: "Ongoing", value: 1000, color: "#93c5fd" },
  { name: "Returned", value: 7250, color: "#1e40af" },
  { name: "Cancelled", value: 1000, color: "#fca5a5" },
];

const softwareUsageData = [
  { name: "Figma", v2020: 40, v2021: 50, v2022: 60 },
  { name: "Sketch", v2020: 30, v2021: 60, v2022: 45 },
  { name: "XD", v2020: 50, v2021: 80, v2022: 70 },
  { name: "PS", v2020: 60, v2021: 70, v2022: 90 },
  { name: "AI", v2020: 70, v2021: 60, v2022: 80 },
  { name: "CorelDraw", v2020: 50, v2021: 55, v2022: 65 },
  { name: "Canva", v2020: 30, v2021: 50, v2022: 70 },
  { name: "InVision", v2020: 35, v2021: 40, v2022: 50 },
  { name: "Affinity", v2020: 25, v2021: 35, v2022: 45 },
  { name: "Master", v2020: 45, v2021: 55, v2022: 65 },
  { name: "Framer", v2020: 40, v2021: 50, v2022: 60 },
];

const DashboardPage = () => {
  const router = useRouter();

  // --- Dropdown States ---
  const [vehicleFilter, setVehicleFilter] = useState("This week");
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const vehicleOptions = ["This week", "Last week", "This month"];

  const [earningFilter, setEarningFilter] = useState("This month");
  const [isEarningDropdownOpen, setIsEarningDropdownOpen] = useState(false);
  const earningOptions = ["This week", "This month", "This year"];

  const statsData = useMemo(
    () => [
      {
        id: "earnings",
        label: "Earning",
        value: "Rs. 95,000",
        icon: <Banknote className="w-6 h-6 text-[var(--admin-primary-strong)]" />,
        bgColor: "bg-[var(--admin-primary)]",
        iconBg: "bg-white",
      },
      {
        id: "passengers",
        label: "Passengers",
        value: "1000",
        icon: <Users className="w-6 h-6 text-red-600" />,
        bgColor: "bg-red-600",
        iconBg: "bg-white",
      },
      {
        id: "bookings",
        label: "Bookings",
        value: "500",
        icon: <Ticket className="w-6 h-6 text-yellow-600" />,
        bgColor: "bg-yellow-500",
        iconBg: "bg-white",
      },
    ],
    []
  );

  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
        {/* Container: padding adapts to screen size (p-4 mobile, p-6 desktop) */}
        <main className="flex-1 bg-gray-50 min-h-full w-full">
          {/* Stats Cards: 1 column mobile, 2 tablet, 3 desktop */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {statsData.map((stat) => (
              <div
                key={stat.id}
                className={`${stat.bgColor} rounded-xl p-5 text-white shadow-md relative overflow-hidden transition-transform hover:scale-[1.01]`}
              >
                <div
                  className={`${stat.iconBg} w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-4 shadow-sm`}
                >
                  {stat.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1">
                  {stat.value}
                </h3>
                <p className="text-xs md:text-sm font-medium opacity-90">
                  {stat.label}
                </p>
              </div>
            ))}
          </section>

          {/* Middle Row: Charts */}
          {/* Grid: Stacked on mobile/tablet, Side-by-side on Large screens */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Left: Earning Summary (Takes 2 columns on Desktop) */}
            <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex flex-row justify-between items-center mb-6">
                <h2 className="font-bold text-gray-800 text-sm md:text-base">
                  Earning Summary
                </h2>

                {/* EARNING DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsEarningDropdownOpen(!isEarningDropdownOpen)
                    }
                    className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    <span>{earningFilter}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isEarningDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isEarningDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsEarningDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
                        {earningOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setEarningFilter(option);
                              setIsEarningDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                              earningFilter === option
                                ? "text-[var(--admin-primary)] font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="h-[250px] md:h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={earningSummaryData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#eee"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#888", fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#888", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "white",
                        stroke: "#3b82f6",
                        strokeWidth: 2,
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Vehicle Status (Takes 1 column on Desktop, full width on Mobile) */}
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 text-sm md:text-base">
                  Vehicle Status
                </h2>

                {/* VEHICLE DROPDOWN */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsVehicleDropdownOpen(!isVehicleDropdownOpen)
                    }
                    className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <span>{vehicleFilter}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isVehicleDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isVehicleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsVehicleDropdownOpen(false)}
                      ></div>
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20 py-1">
                        {vehicleOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setVehicleFilter(option);
                              setIsVehicleDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 ${
                              vehicleFilter === option
                                ? "text-[var(--admin-primary)] font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center items-center min-h-[200px]">
                <div className="h-[180px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        {vehicleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full mt-4 space-y-2">
                  {vehicleStatusData.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-gray-600">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">
                        {item.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Row: Bar Chart */}
          <section className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            {/* Legend: Stack nicely or scroll if needed */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-3 h-3 bg-indigo-400 rounded-sm"></span>2020
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-3 h-3 bg-[var(--admin-primary)] rounded-sm"></span>2021
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                <span className="w-3 h-3 bg-amber-400 rounded-sm"></span>2022
              </div>
            </div>

            <div className="h-[250px] md:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={softwareUsageData}
                  margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={true}
                    stroke="#f3f4f6"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    dy={10}
                    interval={0} // Force show all labels on mobile if they fit, or let recharts handle it
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f9fafb" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Bar dataKey="v2020" fill="#818cf8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="v2021" fill="#34d399" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="v2022" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </main>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
};

export default DashboardPage;
