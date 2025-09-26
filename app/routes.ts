import type { RouteConfig } from "@react-router/dev/routes";

export default [
  { path: "/", file: "routes/home.tsx" },
  { path: "/schedule", file: "routes/schedule.tsx" },
    // 開発中
    {path: "/id-input", file: "routes/id-input.tsx"},
    {path: "/settings", file: "routes/settings.tsx"},
    {path: "/map", file: "routes/map.tsx"},
] satisfies RouteConfig;
