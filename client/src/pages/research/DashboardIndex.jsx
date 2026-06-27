import { useOutletContext } from "react-router-dom";
import {
  ResearcherDashboard,
  ReviewerDashboard,
  CommitteeDashboard,
} from "../../components/research";

const ROLE_ALIAS = {
  research_committee: "committee",
  committee: "committee",
  reviewer: "reviewer",
  researcher: "researcher",
};

const DASHBOARD_BY_ROLE = {
  researcher: ResearcherDashboard,
  reviewer: ReviewerDashboard,
  committee: CommitteeDashboard,
};

const DashboardIndex = () => {
  const { user } = useOutletContext();

  const rawRole = (localStorage.getItem("role") || "researcher").toLowerCase();
  const role = ROLE_ALIAS[rawRole] || "researcher";
  const DashboardComponent = DASHBOARD_BY_ROLE[role] || ResearcherDashboard;

  return <DashboardComponent user={user} />;
};

export default DashboardIndex;