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
import AppLayoutExecutive from "./layout/AppLayoutExecutive";


export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Dashboard Layout biasa */}
        <Route element={<AppLayout />}>
          <Route index path="/" element={<Home />} />
          <Route path="/sentiment-monitoring" element={<SentimentMonitoring />} />
          <Route path="/feedback-category" element={<FeedbackCategory />} />
          <Route path="/root-cause" element={<RootCause />} />
          <Route path="/trending-participant" element={<TrendingParticipant />} />
          <Route path="/mitra-performance" element={<MitraPerformance />} />
          <Route path="/program-report" element={<ProgramReport />} />
        </Route>

        {/* Executive Layout terpisah */}
        <Route element={<AppLayoutExecutive />}>
          <Route path="/executive-overview" element={<ExecutiveOverview />} />
          {/* tambahkan route executive lain di sini kalau ada */}
        </Route>

        {/* Auth Layout */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}