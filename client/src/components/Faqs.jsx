"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "When is the best time to visit Nepal and Bhutan?",
    answer:
      "Situated in similar climatic regions, one can visit both countries in the same period as well. Accessible throughout the year, both countries have different experiences to offer throughout the year. However, we suggest the period of spring and autumn to be more of easier and the best travel experience of Nepal and Bhutan. March to May (spring) and September to November (autumn) showcases clear skies and perfect traveling weather in these Himalayan nations.",
  },
  {
    question:
      "What travel documents are needed for traveling in Nepal and Bhutan?",
    answer:
      "Your visa, passport, and permits (if required) are necessary to travel in these countries. Nepal implements VOA (visa on arrival) so you can apply for the documents after landing at the airport easily. However, for Bhutan, you have to apply for a group visa which you must have to enter the country as a part of the tour. Hence, apply beforehand for the Bhutanese visa and keep your passport and permits with you throughout the travel.",
  },
  {
    question: "Can I travel independently in Nepal and Bhutan?",
    answer:
      "Traveling independently is common in Nepal. If you are not heading towards difficult destinations you can roam around solo here without any problem. However, due to severe restrictions with the Bhutanese policy of environmental tourism, you are not allowed to travel individually. i.e., you must have to pre-book a tour with a recognized tour provider and travel with their guide and team throughout the tour. So the answer is ‘Yes’ in Nepal but ‘No’ in Bhutan.",
  },
  {
    question: "How expensive are the Nepal Bhutan tours?",
    answer:
      "The trip cost depends on the duration, hotel category, and activities. Bhutan follows an SDF system while Nepal is comparatively budget-friendlyTravel expense depends usually upon the way you travel. With Nepal and Bhutan, you will get the highest value of your money. Nepal is budget-friendly but you can spend more money if you want to as well. Bhutan might seem much expensive with USD 350 to USD 2000 per night rates. But remember it includes all your expenses on food, accommodation, private transportation, guides, permits and more. Having said that, the only real expense is the souvenirs you can buy while leaving this country.",
  },
  {
    question: "Can I travel between Bhutan and Nepal?",
    answer:
      "Yes, direct flights operate between Kathmandu and Paro, making travel easyNepal is directly connected to Bhutan through a 75 to 90 minutes flight and the tentative flight cost is about USD 480 per person (round trip) and you must request to pre-book all your Bhutan flights. If you want to visit Bhutan first then you can get flights to Paro easily via Delhi, Bangkok, or other routes. You can also reach Bhutan by bus if you fancy that but it might be hectic and unnecessarily long through India..",
  },
  {
    question:
      "What is the condition of food and drinking water in these Himalayan Countries?",
    answer:
      "Well, it might come as a surprise for you but for the most part of your journey, you can select from a large menu of Continental, Chinese, Indian, or other cuisines. If you are here for the traditional Nepalese or Bhutanese cuisine, you are in for a treat. Nepal introduces its own blend inspired by Chinese and Indian cuisine, with delicacies from Newari and Thakali food traditions. Dal Bhat, Thakali Thali, Newari Khaja, Bara, Dhindo, and Momos are some of the popular local foods in Nepal. Bhutan, on the other hand, offers unique dishes with flavors influenced by Chinese cuisine. If you love spicy food, you will enjoy dishes like Ema Datshi, Phaksha Paa, Jasha Maru, Red Rice, and Sura.",
  },

  {
    question: "How about accommodation in Bhutan and Nepal?",
    answer:
      "Nepal provides you a selection like no other countries in Asia for accommodation. You can spend any way from 10$ to 1000$ (USD) per night and get exactly what you paid for here. You can select from guesthouses to Hostels, lodges to star hotels for your stay. For Bhutan, the government has required the visitors to stay in at least 3-star hotels. You can also upgrade to four or five-star hotels costing anywhere between 200$ to 2000$ per night.",
  },
  {
    question: "Where can I extend my vacation after the Nepal Bhutan tour?",
    answer:
      "Popular extensions include Tibet, India, Bangladesh, and Southeast Asian destinationsWell, South Asia is full of unique and touristic areas for your visit after completion of your Bhutan Nepal tour. Tibet, Sri Lanka, Bangladesh, India, Myanmar, Thailand, Cambodia, and Vietnam are our top suggests.",
  },
  {
    question: "How can I visit or book Nepal trips and Nepal tours?",
    answer:
      "You can book through licensed Nepal tour operators or online travel platformsIt is easy and cheap as well to purchase a SIM card in both these countries. You must have a copy of your passport and a few photos for this purpose. After filling a form and submitting documents you can pay the fee which might be around a dollar or two. They will then handle you a short term valid SIM cards for the tour.",
  },
  {
    question: "What if I want to change something in the itinerary?",
    answer:
      "You can customize itineraries in Nepal; Bhutan allows minor adjustments depending on Small changes that don’t affect the overall itinerary are flexible and you can do it discussing with your guide. For big changes like adding a day or destination, it is best to tell us beforehand so our team can customize your itinerary accordingly. We also provide tailor-made tours hence just enlist your destinations and we will make a tour just for you.",
  },
  {
    question:
      "What are the transportation facilities that I can expect for the Tour?",
    answer:
      "Private vehicles, internal flights, and guided transfers are commonly We will provide you with a private vehicle which fits your group size comfortably. Our vehicles are tuned up and regularly maintained for comfort and smoothness. Similarly, our experienced drivers are well knowledgeable about the routes you will take and its latest condition for your assurance.",
  },
  {
    question: "Should I tip my driver/guide/porter?",
    answer: "Tipping is not mandatory but appreciated for good service.",
  },
  {
    question: "Are there enough currency exchange & ATM here?",
    answer:
      "ATMs and currency exchanges are widely available in major cities of Nepal and Bhutan. Tipping is not mandatory but there will be no problem if you want to do so as a way of showing your appreciation.",
  },
  {
    question: "Is it Safe to Travel to Nepal and Bhutan?",
    answer:
      "Yes, both countries are safe for travelers with very low crime rates toward It is best to exchange your currencies into local ones at the airport. The exchange rates might quite fluctuate quite a bit outside here. US dollars are the easiest and cheapest to exchange here. ATMs are available in the major cities and you’ll not have to go far to find one. You can ask your guide to mention the days in the rural areas so you can take enough cash with you. The rates might vary from banks but most will accept your international card anyways.",
  },
];

export default function Faqs() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="font-sans w-full bg-linear-to-b from-white to-gray-50 py-8 sm:py-12 lg:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-teal-700 text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold mb-8 sm:mb-10 lg:mb-12 text-center leading-tight">
          FAQs – Nepal & Bhutan
        </h2>

        <div className="space-y-3 sm:space-y-4 lg:space-y-5">
          {faqs.map((faq, index) => (
            <div
              key={index}
              onClick={() => toggleFaq(index)}
              className="bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer"
            >
              {/* Question */}
              <div className="flex justify-between items-start sm:items-center gap-3 px-4 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5">
                <p className="text-sm sm:text-base lg:text-lg text-gray-900 font-semibold leading-tight flex-1">
                  {faq.question}
                </p>

                <ChevronDown
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-600 transition-transform duration-300 shrink-0 mt-0.5 sm:mt-0`}
                />
              </div>

              {/* Answer */}
              <div
                className={`px-4 sm:px-5 lg:px-6 overflow-hidden transition-all duration-500 ${
                  openIndex === index
                    ? "max-h-[600px] sm:max-h-[700px] py-3 sm:py-4 opacity-100"
                    : "max-h-0 py-0 opacity-0"
                }`}
              >
                <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed lg:leading-loose">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
