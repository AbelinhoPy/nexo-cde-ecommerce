import type { MetadataRoute } from "next";
import { PRODUCTOS_CATALOGO } from "../lib/catalogData";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://nexocde.vercel.app";
  return [
    { url: base + "/" },
    ...Array.from(new Set(PRODUCTOS_CATALOGO.map(({ id }) => id)), (id) => ({
      url: base + "/producto/" + encodeURIComponent(id),
    })),
  ];
}
