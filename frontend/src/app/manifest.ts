import type { MetadataRoute } from "next";

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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
