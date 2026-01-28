"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";

import { BASE_URL } from "@/config/Config";
import Head from "next/head";

const page = () => {
  const [tour, setTour] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/category/`);
        setTour(response.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Head>
        <title>Nepal Tours | Everest Vacation</title>
        <meta
          name="description"
          content="Explore Nepal tours and travel categories curated by Everest Vacation."
        />
        <meta
          name="keywords"
          content="Nepal tours, Kathmandu tours, trekking Nepal, Everest Vacation"
        />
        <meta property="og:title" content="Nepal Tours | Everest Vacation" />
        <meta
          property="og:description"
          content="Explore Nepal tours and travel categories curated by Everest Vacation."
        />
        <meta property="og:type" content="website" />
      </Head>
      {tour.map((item) => (
        <div key={item._id || item.id}>{item.name}</div>
      ))}
    </div>
  );
};

export default page;
