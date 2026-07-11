"use client";

import React, { useMemo, useState } from "react";
import axios from "axios";
import { BASE_URL } from "@/config/Config";

const destinationOptions = [
  "Nepal",
  "Bhutan",
  "Tibet/China",
  "India",
  "Sri Lanka",
  "Myanmar",
  "Bangladesh",
  "Laos",
  "Cambodia",
  "Vietnam",
  "Thailand",
];

const hotelOptions = [
  "Select Hotel Category",
  "3 Star",
  "4 Star",
  "5 Star",
  "Boutique Hotel",
  "Luxury / High-end",
];

const passportCountries = [
  "Select Country of Passport Issued",
  "Australia",
  "Bangladesh",
  "Bhutan",
  "Canada",
  "China",
  "France",
  "Germany",
  "India",
  "Italy",
  "Japan",
  "Malaysia",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Singapore",
  "South Korea",
  "Spain",
  "Sri Lanka",
  "Switzerland",
  "Thailand",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam",
  "Other",
];

const initialFormData = {
  travelerType: "",
  travelDateType: "",
  destinations: [],
  tripDuration: "",
  hotelCategory: "",
  budgetRange: "",
  fullName: "",
  email: "",
  phone: "",
  passportCountry: "",
  customizeDetails: "",
};

