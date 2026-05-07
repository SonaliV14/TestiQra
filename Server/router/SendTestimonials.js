import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SendtestimonialsRouter = express.Router();

// ─── In-memory stores ─────────────────────────────────────────────────────────
const emailSubmissions = new Map(); // email → [timestamps]
const ipSubmissions    = new Map(); // ip    → [timestamps]
const blockedIPs       = new Set();

const RATE_LIMITS = {
  email: { max: 3,  windowMs: 24 * 60 * 60 * 1000 }, // 3 per email per 24h
  ip:    { max: 10, windowMs: 60 * 60 * 1000 },       // 10 per IP per hour
};

const isRateLimited = (store, key, max, windowMs) => {
  const now = Date.now();
  const timestamps = (store.get(key) || []).filter(t => now - t < windowMs);
  store.set(key, timestamps);
  if (timestamps.length >= max) return true;
  timestamps.push(now);
  store.set(key, timestamps);
  return false;
};

const looksLikeSpam = (content = '') => {
  const patterns = [
    /https?:\/\//gi,
    /\b(viagra|casino|crypto|bitcoin|loan|prize|winner)\b/gi,
    /(.)\1{6,}/,
  ];
  return patterns.some(p => p.test(content));
};

SendtestimonialsRouter.post("/", async (req, res) => {

  // ── 1. Honeypot check ──────────────────────────────────────────────────────
  if (req.body._gotcha || req.body.website) {
    return res.status(200).json({ message: "testimonial has been sent" });
  }

  // ── 2. IP rate limiting ────────────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.socket.remoteAddress
           || 'unknown';

  if (blockedIPs.has(ip)) {
    return res.status(429).json({ message: "Too many requests. Try again later." });
  }

  if (isRateLimited(ipSubmissions, ip, RATE_LIMITS.ip.max, RATE_LIMITS.ip.windowMs)) {
    const ipHistory = ipSubmissions.get(ip) || [];
    if (ipHistory.length >= RATE_LIMITS.ip.max * 3) blockedIPs.add(ip);
    return res.status(429).json({ message: "Too many requests from your network. Try again in an hour." });
  }

  const { spacename } = req.query;
  const { username, email, isTextContent, content, imageURL, UserImageURL } =
    req.body.testimonial || {};
  const Rating = req.body.rating;
  const videoUrl = req.body.videoUrl || null;

  // ── 3. Basic validation ────────────────────────────────────────────────────
  if (!email || !username || !spacename) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  // ── 4. Email rate limiting ─────────────────────────────────────────────────
  const normalizedEmail = email.toLowerCase().trim();

  if (isRateLimited(emailSubmissions, normalizedEmail, RATE_LIMITS.email.max, RATE_LIMITS.email.windowMs)) {
    return res.status(429).json({ message: "You've already submitted recently. Please wait 24 hours." });
  }

  // ── 5. Spam content check ──────────────────────────────────────────────────
  if (looksLikeSpam(content)) {
    return res.status(400).json({ message: "Your submission was flagged as spam." });
  }

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
        email: normalizedEmail,
        isTextContent,
        Content: content,
        imageURL: imageURL || "",
        UserImageURL: UserImageURL || "",
        Rating,
        videoUrl: videoUrl || "",
        spaceId: spaceinfo.id,
      },
    });

    console.log("Testimonial created:", createTestimonial.id);
    res.status(201).json({ message: "testimonial has been sent" });

  } catch (err) {
    console.error("Error creating testimonial:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default SendtestimonialsRouter;