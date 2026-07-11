"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { BASE_URL } from "@/config/Config";
import { requestHblPaymentPage } from "@/lib/hblGateway";

const makeCaptcha = () => {
  const first = Math.floor(Math.random() * 15) + 1;
  const second = Math.floor(Math.random() * 15) + 1;
  return { first, second };
};

const initialCaptcha = { first: 4, second: 7 };

const initialFormState = {
  fullName: "",
  email: "",
  country: "",
  totalPax: 1,
  tripName: "",
  tripDate: "",
  depositAmount: "",
  message: "",
  termsAccepted: false,
  captchaResult: "",
};

const BANK_SERVICE_CHARGE_RATE = 0.04;

export default function OnlineBookingClient() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(initialFormState);
  const [captcha, setCaptcha] = useState(initialCaptcha);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const queryFeedback = useMemo(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      return {
        type: "success",
        message: success,
      };
    }
    if (error) {
      return {
        type: "error",
        message: error,
      };
    }
    return null;
  }, [searchParams]);

  const parsedDepositAmount = Number(formData.depositAmount || 0);
  const hasValidDepositAmount =
    Number.isFinite(parsedDepositAmount) && parsedDepositAmount > 0;
  const bankServiceCharge = hasValidDepositAmount
    ? parsedDepositAmount * BANK_SERVICE_CHARGE_RATE
    : 0;
  const totalPayableAmount = hasValidDepositAmount
    ? parsedDepositAmount + bankServiceCharge
    : 0;

  React.useEffect(() => {
    setCaptcha(makeCaptcha());
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setCaptcha(makeCaptcha());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", message: "" });

    const expectedCaptcha = captcha.first + captcha.second;
    if (Number(formData.captchaResult) !== expectedCaptcha) {
      setFeedback({
        type: "error",
        message: "Captcha answer is incorrect. Please solve it again.",
      });
      setCaptcha(makeCaptcha());
      setFormData((prev) => ({ ...prev, captchaResult: "" }));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${BASE_URL}/online-booking`, {
        fullName: formData.fullName,
        email: formData.email,
        country: formData.country,
        totalPax: formData.totalPax,
        tripName: formData.tripName,
        tripDate: formData.tripDate,
        depositAmount: formData.depositAmount,
        message: formData.message,
        termsAccepted: formData.termsAccepted,
      });

      const bookingRef = response?.data?.data?.bookingRef;
      if (!bookingRef) {
        throw new Error("Booking reference was not created.");
      }

      const paymentPageURL = await requestHblPaymentPage({
        amount: totalPayableAmount.toFixed(2),
        bookingRef,
      });

      resetForm();
      window.location.assign(paymentPageURL);
      return;
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create booking. Please try again.",
      });
      setCaptcha(makeCaptcha());
      setFormData((prev) => ({ ...prev, captchaResult: "" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleFeedback = feedback.message ? feedback : queryFeedback;

  return (
    <div className="bg-[#f7fbf8]">
      <section className="relative overflow-hidden border-b border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(53,165,118,0.18),_transparent_35%),linear-gradient(135deg,_#fcfffd,_#eef8f1)]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex rounded-full border border-emerald-200 bg-white/80 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Secure HBL Checkout
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Online Booking
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-600">
              Confirm your trip deposit with the same booking fields used on the
              Everest Nepal Tours payment page, now wired into this site’s HBL
              flow.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_70px_-45px_rgba(13,63,37,0.45)] md:p-8">
            {visibleFeedback?.message ? (
              <div
                className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
                  visibleFeedback.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {visibleFeedback.message}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="country" value={formData.country} />
              <input type="hidden" name="totalPax" value={formData.totalPax} />

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Trip Name"
                  name="tripName"
                  value={formData.tripName}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Trip Date"
                  type="date"
                  name="tripDate"
                  value={formData.tripDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <Field
                label="Deposit Amount"
                type="number"
                min="1"
                step="0.01"
                name="depositAmount"
                value={formData.depositAmount}
                onChange={handleChange}
                placeholder="Eg: 100"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Write your message here"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500"
                  required
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 accent-emerald-600"
                  required
                />
                <span>
                  I accept terms and conditions.{" "}
                  <a
                    href="https://everestnepaltours.com/about-us/payment-cancellation-policy/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 underline underline-offset-4"
                  >
                    View payment cancellation policy
                  </a>
                </span>
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  {captcha.first} + {captcha.second} ={" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    name="captchaResult"
                    value={formData.captchaResult}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500 sm:max-w-[220px]"
                    required
                  />
                  <p className="text-sm text-slate-600">
                    Please solve this simple equation before continuing to HBL.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  <p className="font-semibold">
                    A 4% bank service charge will be added to the online payment.
                  </p>
                  {hasValidDepositAmount ? (
                    <p className="mt-2 text-slate-700">
                      Deposit Amount: <span className="font-semibold">${parsedDepositAmount.toFixed(2)}</span>
                      {" · "}
                      Bank Service Charge: <span className="font-semibold">${bankServiceCharge.toFixed(2)}</span>
                      {" · "}
                      Total Payable: <span className="font-semibold">${totalPayableAmount.toFixed(2)}</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-slate-700">
                      Enter the deposit amount above to see the final payable total.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Preparing Payment..." : "Confirm Payment"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-7 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-emerald-100 bg-white p-6 shadow-[0_20px_70px_-45px_rgba(13,63,37,0.45)]">
              <h2 className="text-xl font-bold text-slate-900">
                Before You Pay
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li>Use the trip name exactly as discussed with the sales team.</li>
                <li>Deposit amount should match the agreed advance payment.</li>
                <li>After submission, you will be redirected to HBL’s secure page.</li>
                <li>Keep the success page open until booking confirmation finishes.</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_70px_-45px_rgba(13,63,37,0.7)]">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Need Help?
              </p>
              <p className="mt-4 text-lg font-semibold">
                Contact the booking team before making payment if your itinerary
                or deposit needs review.
              </p>
              <div className="mt-5 space-y-2 text-sm text-slate-300">
                <p>Email: info@everestvacations.com</p>
                <p>Phone: +977-9851053024</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = false,
  ...rest
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 outline-none transition focus:border-emerald-500"
        {...rest}
      />
    </div>
  );
}
