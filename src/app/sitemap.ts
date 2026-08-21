import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://usebellory.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/how-it-works", "/garage-doors", "/pricing", "/resources", "/about", "/privacy", "/terms", "/sms-terms", "/sms-consent", "/contact"].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : ["/privacy", "/terms", "/sms-terms", "/sms-consent", "/contact"].includes(path) ? 0.5 : 0.8,
  }));
}
