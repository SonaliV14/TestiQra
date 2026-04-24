import express from "express";
import Authmiddlware from "../middleware.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SendtestimonialsRouter = express.Router();

SendtestimonialsRouter.post("/", Authmiddlware, async (req, res) => {
  console.log("Received testimonial request");

  const { spacename } = req.query;
  const { username, email, isTextContent, content, imageURL, UserImageURL } =
    req.body.testimonial;
  const Rating = req.body.rating;
  const videoUrl = req.body.videoUrl || null;

  console.log("Request Body:", req.body);

  try {
    const spaceinfo = await prisma.space.findUnique({
      where: { space_name: spacename },
    });

    if (!spaceinfo) {
      return res.status(404).json({ message: "Space not found" });
    }

    const createTestimonial = await prisma.testimonial.create({
      data: {
        username,
        email,
        isTextContent: videoUrl ? false : isTextContent,
        Content: videoUrl ? "[Video Testimonial]" : content,
        imageURL: imageURL || "",
        UserImageURL: UserImageURL || "",
        Rating: Rating || 5,
        spaceId: spaceinfo.id,
        // Note: videoUrl stored in Content as special marker if schema doesn't have videoUrl field
        // If you add a videoUrl field to Prisma schema, use: videoUrl: videoUrl || null
      },
    });

    console.log("Testimonial Created:", createTestimonial);
    res.status(201).json({
      message: "Testimonial has been sent successfully",
      testimonialId: createTestimonial.id,
    });
  } catch (err) {
    console.error("Error creating testimonial:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default SendtestimonialsRouter;