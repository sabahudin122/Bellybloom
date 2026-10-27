import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bellybloom — Baby Food Planner & Community",
    short_name: "Bellybloom",
    description: "A safety-first baby food planner and parent community.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fffaf1",
    theme_color: "#ffb997",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/maskable-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
