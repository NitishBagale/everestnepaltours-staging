const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
require("dotenv").config();
const cors = require("cors");
const searchCache = new Map();

const indexRouter = require("./src/routes/index");
const adminRouter = require("./src/routes/admin.route");
const fileRouter = require("./src/routes/file.route");
const bookingRouter = require("./src/routes/booking.route");
const enquiryRouter = require("./src/routes/enquiry.route");
const settingRouter = require("./src/routes/setting.route");
const {
  testPostgresConnection,
} = require("./config/db/postgres/connectPostgres");
const cmsrouter = require("./src/routes/cms.route");
const blogRouter = require("./src/routes/blog.routes");
const categoryRouter = require("./src/routes/category");
const packageTourRouter = require("./src/routes/packageTour");
const reviewRouter = require("./src/routes/review");
const contactFormRouter = require("./src/routes/contactForm");
const commentRouter = require("./src/routes/comment");
const travellerRouter = require("./src/routes/traveller");
const teamRouter = require("./src/routes/team");
const mediaRouter = require("./src/routes/media");
const seoRouter = require("./src/routes/seo");
const contentBlockRouter = require("./src/routes/contentBlock");

const app = express();
testPostgresConnection();

app.set("views", path.join(__dirname, "/src/views"));
app.set("view engine", "jade");
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

app.use(
  cors({
    origin: corsOrigins,
    credentials: false,
  })
);

console.log("CORS origins:", corsOrigins);

app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/traveller", travellerRouter);
app.use("/admin", adminRouter);
app.use("/file", fileRouter);
app.use("/booking", bookingRouter);
app.use("/enquiry", enquiryRouter);
app.use("/settings", settingRouter);
app.use("/cms", cmsrouter);
app.use("/blog", blogRouter);
app.use("/category", categoryRouter);
app.use("/package-tour", packageTourRouter);
app.use("/review", reviewRouter);
app.use("/contact-form", contactFormRouter);
app.use("/team", teamRouter);
app.use("/comment", commentRouter);
app.use("/media", mediaRouter);
app.use("/seo", seoRouter);
app.use("/content-block", contentBlockRouter);

app.get("/api/search", async (req, res) => {
  const { q } = req.query;

  if (searchCache.has(q)) {
    return res.json(searchCache.get(q));
  }

  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return res.status(400).json([]);
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=np&q=${q}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "everest-holidaysbooking/1.0 (dev@santoshdahal.info.np)",
        Referer: "http://localhost:3000",
      },
    });

    if (!response.ok) {
      // Log the error and return empty array
      console.error(
        `Nominatim error: ${response.status} ${response.statusText}`
      );
      return res.status(response.status).json([]);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("Nominatim did not return an array:", data);
      return res.status(502).json([]);
    }

    res.json(data);
  } catch (err) {
    // Log the error and return empty array
    console.error("Error fetching from Nominatim:", err);
    res.status(500).json([]);
  }
});

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
