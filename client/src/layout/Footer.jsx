import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  const supportLinks = [
    { href: "/about-us", label: "About Us" },
    { href: "/meet-the-owner", label: "Meet the Owner" },
    { href: "/book-with-confidence", label: "Book with Confidence" },
    {
      href: "/payment-cancellation-policy",
      label: "Payment & Cancellation Policy",
    },
    { href: "/reviews", label: "Reviews" },
    { href: "/travel-blog", label: "Travel Blog" },
    { href: "/travel-information", label: "Travel Information" },
    { href: "/contact-form", label: "Contact Form" },
  ];

  return (
    <>
      <footer className="bg-[#1f6a4a] text-white px-4 py-8 sm:px-6 sm:py-10 md:px-8 md:py-12 lg:px-12 relative">
        <div className="container mx-auto">
          {/* Main content grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 text-base">
            {/* Column 1: Nepal Office */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="font-bold text-xl mb-2 sm:mb-3">
                NEPAL OFFICE:
              </h3>
              <p>Everest Vacation Private Limited</p>
              <p>P.O.Box: 23573, Kathmandu Valley, Nepal</p>
              <p>+977-9851053024, 9818537025</p>
              <a
                href="mailto:info@everestvacations.com"
                className="hover:underline"
              >
                info@everestvacations.com
              </a>

              <div className="pt-3 sm:pt-4">
                <p>+977-9851053024</p>
                <p className="text-base">
                  (Whatsapp/Viber/Wechat)
                </p>
                <a
                  href="https://www.everestnepaltours.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline block"
                >
                  www.everestnepaltours.com
                </a>
                <a
                  href="https://www.asiaexperiences.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline block"
                >
                  www.asiaexperiences.com
                </a>
              </div>
            </div>

            {/* Column 2: Bhutan & Tibet */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="font-bold text-xl mb-2 sm:mb-3">
                  BHUTAN ADDRESS:
                </h3>
                <p>
                  Gida Lam (Rd)16, Pink Cottage Building # 15A, Chang Gedaphu,
                  Thimphu
                </p>
                <a
                  href="mailto:bhutan@everestvacations.com"
                  className="hover:underline"
                >
                  bhutan@everestvacations.com
                </a>
              </div>

              <hr className="my-4 sm:my-6 border-gray-200 opacity-30" />

              <div>
                <h3 className="font-bold text-xl mb-2 sm:mb-3">
                  TIBET ADDRESS:
                </h3>
                <p>No. 52 West Dang Re Road, Lhasa, Tibet, China</p>
                <a
                  href="mailto:tibet@everestvacations.com"
                  className="hover:underline"
                >
                  tibet@everestvacations.com
                </a>
              </div>
            </div>

            {/* Column 3: Company & Support */}
            <div>
              <h3 className="font-bold text-xl mb-2 sm:mb-3">
                COMPANY & SUPPORT
              </h3>
              <ul className="space-y-2">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="hover:underline flex items-center"
                    >
                      <span className="mr-2">&bull;</span> {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Bottom Section */}
          <hr className="my-6 sm:my-8 border-gray-200 opacity-30" />
          <div className="flex flex-col gap-4 sm:gap-6 justify-between items-center text-center sm:text-left text-base">
            <p className="w-full">
              © 2025, www.everestnepaltours.com, A product of Everest Vacation
              Pvt. Ltd. All rights reserved.
            </p>
            <div className="w-full flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
              <p className="whitespace-nowrap">
                We accept card payment and bank transfer.
              </p>
              {/* NOTE: Replace with your actual image paths */}
              <div className="flex items-center gap-2 border rounded p-2 bg-white">
                <Image
                  src="/Americanexpress.jpeg"
                  alt="American Express"
                  width={25}
                  height={16}
                  className="h-auto"
                />
                <Image
                  src="/Visadebit.png"
                  alt="Visa Debit"
                  width={25}
                  height={16}
                  className="h-auto"
                />
                <Image
                  src="/Mastercard.jpg"
                  alt="Mastercard"
                  width={25}
                  height={16}
                  className="h-auto"
                />
                <Image
                  src="/UnionPay.png"
                  alt="UnionPay"
                  width={25}
                  height={16}
                  className="h-auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating "Scroll to Top" Button */}
        <a
          href="#top"
          className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 bg-[#51792f] hover:bg-[#456826] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors z-40"
          aria-label="Scroll to top"
        >
          <span aria-hidden="true" className="text-[20px] leading-none">↑</span>
        </a>
      </footer>

      {/* Chat Widget and Trigger */}

      <a
        href="https://wa.me/9779851053024"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-0 left-4 sm:left-8 bg-[#51792f] hover:bg-[#456826] text-white py-3 px-5 rounded-t-lg shadow-lg transition-colors text-base whitespace-nowrap z-40 min-h-11"
        aria-label="Chat with us on WhatsApp"
      >
        Chat with us
      </a>
    </>
  );
};

export default Footer;
