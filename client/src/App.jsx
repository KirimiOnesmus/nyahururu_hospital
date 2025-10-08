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
  HMIS
  ,IpcLogin
} from "./pages/index";
import {
  ServiceDetails,
  DoctorDetails,
  NewsDetails,
} from "./components/modals";

import "./App.css";

function App() {
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
          <Route path="/ipc-login" element={<IpcLogin />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/doctors/:id" element={<DoctorDetails />} />
          <Route path="/news/:id" element={<NewsDetails />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
