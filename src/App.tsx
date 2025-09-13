import { BrowserRouter, Route, Routes } from "react-router-dom";
import StudentIdInputPage from "./routes/page";
import TimetablePage from "./routes/timetable/page";
import ProfilePage from "./routes/profile/page";
import SettingsPage from "./routes/settings/page";
import NotificationsPage from "./routes/notifications/page";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentIdInputPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
