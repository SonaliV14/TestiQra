import express from "express";
import cors from "cors";
import UserRouter from "./router/Userrouter.js";
import SpaceCreationRouter from "./router/SpaceCreation.js";
import SpacefetchingRouter from "./router/Spacefetching.js";
import SpaceinfofetchRouter from "./router/FetchspaceInfo.js";
import SendtestimonialsRouter from "./router/SendTestimonials.js";
import FetchTestimonials from "./router/FetchTestimonials.js";
import DeleteSpaceRouter from "./router/DeleteSpaceRouter.js";
import LikedTestimonialsRouter from "./router/Likedtestimonials.js";
import editRouter from "./router/editspace.js";
import AiRouter from "./router/AiRouter.js";
import EmailRouter from "./router/EmailRouter.js";

const app = express();

// ✅ STEP 1 — headers first, before everything
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  next();
});

// ✅ STEP 2 — cors second
app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://testi-qra.vercel.app',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!origin) return callback(null, true);

    if (allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ STEP 3 — preflight third
app.options('*', cors());

// ✅ STEP 4 — body parser fourth
app.use(express.json());

// ✅ STEP 5 — routes last
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/space-creation", SpaceCreationRouter);
app.use("/api/v1/space-fetch", SpacefetchingRouter);
app.use("/api/v1/spaceinfo", SpaceinfofetchRouter);
app.use("/api/v1/space", DeleteSpaceRouter);
app.use("/api/v1/sendtestimonials", SendtestimonialsRouter);
app.use("/api/v1/fetchtestimonials", FetchTestimonials);
app.use("/api/v1", LikedTestimonialsRouter);
app.use("/api/v1/edit", editRouter);
app.use("/api/v1/ai", AiRouter);
app.use('/api/v1/email', EmailRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`server is running on port ${process.env.PORT || 3001}`);
});