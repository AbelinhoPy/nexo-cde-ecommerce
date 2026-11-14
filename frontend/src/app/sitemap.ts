import type { MetadataRoute } from "next";
import { PRODUCTOS_CATALOGO } from "../lib/catalogData";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nexocde.vercel.app";
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/como-comprar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...Array.from(new Set(PRODUCTOS_CATALOGO.map(({ id }) => id)), (id) => ({
      url: `${base}/producto/${encodeURIComponent(id)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
