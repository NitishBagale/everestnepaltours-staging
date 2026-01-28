import ContactFormClient from "./ContactFormClient";

export const metadata = {
  title: "Contact Us | Everest Vacation",
  description:
    "Get in touch with Everest Vacation for tour inquiries, custom itineraries, and travel support.",
  keywords:
    "contact Everest Vacation, travel inquiry, Nepal tour support, Bhutan travel help",
  openGraph: {
    title: "Contact Us | Everest Vacation",
    description:
      "Get in touch with Everest Vacation for tour inquiries, custom itineraries, and travel support.",
    type: "website",
  },
};

const ContactPage = async () => {
  return <ContactFormClient />;
};

export default ContactPage;
