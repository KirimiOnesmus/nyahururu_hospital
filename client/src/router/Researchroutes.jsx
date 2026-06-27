import { createBrowserRouter } from "react-router-dom";

import ResearchDashboard from "../pages/ResearchDashboard";
import DashboardIndex from "../pages/research/DashboardIndex";

import SubmitProposal from "../components/research/SubmitProposal";
import SubmitFinalPaper from "../components/research/SubmitFullPaper";
import ViewProposalDetails from "../components/research/Viewproposaldetails";
import ReviewSubmission from "../components/research/ReviewSubmission";
import MyProfile from "../pages/research/MyProfile";


export const researchRoutes = {
  path: "research",
  element: <ResearchDashboard />,
  children: [
    { index: true, element: <DashboardIndex /> },
    { path: "dashboard", element: <DashboardIndex /> },

    { path: "submit-proposal", element: <SubmitProposal /> },
    { path: "submit-final/:id", element: <SubmitFinalPaper /> },
    { path: "view/:id", element: <ViewProposalDetails /> },

    { path: "review/:id", element: <ReviewSubmission /> },


    { path: "profile", element: <MyProfile /> },

    { path: "submissions", element: <DashboardIndex /> },
    { path: "payments", element: <DashboardIndex /> },
    { path: "certificates", element: <DashboardIndex /> },
    { path: "review-queue", element: <DashboardIndex /> },
    { path: "review-history", element: <DashboardIndex /> },
    { path: "final-approvals", element: <DashboardIndex /> },
    { path: "all-research", element: <DashboardIndex /> },
  ],
};

