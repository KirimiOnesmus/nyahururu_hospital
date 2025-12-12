import { useState, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
  EventsPage,
  Downloads, 
  Tenders,
  VerifyEmail
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
  Donations
} from "./components/Dashboard";
import {
  ServiceDetails,
  DoctorDetails,
  NewsDetails,
} from "./components/modals";

import "./App.css";
  import { ToastContainer } from 'react-toastify';

function App() {
    const [loading, setLoading] = useState(true);
      useEffect(() => {
    // 2 second delay to allow APIs to initialize
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

    if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col justify-center items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>

        </div>
      </div>
    );
  }
  return (
    <>
      <BrowserRouter>
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
          <Route path="/events" element={<EventsPage/>}/>
          <Route path="/downloads" element={<Downloads/>}/>
          <Route path= "/tenders" element ={<Tenders/>}/>
          <Route path="verify-email" element={<VerifyEmail/>}/>

          <Route path="/apply/:id" element={<ApplyCareer />} />

          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/news/:id" element={<NewsDetails />} />

          <Route path="/dashboard" element={<Sidebar />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/users" element={<Users />} />
            <Route
              path="/dashboard/appointments"
              element={<AppointmentPage />}
            />
            <Route path="/dashboard/news" element={<News />} />
            <Route path="/dashboard/events" element={<Events />} />
            <Route path="/dashboard/research" element={<Research />} />
            <Route path="/dashboard/feedback" element={<FeedbackPage />} />
            <Route path="/dashboard/fraud" element={<Fraud />} />
            <Route path="/dashboard/careers" element={<Careers />} />
            <Route path="/dashboard/services" element={<ServicesList />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/dashboard/hospitals" element={<Hospital />} />
            <Route path="/dashboard/users/edit/:id" element={<EditUserPage />} /> 
            <Route path="/dashboard/inventory" element={<InventoryPage/>} />
            <Route path="/dashboard/logistics" element={<LogisticsPage/>} />
            <Route path="/dashboard/gallery" element={<GalleryPage/>} />
            <Route path="/dashboard/notices" element={<NoticePage/>} />
            <Route path="/dashboard/tenders" element={<TenderPage/>} />
            <Route path="/dashboard/reports" element={<ReportsPage/>} />
            <Route path="/dashboard/donations" element={<Donations/>} />


          </Route>
        </Routes>
         <ToastContainer />
      </BrowserRouter>
    </>
  );
}

export default App;
