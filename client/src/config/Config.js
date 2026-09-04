const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CONTENT_BASE_URL =
  process.env.NEXT_PUBLIC_CONTENT_API_URL || BASE_URL;

export { BASE_URL, CONTENT_BASE_URL };
