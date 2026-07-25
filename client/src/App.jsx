import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollBehaviour from "./components/layouts/scrollBehaviour";
import RequireRole from "./components/auth/RequireRole";
import { getDashboardRoles } from "./config/dashboardRoles";
import {
  Doctors,
  Home,
  Services,
  About,
  Feedback,
  ReportFraud,
  Appointment,
  Career,
  BloodDonation,
  FinancialAid,
  HMIS,
  ApplyCareer,
  AmbulanceServices,
  BloodRegistration,
  Downloads,
  Tenders,
  VerifyEmail,
  ResearchDashboard,
} from "./pages/index";
import {
  Dashboard,
  AppointmentPage,
  Events,
  FeedbackPage,
  Fraud,
  News,
  Research,
  Sidebar,
  Users,
  Careers,
  ServicesList,
  Profile,
  Hospital,
  EditUserPage,
  InventoryPage,
  LogisticsPage,
  GalleryPage,
  NoticePage,
  TenderPage,
  ReportsPage,
  Donations,
} from "./components/Dashboard";
import {
  ServiceDetails,
  DoctorDetails,
  NewsDetails,
} from "./components/modals";
import {
  ResearchPage,
  PublicResearch,
  ResearchRegister,
  Myprofile,
  DashboardIndex,
} from "./pages/research";

//  Research dashboard children

import {
  SubmitProposal,
  ResearchProgress,
  SubmitFinalPaper,
  ReviewSubmission,
  MySubmissions,
  Payments,
  Certificates,
  ResearchDetails,
  ReviewHistory,
  ReviewQueue,
  CommitteeDashboard,
  ResearcherDashboard,
  ReviewerDashboard,
  AllResearch,
  FinalApproval,
  CommitteeResearchDetails,
  CommitteeSignOff,
} from "./components/research";

import "./App.css";
import { ToastContainer } from "react-toastify";

function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600" />
        </div>
      </div>
    );
  }
  return (
    <>
      <BrowserRouter>
        <ScrollBehaviour />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/report-fraud" element={<ReportFraud />} />
          <Route path="/appointment" element={<Appointment />} />
          <Route path="/careers" element={<Career />} />
          <Route path="/blood-donation" element={<BloodDonation />} />
          <Route path="/financial-aid" element={<FinancialAid />} />
          <Route path="/hmis" element={<HMIS />} />
          <Route path="/ambulance-services" element={<AmbulanceServices />} />
          <Route path="/blood-registration" element={<BloodRegistration />} />
          {/* <Route path="/events" element={<EventsPage/>}/> */}
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/tenders" element={<Tenders />} />

          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/public" element={<PublicResearch />} />
          <Route path="/research/register" element={<ResearchRegister />} />
          {/* Research Dashboard */}
          <Route path="/research/dashboard" element={<ResearchDashboard />}>
            <Route index element={<DashboardIndex />} />

            <Route path="researcher" element={<ResearcherDashboard />} />
            <Route path="reviewer" element={<ReviewerDashboard />} />
            <Route path="committee" element={<CommitteeDashboard />} />
            <Route
              path="committee-research-detail/:id"
              element={<CommitteeResearchDetails />}
            />
            <Route
              path="committee-sign-off/:id"
              element={<CommitteeSignOff />}
            />
            <Route path="submit-proposal" element={<SubmitProposal />} />
            <Route
              path="research-progress/:id"
              element={<ResearchProgress />}
            />

            <Route path="submit-final/:id" element={<SubmitFinalPaper />} />
            <Route path="view/:id" element={<ResearchDetails />} />
            <Route path="review/:id" element={<ReviewSubmission />} />
            <Route path="profile" element={<Myprofile />} />
            <Route path="submissions" element={<MySubmissions />} />
            <Route path="payments" element={<Payments />} />
            <Route path="certificates" element={<Certificates />} />
            <Route path="review-queue" element={<ReviewQueue />} />
            <Route path="review-history" element={<ReviewHistory />} />
            <Route path="final-approvals" element={<FinalApproval />} />
            <Route path="all-research" element={<AllResearch />} />
          </Route>

          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="/apply/:id" element={<ApplyCareer />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/news/:id" element={<NewsDetails />} />

          {/* //Hospital Dashboard */}
          <Route path="/dashboard" element={<Sidebar />}>
            <Route
              path="/dashboard"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard")}>
                  <Dashboard />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/users")}>
                  <Users />
                </RequireRole>
              }
            />

            <Route
              path="/dashboard/appointments"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/appointments")}>
                  <AppointmentPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/news"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/news")}>
                  <News />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/events")}>
                  <Events />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/research"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/research")}>
                  <Research />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/feedback"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/feedback")}>
                  <FeedbackPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/fraud"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/fraud")}>
                  <Fraud />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/careers"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/careers")}>
                  <Careers />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/services"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/services")}>
                  <ServicesList />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/profile")}>
                  <Profile />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/hospitals"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/hospitals")}>
                  <Hospital />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/users/edit/:id"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/users/edit/:id")}>
                  <EditUserPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/inventory"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/inventory")}>
                  <InventoryPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/logistics"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/logistics")}>
                  <LogisticsPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/gallery"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/gallery")}>
                  <GalleryPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/notices"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/notices")}>
                  <NoticePage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/tenders"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/tenders")}>
                  <TenderPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/reports")}>
                  <ReportsPage />
                </RequireRole>
              }
            />
            <Route
              path="/dashboard/donations"
              element={
                <RequireRole roles={getDashboardRoles("/dashboard/donations")}>
                  <Donations />
                </RequireRole>
              }
            />
          </Route>
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </>
  );
}

export default App;
