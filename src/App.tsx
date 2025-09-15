import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./routes/Layout";
import StudentIdInputPage from "./routes/page";
import TimetablePage from "./routes/timetable/page";
import ProfilePage from "./routes/profile/page";
import SettingsPage from "./routes/settings/page";
import NotificationsPage from "./routes/notifications/page";
import { useEffect } from "react";
import OfflineBanner from "./components/OfflineBanner";
import NetworkStatus from "./components/NetworkStatus";

const App: React.FC = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => console.log("[SW] registered:", reg.scope))
        .catch((err) => console.error("[SW] register failed:", err));
    }
  }, []);

  return (
    <BrowserRouter>
      {/* Offline Status Indicators */}
      <OfflineBanner />
      <NetworkStatus />

      <Layout>
        <Routes>
          <Route path="/" element={<StudentIdInputPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
