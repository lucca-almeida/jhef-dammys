import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "JhefDammys",
    short_name: "JhefDammys",
    description: "Sistema interno para agenda, custos, estoque e orcamentos.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f6efe8",
    theme_color: "#2f241f",
    lang: "pt-BR",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
