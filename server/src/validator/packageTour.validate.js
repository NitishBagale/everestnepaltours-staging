const Joi = require("joi");

const PackageTour = Joi.object({
  package: Joi.object({
    id: Joi.number().integer(),
    title: Joi.string().min(5).max(100).required(),
    descriptions: Joi.string().min(100).required(),
    duration: Joi.string().min(1).max(50).required(),
    tour_type: Joi.string().min(3).max(50).required(),
    rating: Joi.string().min(3).max(50).required(),
    categoryId: Joi.number().integer().required(),
    mainImage: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.object({
        mediaId: Joi.string().required(),
        url: Joi.string().uri().required(),
        variants: Joi.object().optional(),
        title: Joi.string().max(200).optional(),
        altText: Joi.string().max(200).optional(),
      })
    ).required(),
    review: Joi.array()
      .items({
        id: Joi.number().integer(),
        guestName: Joi.string().min(3).max(100).required(),
        country: Joi.string().min(2).max(100).required(),
        travelDate: Joi.date().required(),
        tourTitle: Joi.string().min(5).required(),
        title: Joi.string().min(5).max(200).required(),
        reviewText: Joi.string().min(10).required(),
        rating: Joi.number().min(1).max(5).required(),
      })
      .optional(),
    itinerary: Joi.array().items(
      Joi.object({
        day: Joi.number().integer().min(1).optional(),
        title: Joi.string().min(5).max(100).optional(),
        activities: Joi.array()
          .items(
            Joi.alternatives().try(
              Joi.string().min(1).max(500),
              Joi.object().unknown(true)
            )
          )
          .min(1)
          .required(),
        richText: Joi.string().min(20).optional(),
        image: Joi.alternatives().try(
          Joi.string().uri(),
          Joi.object({
            mediaId: Joi.string().required(),
            url: Joi.string().uri().required(),
            variants: Joi.object().optional(),
            title: Joi.string().max(200).optional(),
            altText: Joi.string().max(200).optional(),
          })
        ).optional(),
        order: Joi.number().integer().min(1).optional(),
        id: Joi.string().optional(),
      })
    ),
    imageGallary: Joi.array().items(
      Joi.alternatives().try(
        Joi.string().uri(),
        Joi.object({
          mediaId: Joi.string().optional(),
          url: Joi.string().uri().required(),
          variants: Joi.object().optional(),
          title: Joi.string().max(200).optional(),
          altText: Joi.string().max(200).optional(),
          order: Joi.number().integer().min(0).optional(),
        })
      )
    ),
    highlights: Joi.array().items(Joi.string().min(5)),
    faq: Joi.array().items(
      Joi.object({
        question: Joi.string().min(10).required(),
        answer: Joi.string().min(10).required(),
      })
    ),
    faq_section_title: Joi.string().allow("", null).optional(),
    sub_description: Joi.string().allow("", null).optional(),
    trip_highlights_title: Joi.string().allow("", null).optional(),
    trip_highlights: Joi.string().allow("", null).optional(),
    trip_highlights_description: Joi.string().allow("", null).optional(),
    itinerary_title: Joi.string().allow("", null).optional(),
    overviewImage: Joi.any().optional(),
    extra_activities: Joi.array().items(Joi.string().min(5)),
    suitable_for: Joi.array().items(Joi.string().min(5)),
    cost_inclusions: Joi.object({
      permits: Joi.array().items(Joi.string().min(2)),
      services: Joi.array().items(Joi.string().min(2)),
    }),
    why_travel_with_us: Joi.array().items(Joi.string().min(5)),
    cost_exclusions: Joi.array().items(Joi.string().min(2)),
    cost: Joi.string().allow("", null).empty("").optional(),
    trip_type_level: Joi.string().allow("", null).optional(),
    trip_attractions: Joi.string().allow("", null).optional(),
    trip_max_elevation: Joi.string().allow("", null).optional(),
    trip_best_season: Joi.string().allow("", null).optional(),
    trip_meals: Joi.string().allow("", null).optional(),
    trip_accommodation: Joi.string().allow("", null).optional(),
    trip_transportations: Joi.string().allow("", null).optional(),
    tags: Joi.array().items(Joi.string().min(2)),
    meta_title: Joi.string().min(3).max(200).optional(),
    meta_description: Joi.string().min(3).max(500).optional(),
    slug: Joi.string().optional(),
    showFaqs: Joi.boolean().optional(),
    showBookingForm: Joi.boolean().optional(),
    customSections: Joi.array()
      .items(
        Joi.object({
          id: Joi.number().optional(),
          title: Joi.string().min(3).max(200).required(),
          type: Joi.string().valid("list", "paragraph").required(),
          content: Joi.array().items(Joi.string().min(1)).min(1).required(),
        })
      )
      .optional(),
  }).required(),
}).unknown(true);

const validatePckageTour = (req, res, next) => {
  const { error } = PackageTour.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  next();
};

module.exports = validatePckageTour;