const CustomizeTripClient = ({ tripName = "", tripSlug = "" }) => {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const introText = useMemo(() => {
    if (!tripName) {
      return "We will connect you with our expert-team specializing in your tour after receiving the description below. Try being clear and up to point with your requirements and we will redirect you soon.";
    }

    return `We will connect you with our expert-team specializing in ${tripName} after receiving the description below. Try being clear and up to point with your requirements and we will redirect you soon.`;
  }, [tripName]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback.message) {
      setFeedback({ type: "", message: "" });
    }
  };

  const handleDestinationToggle = (destination) => {
    setFormData((prev) => {
      const exists = prev.destinations.includes(destination);
      return {
        ...prev,
        destinations: exists
          ? prev.destinations.filter((item) => item !== destination)
          : [...prev.destinations, destination],
      };
    });

    if (feedback.message) {
      setFeedback({ type: "", message: "" });
    }
  };

  const validateForm = () => {
    if (!formData.travelerType) return "Please select how you will be traveling.";
    if (!formData.travelDateType) return "Please select when you will be traveling.";
    if (!formData.destinations.length) return "Please select at least one destination.";
    if (!formData.tripDuration.trim()) return "Please enter estimated trip duration.";
    if (!formData.hotelCategory) return "Please select hotel category.";
    if (!formData.budgetRange.trim()) return "Please enter your budget range.";
    if (!formData.fullName.trim()) return "Please enter your full name.";
    if (!formData.email.trim()) return "Please enter your email address.";
    if (!formData.phone.trim()) return "Please enter your cell phone number.";
    if (!formData.passportCountry) return "Please select country of passport issued.";
    if (formData.customizeDetails.trim().length < 20) {
      return "Please enter more customize details.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFeedback({ type: "error", message: validationError });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: "", message: "" });

    try {
      await axios.post(`${BASE_URL}/customize-trip`, {
        tripName,
        tripSlug,
        travelerType: formData.travelerType,
        travelDateType: formData.travelDateType,
        destinations: formData.destinations,
        tripDuration: formData.tripDuration,
        hotelCategory: formData.hotelCategory,
        budgetRange: formData.budgetRange,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        passportCountry: formData.passportCountry,
        customizeDetails: formData.customizeDetails,
      });

      setFormData(initialFormData);
      setFeedback({
        type: "success",
        message: "Thank you. Your customize trip request has been sent successfully.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error.response?.data?.message ||
          "Failed to send your customize trip request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white text-slate-800">
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(7, 10, 12, 0.68), rgba(7, 10, 12, 0.68)), url('/lhasa.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-screen-2xl px-6 py-20 md:px-10 md:py-24 lg:px-14">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">
              Trip Customize Form
            </h1>
            <div className="mt-8 flex items-center gap-3">
              <span className="inline-block h-4 w-4 rounded-full bg-white" />
              <span className="inline-block h-px w-40 bg-white/80" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-screen-2xl px-6 py-14 md:px-10 lg:px-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.25fr] lg:gap-16">
          <div className="pt-2 lg:sticky lg:top-28 lg:self-start">
            <div className="max-h-[20rem] overflow-y-auto pr-3 md:max-h-[26rem]">
              <p className="text-lg leading-9 text-slate-700 md:text-[1.9rem]">
              {introText}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <h2 className="text-3xl font-medium leading-tight text-[#45a996] md:text-5xl">
                1. How will you be Traveling?
              </h2>
              <p className="mt-5 text-base text-slate-700 md:text-lg">
                Please select one <span className="text-red-500">(*)</span>
              </p>
              <div className="mt-6 space-y-4">
                {["Couple", "Solo Traveler", "Family", "Group"].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 text-xl text-slate-700 md:text-2xl"
                  >
                    <input
                      type="radio"
                      name="travelerType"
                      value={option}
                      checked={formData.travelerType === option}
                      onChange={handleChange}
                      className="h-5 w-5 accent-[#45a996]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-medium leading-tight text-[#45a996] md:text-5xl">
                2. When will you be traveling?
              </h2>
              <p className="mt-5 text-base text-slate-700 md:text-lg">
                Please select one <span className="text-red-500">(*)</span>
              </p>
              <div className="mt-6 space-y-4">
                {[
                  "I have my exact travel dates",
                  "I have approximate dates",
                  "I don't have my dates yet.",
                ].map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 text-xl text-slate-700 md:text-2xl"
                  >
                    <input
                      type="radio"
                      name="travelDateType"
                      value={option}
                      checked={formData.travelDateType === option}
                      onChange={handleChange}
                      className="h-5 w-5 accent-[#45a996]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-medium leading-tight text-[#45a996] md:text-5xl">
                3. Trip Details
              </h2>
              <p className="mt-5 text-base text-slate-700 md:text-lg">
                Please select interested destination(s){" "}
                <span className="text-red-500">(*)</span>
              </p>
              <div className="mt-6 grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-4">
                {destinationOptions.map((destination) => (
                  <label
                    key={destination}
                    className="flex items-center gap-3 text-lg text-slate-700 md:text-xl"
                  >
                    <input
                      type="checkbox"
                      checked={formData.destinations.includes(destination)}
                      onChange={() => handleDestinationToggle(destination)}
                      className="h-5 w-5 rounded border-slate-300 accent-[#45a996]"
                    />
                    <span>{destination}</span>
                  </label>
                ))}
              </div>

              <div className="mt-10 grid gap-6 md:grid-cols-2">
                <div>
                  <input
                    type="text"
                    name="tripDuration"
                    value={formData.tripDuration}
                    onChange={handleChange}
                    placeholder="Estimate trip duration"
                    className="w-full border border-slate-300 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <select
                    name="hotelCategory"
                    value={formData.hotelCategory}
                    onChange={handleChange}
                    className="w-full border border-slate-300 bg-white px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                  >
                    {hotelOptions.map((option, index) => (
                      <option key={option} value={index === 0 ? "" : option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <span className="text-xl text-red-500">*</span>
                </div>
                <div>
                  <input
                    type="text"
                    name="budgetRange"
                    value={formData.budgetRange}
                    onChange={handleChange}
                    placeholder="Budget Range"
                    className="w-full border border-slate-300 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-medium leading-tight text-[#45a996] md:text-5xl">
                4. Contact Details!
              </h2>

              <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.18fr]">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Full Name"
                      className="w-full border border-slate-300 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                    />
                    <span className="text-xl text-red-500">*</span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-full">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="w-full border border-slate-300 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                      />
                      <p className="mt-2 text-sm text-slate-500 md:text-base">
                        We&apos;ll never share your email with anyone else.
                      </p>
                    </div>
                    <span className="pt-3 text-xl text-red-500">*</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Cell Phone (include country code)"
                      className="w-full border border-slate-300 px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                    />
                    <span className="text-xl text-red-500">*</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      name="passportCountry"
                      value={formData.passportCountry}
                      onChange={handleChange}
                      className="w-full border border-slate-300 bg-white px-5 py-4 text-lg text-slate-700 outline-none transition focus:border-[#45a996]"
                    >
                      {passportCountries.map((option, index) => (
                        <option key={option} value={index === 0 ? "" : option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <span className="text-xl text-red-500">*</span>
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-lg font-medium text-slate-700 md:text-xl">
                    Customize details
                  </label>
                  <textarea
                    name="customizeDetails"
                    value={formData.customizeDetails}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Any specific destinations or interests (e.g. culture, historical, lifestyle, food, wildlife etc.)? Special occasion/festival? What would make this your dream trip?"
                    className="w-full resize-none border border-slate-300 px-5 py-4 text-lg leading-relaxed text-slate-700 outline-none transition focus:border-[#45a996]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-8 inline-flex min-w-[14rem] items-center justify-center bg-[#45a996] px-7 py-4 text-base font-medium uppercase tracking-[0.04em] text-white transition hover:bg-[#378d7d] disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </div>
            </section>

            {feedback.message && (
              <div
                className={`rounded border px-5 py-4 text-lg md:text-xl ${
                  feedback.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {feedback.message}
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default CustomizeTripClient;
