import { Suspense } from "react";
import OnlineBookingClient from "./OnlineBookingClient";
import { buildSeoMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildSeoMetadata({
  title: "Online Booking | Everest Vacation",
  description:
    "Make a secure deposit payment for your trip through Everest Vacation's online booking form.",
  path: "/online-booking",
});

export default function OnlineBookingPage() {
  return (
    <Suspense fallback={null}>
      <OnlineBookingClient />
    </Suspense>
  );
}
