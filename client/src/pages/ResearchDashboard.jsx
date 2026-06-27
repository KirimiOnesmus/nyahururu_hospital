import { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";
import SideMenu from "../components/research/SideMenu";
import { FaFlask } from "react-icons/fa";
import { getResearcherProfile } from "../api/auth";

const PageSpinner = ({ label = "Loading…" }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600
      rounded-full animate-spin" />
    <p className="text-slate-500 font-medium text-sm">{label}</p>
  </div>
);


const Shell = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">
      {children}
    </main>
   
  </div>
);

const ResearchDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getResearcherProfile();
        setUser(res.researcher || res);
      } catch {
        const cached = localStorage.getItem("researcher");
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            toast.error("Failed to load profile");
            navigate("/hmis");
          }
        } else {
          toast.error("Failed to load profile");
          navigate("/hmis");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <Shell>
        <PageSpinner label="Loading dashboard…" />
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div className="flex flex-col items-center py-20 gap-4">
          <FaFlask className="text-slate-300 text-5xl" />
          <p className="text-slate-600 font-medium">Unable to load profile</p>
          <button
            type="button"
            onClick={() => navigate("/hmis")}
            className="text-blue-600 hover:text-blue-700 font-semibold
              text-sm cursor-pointer"
          >
            Return to login
          </button>
        </div>
      </Shell>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="lg:pl-64">
        <SideMenu user={user} />
      </div>

      <main className="lg:pl-64 flex-1 flex flex-col">
        <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
          <Outlet context={{ user }} />
        </div>

      </main>
    </div>
  );
};

export default ResearchDashboard;