const WelcomeSection = ({
  welcome = {
    subtitle: "",
    title: "",
    description: "",
  },
}) => {

  if (!welcome.subtitle && !welcome.title && !welcome.description) return null;

  return (
    <section className="bg-white">
      <div className="max-w-screen-2xl mx-auto px-6 sm:px-8 lg:px-12 py-12 sm:py-14 lg:py-16">
        {welcome.subtitle && (
          <p
            className="text-[#547a36] text-2xl font-medium"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {welcome.subtitle}
          </p>
        )}
        {welcome.title && (
          <h2
            className="mt-2 text-4xl font-bold text-gray-800"
            style={{ fontFamily: "var(--font-museo)" }}
          >
            {welcome.title}
          </h2>
        )}
        {welcome.description && (
          <div
            className="mt-4 text-lg text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: welcome.description }}
          />
        )}
      </div>
    </section>
  );
};

export default WelcomeSection;
