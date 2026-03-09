import express from "express";
import zod from "zod";
import jwt from "jsonwebtoken";
import JWT_SECRET from "../config.js";
import Authmiddlware from "../middleware.js";
import { PrismaClient } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const prisma = new PrismaClient();
const UserRouter = express.Router();

const userValidationSchema = zod.object({
  email: zod.string().email(),
  firstname: zod.string().min(1, "First name is required"),
  password: zod.string().min(6, "Password must be at least 6 characters"),
});

const signinValidationSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(1, "Password is required"),
});

UserRouter.post("/signup", async (req, res) => {
  try {
    const validationResult = userValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }
    console.log(validationResult.data);
    const { email, firstname, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const userResponse = await prisma.user.create({
      data: {
        email,
        firstName: firstname,
        password, // Note: You should hash the password before storing
        authProvider: "local",
      },
    });

    const token = jwt.sign(
      { email: userResponse.email, firstname: userResponse.firstName },
      JWT_SECRET
    );

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.post("/signin", async (req, res) => {
  try {
    const validationResult = signinValidationSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { email, password } = validationResult.data;

    const user = await prisma.user.findUnique({
      where: {
        email,
        password, // Note: You should compare hashed passwords
        authProvider: "local", // Check for local auth provider
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { email: user.email, firstname: user.firstName },
      JWT_SECRET
    );

    res.status(200).json({
      message: "User logged in successfully",
      user,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

UserRouter.post("/google-signin", async (req, res) => {
  try {
    const { token } = req.body; // Receive the ID token from the client

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if the user exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const jwtToken = jwt.sign(
        { email: existingUser.email, firstname: existingUser.firstName },
        JWT_SECRET
      );
      return res.status(200).json({
        message: "User logged in successfully",
        user: existingUser,
        token: jwtToken,
      });
    }

    // Create a new user if they don't exist
    const newUser = await prisma.user.create({
      data: {
        email,
        firstName: name,
        authProvider: "google",
      },
    });

    const jwtToken = jwt.sign(
      { email: newUser.email, firstname: newUser.firstName },
      JWT_SECRET
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
      token: jwtToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default UserRouter;
