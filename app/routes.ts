import type { RouteConfig } from "@react-router/dev/routes";

export default [
    { path: "/", file: "routes/_index.tsx" },
    { path: "/timetable", file: "routes/timetable.tsx" },
    { path: "/home", file: "routes/home.tsx" },
    // 開発中
    { path: "/id-input", file: "routes/id-input.tsx" },
    { path: "/settings", file: "routes/settings.tsx" },
    { path: "/map", file: "routes/map.tsx" },
] satisfies RouteConfig;
