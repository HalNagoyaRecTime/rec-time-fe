import type { RouteConfig } from "@react-router/dev/routes";

export default [
    { path: "/", file: "routes/_index.tsx" },
    { path: "/timetable", file: "routes/timetable.tsx" },
    { path: "/home", file: "routes/home.tsx" },
    // 開発中
    { path: "/register/student-id", file: "routes/register/student-id.tsx" },
    { path: "/register/birthday", file: "routes/register/birthday.tsx" },
    { path: "/settings", file: "routes/settings.tsx" },
    { path: "/map", file: "routes/map.tsx" },
] satisfies RouteConfig;
