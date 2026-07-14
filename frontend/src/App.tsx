import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import SentimentMonitoring from "./pages/Swara/SentimentMonitoring";
import FeedbackCategory from "./pages/Swara/FeedbackCategory";
import RootCause from "./pages/Swara/RootCause";
import TrendingParticipant from "./pages/Swara/TrendingParticipant";
import MitraPerformance from "./pages/Swara/MitraPerformance";
import ProgramReport from "./pages/Swara/ProgramReport";
import ExecutiveOverview from "./pages/SwaraExecutive/ExecutiveOverview";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ExecutiveLayout from "./layout/ExecutiveLayout";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout - admin only, sesuai keputusan role: manajerial cuma boleh executive-overview */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index path="/" element={<Home />} />
            <Route path="/sentiment-monitoring" element={<SentimentMonitoring />} />
            <Route path="/feedback-category" element={<FeedbackCategory />} />
            <Route path="/root-cause" element={<RootCause />} />
            <Route path="/trending-participant" element={<TrendingParticipant />} />
            <Route path="/mitra-performance" element={<MitraPerformance />} />
            <Route path="/program-report" element={<ProgramReport />} />
          </Route>

          {/* Executive Overview - admin & manajerial, tanpa sidebar (bukan children dari AppLayout) */}
          <Route
            element={
              <ProtectedRoute allowedRoles={["admin", "manajerial"]}>
                <ExecutiveLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/executive-overview" element={<ExecutiveOverview />} />
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}