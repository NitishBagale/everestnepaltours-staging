"use client";
import React, { useState } from "react";

// Mock data that simulates the content for each section
const travelData = {
  FLIGHT_SCHEDULE: {
    title: "New Flight Schedule from Kathmandu to Bhutan(Paro)",
    content: (
      <div className="font-sans">
        <div className="flex flex-col mb-4">
          <p className="mt-4"> Updated: 28 August, 2025</p>
          <p
            className="mt-4"
            style={{
              color: "#5a8b5a",
              fontSize: "1.8rem",
              fontWeight: "normal",
            }}
          >
            Flight schedule from Druk Air:
          </p>
        </div>
        <h2
          className="font-bold mb-2"
          style={{ fontSize: "1.8rem", fontWeight: "normal" }}
        >
          Possible flight routes for Nepal and Bhutan combined tour
        </h2>
        <ul>
          <li>
            Kathmandu, Nepal (KTM) to Paro, Bhutan (PBH) – Weekly 5–7 flights
            (daily flights)
          </li>
          <li>
            Bangkok, Thailand (BKK) to Paro, Bhutan (PBH) – Weekly 6–7 flights
            (daily flights)
          </li>
          <li>
            New Delhi, India (DEL) to Paro, Bhutan (PBH) – Weekly 5–7 flights
            (daily flights)
          </li>
          <li>
            Kolkata/Calcutta (CCU) to Paro, Bhutan (PBH) – Weekly 3 flights
          </li>
          <li>Gaya, India (GAY) to Paro, Bhutan (PBH) – Weekly 0–3 flights</li>
          <li>
            Bagdogra, India (IXB) to Paro, Bhutan (PBH) – Weekly 2/2 flights
          </li>
          <li>
            Guwahati, India (GAU) to Paro, Bhutan (PBH) – Weekly 2–3 flights
          </li>
          <li>
            Dhaka, Bangladesh (DAC) to Paro, Bhutan (PBH) – Weekly 2–3 flights
          </li>
          <li>Singapore (SIN) to Paro, Bhutan (PBH) – Weekly 2 flights</li>
          <li>Dubai, UAE (DXB) to Paro, Bhutan (PBH) – Weekly 2 flights</li>
          <li>
            Mumbai, India (BOM) to Paro, Bhutan (PBH) – flight starting soon
          </li>
          <li>
            Bengaluru (Bangalore), India (BLR) to Paro, Bhutan (PBH) – flight
            starting soon
          </li>
          <li>
            Kuala Lumpur, Malaysia (KUL) to Paro, Bhutan (PBH) – flight starting
            soon
          </li>
          <li>
            Penang, Malaysia (PEN) to Paro, Bhutan (PBH) – flight starting soon
          </li>
          <li>
            Ho Chi Minh, Vietnam (SGN) to Paro, Bhutan (PBH) – flight starting
            soon
          </li>
          <li>
            Yangon, Myanmar (RGN) to Paro, Bhutan (PBH) – flight starting soon
          </li>
        </ul>
      </div>
    ),
  },
  NEPAL_DESTINATIONS: {
    title: "Choose Your Ideal Destination in Nepal",
    content: (
      <p>
        Discover the top-recommended places in Nepal by fellow travelers. From
        the bustling streets of Kathmandu to the serene peaks of the Annapurnas,
        find your perfect adventure.
      </p>
    ),
  },
  BHUTAN_DESTINATIONS: {
    title: "Choose Your Ideal Destination in Bhutan",
    content: (
      <p>
        Explore the most recommended trips in Bhutan. Experience the unique
        culture of the Land of the Thunder Dragon, from the Tiger's Nest
        Monastery to the vibrant festivals of Thimphu.
      </p>
    ),
  },
  FESTIVAL_TOUR: {
    title: "Festival Tour Nepal and Bhutan",
    content: (
      <p>
        Immerse yourself in the vibrant cultures of Nepal and Bhutan by planning
        your trip around one of their famous festivals. Details on festival
        dates and special tour packages are available here.
      </p>
    ),
  },
  INSIDE_VIEW: {
    title: "Inside view of Nepal and Bhutan for Travelers",
    content: (
      <div>
        <p style={{ lineHeight: "1.6" }}>
          Knowing what you can expect from any destination is important for
          travelers. With some Dos and Don'ts, you can decide better on the
          packages and period of your visit here. Here we will take you on a
          core tour of Bhutan and Nepal from a traveler's perspective.
        </p>
        <ul style={{ listStyle: "none", paddingLeft: "0", lineHeight: "1.8" }}>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            Hospitality in these countries is second to none but be sure to
            enjoy responsibly during your visit. Religious nations with some
            traditional beliefs try minimizing the display of affection (kissing
            and more) to private.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            Most places might be open for tourists, some might need
            permits/passes, and some might even be restricted for visitors. As a
            traveler, it is always best to know about these beforehand.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            While the highways are particularly comfortable prepare for some
            bumpy stretches in the hilly destinations. Keep in mind that the
            drivers here are amazingly skilled and experienced so loosen up a
            bit.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            Assure your visas on time. It is best to have them at least a few
            days earlier than in a tight schedule. Bhutan in particular might be
            somewhat strict in paperwork. So be sure and double-check
            everything.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            You will have a large selection to choose from when it comes to food
            accommodation and transportation. Choose wisely as you will get what
            you paid for here.
          </li>
          <li style={{ marginBottom: "1rem" }}>
            <span style={{ color: "#5a8b5a", marginRight: "0.5rem" }}>
              &gt;
            </span>
            Always choose a local guide to miss nothing. Both Nepal and Bhutan
            have some of the best-hidden destinations and a local guide will be
            worth your price for the best experiences.
          </li>
        </ul>
        <a
          href="#"
          style={{
            color: "#5a8b5a",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Which is best Nepal or Bhutan?
        </a>
      </div>
    ),
  },
};

// Array of the keys to maintain order
const topics = [
  {
    key: "FLIGHT_SCHEDULE",
    label: "NEW FLIGHT SCHEDULE FROM KATHMANDU TO BHUTAN (PARO)",
  },
  {
    key: "NEPAL_DESTINATIONS",
    label:
      "CHOOSE YOUR IDEAL DESTINATION IN NEPAL FROM THE TOP-RECOMMENDED PLACES BY TRAVELERS",
  },
  {
    key: "BHUTAN_DESTINATIONS",
    label:
      "CHOOSE YOUR IDEAL DESTINATION IN BHUTAN FROM THE TOP-RECOMMENDED TRIP BY TRAVELERS",
  },
  { key: "FESTIVAL_TOUR", label: "FESTIVAL TOUR NEPAL AND BHUTAN" },
  {
    key: "INSIDE_VIEW",
    label: "INSIDE VIEW OF NEPAL AND BHUTAN FOR TRAVELERS",
  },
];

const Travelguide = () => {
  // Set the default active topic to 'INSIDE_VIEW' to match the image
  const [activeTopic, setActiveTopic] = useState("INSIDE_VIEW");
  const activeContent = travelData[activeTopic];

  return (
    <div className="w-full bg-white px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 border border-gray-200 rounded-lg overflow-hidden">
          {/* Left Navigation - Responsive */}
          <nav className="md:col-span-1 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-4 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              {topics.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTopic(key)}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg text-xs sm:text-sm font-bold leading-tight transition-all duration-200 ${
                    activeTopic === key
                      ? "bg-[#35a576] text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-[#35a576] hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Right Content - Responsive */}
          <main className="md:col-span-2 lg:col-span-3 p-4 sm:p-6 lg:p-8">
            <h2 className="text-[#35a576] text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal mb-4 sm:mb-6 leading-tight">
              {activeContent.title}
            </h2>
            <div className="prose prose-sm sm:prose md:prose-lg lg:prose-xl max-w-none text-gray-700 text-sm sm:text-base md:text-lg leading-relaxed space-y-4">
              {activeContent.content}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Travelguide;
