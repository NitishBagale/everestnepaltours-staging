import {
  Medal,
  HandCoins,
  UserCheck,
  Users,
  Map,
  CalendarDays,
} from "lucide-react";

const iconMap = {
  Medal,
  HandCoins,
  UserCheck,
  Users,
  Map,
  CalendarDays,
};

const formatTitleLines = (title = "") => {
  const cleaned = String(title).trim();
  if (!cleaned) return [];

  const normalized = cleaned.replace(/\s+/g, " ").toLowerCase();
  if (normalized === "what makes us your preferred choice?") {
    return ["What", "makes us", "your", "preferred", "choice?"];
  }

  const existingLines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (existingLines.length > 1) return existingLines;

  return cleaned.split(/\s+/);
};

const WhyWithUsSection = ({
  data = {
    title: "",
    description: "",
    items: [],
  },
}) => {

  if (!data.title && !data.description && !data.items?.length) return null;

  const lines = formatTitleLines(data.title);

  return (
    <section className="bg-[#35a576] text-white">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 sm:gap-10 lg:gap-12 items-center">
          <div className="flex justify-center lg:justify-end">
            {lines.length > 0 && (
              <h3
                className="max-w-[220px] text-right text-[40px] font-[200] leading-[1.15] text-white sm:max-w-[240px] lg:max-w-[250px]"
                style={{ fontFamily: '"MuseoModerno", sans-serif' }}
              >
                {lines.map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </h3>
            )}
            {data.description && (
              <p className="mt-4 text-lg text-white">
                {data.description}
              </p>
            )}
          </div>

          {data.items?.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {data.items.map((item, index) => {
                const Icon = iconMap[item.icon] || Medal;
                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/45 bg-white/14 px-4 sm:px-5 py-3 sm:py-4"
                    style={{ fontFamily: "var(--font-museo)" }}
                  >
                    <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-white/18">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </span>
                    <span className="text-lg font-semibold text-white">
                      {item.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WhyWithUsSection;
