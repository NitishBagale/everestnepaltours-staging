import HblResponseClient from "../HblResponseClient";
import { buildSeoMetadata } from "@/lib/seo";

export const metadata = buildSeoMetadata({
  title: "HBL Payment Response | Everest Vacation",
  description: "Booking payment response for Everest Vacation online booking.",
  path: "/online-booking/hbl-response",
});

export default async function HblResponsePage({ searchParams }) {
  const params = await searchParams;

  return (
    <HblResponseClient
      bookingRef={params?.bookingRef || ""}
      payment={params?.payment || "failed"}
      amount={params?.amount || ""}
    />
  );
}
