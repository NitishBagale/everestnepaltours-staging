"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import {
  Banknote,
  Users,
  Ticket,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
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

const rangeOptions = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
];

const formatCompact = (value) =>
  value.toLocaleString("en-IN", { maximumFractionDigits: 0 });

const formatCurrency = (value) =>
  `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const mulberry32 = (seed) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const buildSeries = (days, seed, startOffset = 0) => {
  const rand = mulberry32(seed);
  const today = new Date();
  const points = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i + startOffset));
    const wave = Math.sin((i / Math.max(days - 1, 1)) * Math.PI * 2);
    const trend = 1 + (days - i) * 0.002;
    const noise = (rand() - 0.5) * 5000;
    const revenue = Math.max(
      2500,
      Math.round(14000 * (1 + 0.35 * wave) * trend + noise)
    );
    const avgTicket = 6800 + rand() * 4200;
    const bookings = Math.max(3, Math.round(revenue / avgTicket));
    const passengers = Math.round(bookings * (1.5 + rand() * 0.7));
    const cancellations = Math.max(0, Math.round(bookings * (0.06 + rand() * 0.05)));

    points.push({
      name: date.toLocaleString("en-US", { month: "short", day: "numeric" }),
      revenue,
      bookings,
      passengers,
      cancellations,
    });
  }

  return points;
};

const calcTotals = (series) =>
  series.reduce(
    (acc, item) => ({
      revenue: acc.revenue + item.revenue,
      bookings: acc.bookings + item.bookings,
      passengers: acc.passengers + item.passengers,
      cancellations: acc.cancellations + item.cancellations,
    }),
    { revenue: 0, bookings: 0, passengers: 0, cancellations: 0 }
  );

const percentChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

const parseAmount = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "Just now";
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const normalizeStatus = (value) => {
  if (!value) return "Pending";
  const normalized = value.toLowerCase();
  const map = {
    confirmed: "Confirmed",
    pending: "Pending",
    verified: "Verified",
    ongoing: "Ongoing",
    cancelled: "Cancelled",
  };
  return map[normalized] || "Follow-up";
};

const DeltaBadge = ({ value, inverse = false }) => {
  const positive = value >= 0;
  const isGood = inverse ? !positive : positive;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
        isGood ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
      }`}
    >
      <Icon className="w-3 h-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const MiniSparkline = ({ data, dataKey, stroke }) => (
  <div className="h-12 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={stroke}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const DashboardPage = () => {
  const [selectedRange, setSelectedRange] = useState("30d");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState("");

  const activeRange = rangeOptions.find((option) => option.id === selectedRange);
  const currentSeries = useMemo(
    () => buildSeries(activeRange.days, 42),
    [activeRange.days]
  );
  const previousSeries = useMemo(
    () => buildSeries(activeRange.days, 17, activeRange.days),
    [activeRange.days]
  );
  const totals = useMemo(() => calcTotals(currentSeries), [currentSeries]);
  const previousTotals = useMemo(
    () => calcTotals(previousSeries),
    [previousSeries]
  );

  const avgTicket = totals.bookings
    ? Math.round(totals.revenue / totals.bookings)
    : 0;
  const cancellationRate = totals.bookings
    ? (totals.cancellations / totals.bookings) * 100
    : 0;

  const statsData = useMemo(
    () => [
      {
        id: "revenue",
        label: "Revenue",
        value: formatCurrency(totals.revenue),
        delta: percentChange(totals.revenue, previousTotals.revenue),
        icon: <Banknote className="w-5 h-5 text-emerald-700" />,
        chip: "Receipts",
        sparkKey: "revenue",
        sparkColor: "#059669",
        cardStyle:
          "bg-gradient-to-br from-emerald-100 via-white to-emerald-50 border-emerald-100",
      },
      {
        id: "bookings",
        label: "Bookings",
        value: formatCompact(totals.bookings),
        delta: percentChange(totals.bookings, previousTotals.bookings),
        icon: <Ticket className="w-5 h-5 text-sky-700" />,
        chip: "Confirmed",
        sparkKey: "bookings",
        sparkColor: "#0284c7",
        cardStyle:
          "bg-gradient-to-br from-sky-100 via-white to-sky-50 border-sky-100",
      },
      {
        id: "passengers",
        label: "Passengers",
        value: formatCompact(totals.passengers),
        delta: percentChange(totals.passengers, previousTotals.passengers),
        icon: <Users className="w-5 h-5 text-amber-700" />,
        chip: "Boarded",
        sparkKey: "passengers",
        sparkColor: "#d97706",
        cardStyle:
          "bg-gradient-to-br from-amber-100 via-white to-amber-50 border-amber-100",
      },
      {
        id: "cancellations",
        label: "Cancellation rate",
        value: `${cancellationRate.toFixed(1)}%`,
        delta: percentChange(
          totals.cancellations,
          previousTotals.cancellations
        ),
        inverseDelta: true,
        icon: <Percent className="w-5 h-5 text-rose-700" />,
        chip: "Last-minute",
        sparkKey: "cancellations",
        sparkColor: "#e11d48",
        cardStyle:
          "bg-gradient-to-br from-rose-100 via-white to-rose-50 border-rose-100",
      },
    ],
    [totals, previousTotals, cancellationRate]
  );

  const tripStatusData = useMemo(() => {
    const ongoing = Math.max(2, Math.round(totals.bookings * 0.12));
    const cancelled = totals.cancellations;
    const completed = Math.max(
      0,
      totals.bookings - ongoing - cancelled
    );
    return [
      { name: "Ongoing", value: ongoing, color: "#60a5fa" },
      { name: "Completed", value: completed, color: "#0f766e" },
      { name: "Cancelled", value: cancelled, color: "#f97316" },
    ];
  }, [totals]);

  const packagePerformance = useMemo(() => {
    const labels = [
      "Everest Base Camp",
      "Annapurna Circuit",
      "Upper Mustang",
      "Langtang Valley",
      "Gokyo Lakes",
      "Manaslu Trek",
    ];
    const rand = mulberry32(8);
    return labels.map((label) => ({
      name: label,
      value: Math.round(
        (totals.revenue / labels.length) * (0.65 + rand() * 0.9)
      ),
    }));
  }, [totals.revenue]);

  useEffect(() => {
    const fetchRecentBookings = async () => {
      try {
        setRecentLoading(true);
        setRecentError("");
        const token = Cookies.get("accessToken") || Cookies.get("token");
        if (!token) {
          setRecentError("Missing auth token.");
          setRecentBookings([]);
          return;
        }

        const response = await axios.get(`${BASE_URL}/booking/get`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = response.data?.data || response.data || [];
        const sorted = Array.isArray(data)
          ? data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            )
          : [];

        const mapped = sorted.slice(0, 6).map((booking) => {
          let travellerInfo = booking.trvellerInfo || {};
          if (typeof booking.trvellerInfo === "string") {
            try {
              travellerInfo = JSON.parse(booking.trvellerInfo);
            } catch (parseError) {
              travellerInfo = {};
            }
          }

          return {
            id: booking.id,
            name: travellerInfo.fullName || "Guest",
            pkg: booking.packageName || "Package Tour",
            status: normalizeStatus(booking.status),
            value: parseAmount(booking.totalAmount),
            timeAgo: formatTimeAgo(booking.createdAt || booking.updatedAt),
          };
        });

        setRecentBookings(mapped);
      } catch (error) {
        console.error("Error fetching recent bookings:", error);
        setRecentError("Failed to load recent bookings.");
        setRecentBookings([]);
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecentBookings();
  }, []);

  const peakDay = useMemo(
    () =>
      currentSeries.reduce((best, item) =>
        item.revenue > best.revenue ? item : best
      ),
    [currentSeries]
  );

  return (
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={["admin", "superadmin"]}>
        <main className="flex-1 min-h-full w-full bg-slate-50">
          <section className="relative rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white shadow-sm md:px-8 md:py-10 mb-6">
            <div className="absolute right-[-120px] top-[-140px] h-60 w-60 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute left-[-80px] bottom-[-120px] h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  Live Operations
                </div>
                <h1 className="mt-4 text-2xl font-semibold md:text-3xl">
                  Dashboard pulse for the {activeRange.label.toLowerCase()}
                </h1>
                <p className="mt-2 text-sm text-slate-200">
                  Revenue is tracking steadily with a peak on {peakDay.name}.
                  Average ticket size is {formatCurrency(avgTicket)}.
                </p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsRangeDropdownOpen(!isRangeDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide hover:bg-white/20"
                >
                  {activeRange.label}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isRangeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isRangeDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsRangeDropdownOpen(false)}
                    />
                    <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white py-2 text-slate-700 shadow-lg">
                      {rangeOptions.map((option) => (
                        <button
                          key={option.id}
                          onClick={() => {
                            setSelectedRange(option.id);
                            setIsRangeDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                            selectedRange === option.id
                              ? "font-semibold text-slate-900"
                              : "text-slate-600"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
            {statsData.map((stat) => (
              <div
                key={stat.id}
                className={`rounded-2xl border p-5 shadow-sm transition-transform hover:-translate-y-1 ${stat.cardStyle}`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                    {stat.icon}
                    {stat.chip}
                  </div>
                  <DeltaBadge
                    value={stat.delta}
                    inverse={stat.inverseDelta}
                  />
                </div>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                  {stat.value}
                </h3>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <MiniSparkline
                  data={currentSeries}
                  dataKey={stat.sparkKey}
                  stroke={stat.sparkColor}
                />
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Revenue trend
                  </h2>
                  <p className="text-xs text-slate-500">
                    Daily receipts with seasonal lift and booking demand.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <Sparkles className="h-4 w-4" />
                  Forecast stable
                </div>
              </div>
              <div className="mt-6 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentSeries}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      interval="preserveStartEnd"
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#0f766e"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-sm font-semibold text-slate-800">
                Trip status
              </h2>
              <p className="text-xs text-slate-500">
                Distribution of current itineraries and completion.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tripStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={84}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {tripStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {tripStatusData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-slate-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </div>
                    <span className="font-semibold text-slate-900">
                      {formatCompact(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 mb-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Top packages by revenue
                  </h2>
                  <p className="text-xs text-slate-500">
                    Performance split across premium treks.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Avg ticket: {formatCurrency(avgTicket)}
                </span>
              </div>
              <div className="mt-6 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={packagePerformance}
                    margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                    barGap={6}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e2e8f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      interval={0}
                      height={40}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "10px",
                        border: "none",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#0ea5e9"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-sm font-semibold text-slate-800">
                Today’s highlights
              </h2>
              <p className="text-xs text-slate-500">
                Quick scan of operational pressure points.
              </p>
              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Peak revenue day</span>
                  <span className="font-semibold text-slate-900">
                    {peakDay.name}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">
                    Avg passengers / booking
                  </span>
                  <span className="font-semibold text-slate-900">
                    {(totals.bookings
                      ? totals.passengers / totals.bookings
                      : 0
                    ).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">Cancellations</span>
                  <span className="font-semibold text-slate-900">
                    {formatCompact(totals.cancellations)}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-slate-500">
                    Projected next 7 days
                  </span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(
                      Math.round((totals.revenue / activeRange.days) * 7)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Recent bookings
                  </h2>
                  <p className="text-xs text-slate-500">
                    Latest activity from the ops desk.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">Live</span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {recentLoading && (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Loading recent bookings...
                  </div>
                )}
                {!recentLoading && recentError && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm text-rose-600">
                    {recentError}
                  </div>
                )}
                {!recentLoading &&
                  !recentError &&
                  recentBookings.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No recent bookings found.
                    </div>
                  )}
                {!recentLoading &&
                  !recentError &&
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {booking.name}
                        </p>
                        <p className="text-xs text-slate-500">{booking.pkg}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            booking.status === "Confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : booking.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : booking.status === "Cancelled"
                              ? "bg-rose-100 text-rose-700"
                              : booking.status === "Verified"
                              ? "bg-sky-100 text-sky-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatCurrency(booking.value)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.timeAgo}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </section>
        </main>
      </RoleProtectedRoute>
    </ProtectedRoute>
  );
};

export default DashboardPage;
