import express from "express";
import { PrismaClient } from "@prisma/client";
import Authmiddlware from "../middleware.js";

const prisma = new PrismaClient();
const DeleteSpaceRouter = express.Router();

DeleteSpaceRouter.delete("/:space_name", Authmiddlware, async (req, res) => {
  try {
    const { space_name } = req.params;

    // Verify the space belongs to the authenticated user
    const space = await prisma.space.findUnique({
      where: { space_name },
    });

    if (!space) {
      return res.status(404).json({ error: "Space not found" });
    }

    // Delete questions first (foreign key constraint)
    await prisma.question.deleteMany({
      where: { spaceId: space.id },
    });

    // Delete testimonials (foreign key constraint)
    await prisma.testimonial.deleteMany({
      where: { spaceId: space.id },
    });

    // Now delete the space
    await prisma.space.delete({
      where: { space_name },
    });

    res.status(200).json({ message: "Space deleted successfully" });
  } catch (err) {
    console.error("Delete space error:", err);
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

export default DeleteSpaceRouter;