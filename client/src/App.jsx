import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollBehaviour from "./common/layouts/scrollBehaviour";
import RequireRole from "./components/auth/RequireRole";
import { getDashboardRoles } from "./config/dashboardRoles";
import "./App.css";
import { ToastContainer } from "react-toastify";

/* ─── Global loading fallback ─── */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

/* ─── Public pages (lazy) ─── */
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Doctors = lazy(() => import("./pages/Doctors"));
const Feedback = lazy(() => import("./pages/Feedback"));
const ReportFraud = lazy(() => import("./pages/ReportFraud"));
const Appointment = lazy(() => import("./pages/Appointment"));
const Career = lazy(() => import("./pages/Careers"));
const BloodDonation = lazy(() => import("./pages/BloodDonation"));
const FinancialAid = lazy(() => import("./pages/FinancialAid"));
const HMIS = lazy(() => import("./pages/Hmis"));
const ApplyCareer = lazy(() => import("./pages/ApplyCareer"));
const AmbulanceServices = lazy(() => import("./pages/AmbulanceServices"));
const BloodRegistration = lazy(() => import("./pages/BloodRegistration"));
const Downloads = lazy(() => import("./pages/Downloads"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Tenders = lazy(() => import("./pages/TenderPage"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

const ServiceDetails = lazy(() => import("./components/modals/ServiceDetails"));
const DoctorDetails = lazy(() => import("./components/modals/DoctorDetails"));
const NewsDetails = lazy(() => import("./components/modals/NewsDetails"));

const ResearchPage = lazy(() => import("./pages/research/Research"));
const PublicResearch = lazy(() => import("./pages/research/PublicResearch"));
const ResearchRegister = lazy(() => import("./pages/research/Register"));
const ResearchDashboard = lazy(() => import("./pages/ResearchDashboard"));
const DashboardIndex = lazy(() => import("./pages/research/DashboardIndex"));
const Myprofile = lazy(() => import("./pages/research/MyProfile"));

const SubmitProposal = lazy(() => import("./components/research/SubmitProposal"));
const ResearchProgress = lazy(() => import("./components/research/ResearchProgress"));
const SubmitFinalPaper = lazy(() => import("./components/research/SubmitFullPaper"));
const ReviewSubmission = lazy(() => import("./components/research/reviewer/Reviewsubmission"));
const MySubmissions = lazy(() => import("./components/research/researcher/MySubmission"));
const Payments = lazy(() => import("./components/research/researcher/Payments"));
const Certificates = lazy(() => import("./components/research/researcher/Certificates"));
const ResearchDetails = lazy(() => import("./components/research/researcher/ResearchDetails"));
const ReviewHistory = lazy(() => import("./components/research/reviewer/ReviewHistory"));
const ReviewQueue = lazy(() => import("./components/research/reviewer/ReviewQueue"));
const CommitteeDashboard = lazy(() => import("./components/research/dashboard/CommitteeDashboard"));
const ResearcherDashboard = lazy(
  () => import("./components/research/dashboard/ResearcherDashboard")
);
const ReviewerDashboard = lazy(() => import("./components/research/dashboard/ReviewerDashboard"));
const AllResearch = lazy(() => import("./components/research/committee/AllResearch"));
const FinalApproval = lazy(() => import("./components/research/committee/FinalApprovals"));
const CommitteeResearchDetails = lazy(
  () => import("./components/research/committee/CommitteeResearchDetails")
);
const CommitteeSignOff = lazy(() => import("./components/research/committee/CommitteeSignOff"));

const Sidebar = lazy(() => import("./components/Dashboard/Sidebar"));
const Dashboard = lazy(() => import("./components/Dashboard/Dashboard"));
const Users = lazy(() => import("./components/Dashboard/UsersPages"));
const AppointmentPg = lazy(() => import("./components/Dashboard/AppointmentPage"));
const News = lazy(() => import("./components/Dashboard/NewsPage"));
const Events = lazy(() => import("./components/Dashboard/EventsPage"));
const Research = lazy(() => import("./components/Dashboard/ResearchPage"));
const FeedbackPg = lazy(() => import("./components/Dashboard/FeedbackPage"));
const Fraud = lazy(() => import("./components/Dashboard/FraudPage"));
const Careers = lazy(() => import("./components/Dashboard/CareersPage"));
const ServicesList = lazy(() => import("./components/Dashboard/Services"));
const Profile = lazy(() => import("./components/Dashboard/ProfilePage"));
const EditUserPage = lazy(() => import("./components/Dashboard/EditUserPage"));
const InventoryPage = lazy(() => import("./components/Dashboard/InventoryPage"));
const LogisticsPage = lazy(() => import("./components/Dashboard/LogisticsPage"));
const GalleryPage = lazy(() => import("./components/Dashboard/GalleryPage"));
const NoticePage = lazy(() => import("./components/Dashboard/NoticesManagement"));
const TenderPage = lazy(() => import("./components/Dashboard/TenderPage"));
const ReportsPage = lazy(() => import("./components/Dashboard/ReportsPage"));
const Donations = lazy(() => import("./components/Dashboard/Donations"));
const AuditLogPage = lazy(() => import("./components/Dashboard/AuditLog"));

/* ─── Auth pages (lazy) ─── */
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const Guarded = ({ path, children }) => (
  <RequireRole roles={getDashboardRoles(path)}>{children}</RequireRole>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollBehaviour />
      <Suspense fallback={<PageLoader />}>
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/ambulance-services" element={<AmbulanceServices />} />
          <Route path="/blood-registration" element={<BloodRegistration />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/apply/:id" element={<ApplyCareer />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/news/:id" element={<NewsDetails />} />

          {/* ── Research ── */}
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/research/public" element={<PublicResearch />} />
          <Route path="/research/register" element={<ResearchRegister />} />
          <Route path="/research/dashboard" element={<ResearchDashboard />}>
            <Route index element={<DashboardIndex />} />
            <Route path="researcher" element={<ResearcherDashboard />} />
            <Route path="reviewer" element={<ReviewerDashboard />} />
            <Route path="committee" element={<CommitteeDashboard />} />
            <Route path="committee-research-detail/:id" element={<CommitteeResearchDetails />} />
            <Route path="committee-sign-off/:id" element={<CommitteeSignOff />} />
            <Route path="submit-proposal" element={<SubmitProposal />} />
            <Route path="research-progress/:id" element={<ResearchProgress />} />
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

          {/* ── Admin Dashboard ── */}
          <Route path="/dashboard" element={<Sidebar />}>
            <Route
              path="/dashboard"
              element={
                <Guarded path="/dashboard">
                  <Dashboard />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <Guarded path="/dashboard/users">
                  <Users />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/appointments"
              element={
                <Guarded path="/dashboard/appointments">
                  <AppointmentPg />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/news"
              element={
                <Guarded path="/dashboard/news">
                  <News />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <Guarded path="/dashboard/events">
                  <Events />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/research"
              element={
                <Guarded path="/dashboard/research">
                  <Research />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/feedback"
              element={
                <Guarded path="/dashboard/feedback">
                  <FeedbackPg />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/fraud"
              element={
                <Guarded path="/dashboard/fraud">
                  <Fraud />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/careers"
              element={
                <Guarded path="/dashboard/careers">
                  <Careers />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/services"
              element={
                <Guarded path="/dashboard/services">
                  <ServicesList />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <Guarded path="/dashboard/profile">
                  <Profile />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/users/edit/:id"
              element={
                <Guarded path="/dashboard/users/edit/:id">
                  <EditUserPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/inventory"
              element={
                <Guarded path="/dashboard/inventory">
                  <InventoryPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/logistics"
              element={
                <Guarded path="/dashboard/logistics">
                  <LogisticsPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/gallery"
              element={
                <Guarded path="/dashboard/gallery">
                  <GalleryPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/notices"
              element={
                <Guarded path="/dashboard/notices">
                  <NoticePage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/tenders"
              element={
                <Guarded path="/dashboard/tenders">
                  <TenderPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/reports"
              element={
                <Guarded path="/dashboard/reports">
                  <ReportsPage />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/donations"
              element={
                <Guarded path="/dashboard/donations">
                  <Donations />
                </Guarded>
              }
            />
            <Route
              path="/dashboard/audit-logs"
              element={
                <Guarded path="/dashboard/audit-logs">
                  <AuditLogPage />
                </Guarded>
              }
            />
          </Route>
        </Routes>
      </Suspense>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
