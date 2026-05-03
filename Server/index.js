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

app.use(cors());
app.use(express.json());
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

// req and res (request and response) 
app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(3001, () => {
  console.log("server is running on port 3001");
});
