import ResearchDashboard from "../pages/ResearchDashboard";
import DashboardIndex from "../pages/research/DashboardIndex";

import SubmitProposal from "../components/research/researcher/SubmitProposal";
import SubmitAmendment from "../components/research/researcher/SubmitAmendment";
import SubmitContinuingReview from "../components/research/SubmitContinuingReview";
import SubmitStudyClosure from "../components/research/SubmitStudyClosure";
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
    { path: "submit-amendment", element: <SubmitAmendment /> },
    { path: "submit-continuing-review", element: <SubmitContinuingReview /> },
    { path: "submit-closure", element: <SubmitStudyClosure /> },

   
    { path: "view/:id", element: <ViewProposalDetails /> },
    { path: "review/:id", element: <ReviewSubmission /> },

   
    { path: "profile", element: <MyProfile /> },

  
    { path: "dashboard/researcher", element: <DashboardIndex /> },
    { path: "dashboard/reviewer", element: <DashboardIndex /> },
    { path: "dashboard/committee", element: <DashboardIndex /> },
    { path: "dashboard/submissions", element: <DashboardIndex /> },
    { path: "dashboard/submit-amendment", element: <SubmitAmendment /> },
    { path: "dashboard/submit-continuing-review", element: <SubmitContinuingReview /> },
    { path: "dashboard/submit-closure", element: <SubmitStudyClosure /> },
    { path: "dashboard/payments", element: <DashboardIndex /> },
    { path: "dashboard/certificates", element: <DashboardIndex /> },
    { path: "dashboard/review-queue", element: <DashboardIndex /> },
    { path: "dashboard/review-history", element: <DashboardIndex /> },
    { path: "dashboard/final-approvals", element: <DashboardIndex /> },
    { path: "dashboard/all-research", element: <DashboardIndex /> },
    { path: "dashboard/profile", element: <MyProfile /> },
  ],
};