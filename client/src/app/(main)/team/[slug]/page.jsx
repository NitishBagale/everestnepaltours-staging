import React from "react";
import { notFound } from "next/navigation";
import { BASE_URL } from "@/config/Config";
import { buildSeoMetadata } from "@/lib/seo";

const DEFAULT_TITLE = "Team Member";
const DEFAULT_DESCRIPTION =
  "Meet our team member and learn about their experience.";
const DEFAULT_KEYWORDS = "team, travel, guides, everest holidays";
const DEFAULT_IMAGE = "";

const stripHtml = (value) =>
  typeof value === "string"
    ? value.replace(/<[^>]+>/g, "").replace(/&nbsp;|&#160;/gi, " ").trim()
    : "";

const fetchTeamMemberBySlug = async (slug) => {
  const response = await fetch(`${BASE_URL}/team/`, { cache: "no-store" });
  if (!response.ok) return null;
  const payload = await response.json();
  const members = payload?.teams || payload?.data || payload || [];
  const memberName = decodeURIComponent(slug || "");
  return Array.isArray(members)
    ? members.find((member) => member?.name === memberName) || null
    : null;
};

export const generateMetadata = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slug = resolvedParams?.slug ?? "";
  const member = await fetchTeamMemberBySlug(slug);

  if (!member) {
    return buildSeoMetadata({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: DEFAULT_KEYWORDS,
      path: `/team/${slug}`,
      image: DEFAULT_IMAGE,
      type: "profile",
    });
  }

  const title = member.meta_title || `${member.name} | Team Member`;
  const description =
    member.meta_description ||
    stripHtml(member.description).slice(0, 160) ||
    DEFAULT_DESCRIPTION;
  const keywords = member.meta_keywords || DEFAULT_KEYWORDS;
  const image = member.imageUrl || DEFAULT_IMAGE;

  return buildSeoMetadata({
    title,
    description,
    keywords,
    path: `/team/${slug}`,
    image,
    type: "profile",
  });
};

const TeamMemberDetailPage = async ({ params } = {}) => {
  const resolvedParams = params ? await params : {};
  const slug = resolvedParams?.slug ?? "";
  const memberData = await fetchTeamMemberBySlug(slug);

  if (!memberData || !memberData.has_detail_page || !stripHtml(memberData.description)) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="grow">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 py-8 font-sans text-gray-700">
          <div className="mb-10">
            <span className="text-lime-600 font-medium text-base uppercase tracking-wide">
              BIOGRAPHY OF
            </span>
            <h1
              className="d-color mb-4 wow fadeInUp"
              style={{ fontSize: "calc(1.375rem + 1.5vw)", fontWeight: 600 }}
            >
              {memberData.name}
            </h1>
            {memberData.designation && (
              <p className="text-base text-gray-500">{memberData.designation}</p>
            )}
          </div>

          <section className="grid grid-cols-1 gap-8 items-start lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <div
                className="prose prose-base md:prose-lg max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: memberData.description || "No description available.",
                }}
              />
            </div>
            <div className="w-full">
              <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                <img
                  src={memberData.imageUrl || "/placeholder-team.jpg"}
                  alt={memberData.name}
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="border-l-4 border-green-600 pl-4 py-2 mt-4">
                <p className="text-gray-700 font-medium">
                  {memberData.name}
                  {memberData.designation ? ` | ${memberData.designation}` : ""}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TeamMemberDetailPage;
