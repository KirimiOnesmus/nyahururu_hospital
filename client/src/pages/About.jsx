import React, { useEffect, useState } from "react";
import{ Header, Footer} from "../common/layouts"
import { Slider, Management } from "../components/layouts";
import { Link, useLocation } from "react-router-dom";
import historyImage from "../assets/history-hospital.webp";
import missionVisionImage from "../assets/mission-vision-background.webp";
import strategicPlanImage from "../assets/strategic-plan.webp";
import managementTeamImage from "../assets/management-team.webp";
import boardImage from "../assets/board-of-management.webp";
import {
  FaBullseye,
  FaEye,
  FaChartLine,
  FaUser,
} from "react-icons/fa";

const menuItems = [
  { id: "about", label: "History" },
  { id: "mission-vision", label: "Mission & Vision" },
  { id: "strategy", label: "Strategic Plan" },
  { id: "org-structure", label: "Management Team" },
  { id: "board", label: "Board of Management" },
];

const strategyPillars = [
  {
    title: "Service Delivery",
    body: "Improving how patients receive care by enhancing quality, reducing waiting times, and expanding the range of services offered to ensure consistent, patient-centered healthcare.",
  },
  {
    title: "Health Workforce",
    body: "Recruiting, training, and retaining skilled staff while prioritising welfare, motivation, and continuous professional development to enhance performance.",
  },
  {
    title: "Health Information Systems",
    body: "Modernising hospital operations by digitising records, improving data accuracy, and strengthening reporting systems to support evidence-based decision-making.",
  },
  {
    title: "Access to Medicines & Technology",
    body: "Ensuring continuous availability of essential medicines, medical supplies, and functional equipment, including modern diagnostic and treatment technologies.",
  },
  {
    title: "Health Financing",
    body: "Strengthening financial sustainability through diversified revenue, improved insurance uptake, and efficient budgeting to reduce out-of-pocket patient payments.",
  },
  {
    title: "Leadership & Governance",
    body: "Strengthening accountability, transparent decision-making, inclusive management practices, and stakeholder engagement across the hospital.",
  },
  {
    title: "Infrastructure Development",
    body: "Construction, renovation, and expansion of hospital facilities — including the outpatient block and perimeter wall — to support increased patient volumes and specialist services.",
  },
];

const boardMembers = [
  {
    name: "Dr. Linus Ndegwa",
    position: "Board Chairperson",
    specialty: "Healthcare Administration",
  },
  {
    name: "Mr. Peter Mwangi",
    position: "Vice Chairperson",
    specialty: "Finance & Governance",
  },
  {
    name: "Dr. Sarah Odhiambo",
    position: "Board Member",
    specialty: "Medical Ethics",
  },
  {
    name: "Ms. Grace Wanjiru",
    position: "Board Member",
    specialty: "Legal Affairs",
  },
  {
    name: "Mr. James Mutua",
    position: "Board Member",
    specialty: "Community Relations",
  },
  {
    name: "Dr. David Otieno",
    position: "Board Member",
    specialty: "Public Health",
  },
];

const AboutHero = ({ title, image, alt }) => (
  <section className="relative isolate h-[220px] sm:h-[260px] lg:h-[300px] overflow-hidden bg-slate-900">
    <img
      src={image}
      alt={alt}
      className="absolute inset-0 -z-10 h-full w-full object-cover object-center"
    />
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/75 via-slate-950/40 to-slate-950/10" />
    <div className="max-w-7xl mx-auto h-full px-5 sm:px-8 flex flex-col justify-center text-white">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-white/85 mb-3">
        <Link to="/about#about" className="hover:text-white hover:underline">About</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{title}</span>
      </nav>
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-semibold tracking-wide">{title}</h1>
    </div>
  </section>
);

const HistoryHero = () => (
  <AboutHero
    title="History"
    image={historyImage}
    alt="Historic Nyahururu County Referral Hospital grounds"
  />
);

const MissionVisionHero = () => (
  <AboutHero
    title="Mission & Vision"
    image={missionVisionImage}
    alt="Nyahururu County Referral Hospital grounds"
  />
);

const StrategicPlanHero = () => (
  <AboutHero
    title="Strategic Plan"
    image={strategicPlanImage}
    alt="Medical care symbols representing the hospital strategic plan"
  />
);

const ManagementTeamHero = () => (
  <AboutHero
    title="Management Team"
    image={managementTeamImage}
    alt="Nyahururu County Referral Hospital clinical team"
  />
);

const BoardHero = () => (
  <AboutHero
    title="Board of Management"
    image={boardImage}
    alt="Board members meeting around a conference table"
  />
);

// History copy preserved; this page only changes the presentation.
const AboutSection = () => (
  <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 dark:bg-slate-900/40">
    <header className="text-center mb-8 sm:mb-10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 mb-2">Snapshot of</p>
      <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200">History</h2>
    </header>
    <div>
      <figure className="mb-7 overflow-hidden">
        <img
          src={historyImage}
          alt="Nyahururu County Referral Hospital grounds"
          className="w-full aspect-[16/8] object-cover object-center"
          loading="lazy"
        />
      </figure>
      <div className="space-y-5 text-slate-700 leading-8 text-[0.98rem] sm:text-base">
        <p>
          Nyahururu County Referral Hospital (NCRH) is located in Laikipia County,
          Kenya, and serves not only Laikipia but also parts of Nyandarua, Nakuru,
          Baringo, Samburu, and to a lesser extent, Nyeri County. Prior to Kenya's
          devolution of governance, the hospital was designated to serve the
          Nyandarua North District. The hospital was established in 1928 as a
          dispensary by the British government, consisting of five buildings,
          including the current administrative block, female surgical ward, female
          medical unit, Voluntary Counselling and Testing (VCT) room, and
          mortuary.
        </p>
        <p>
          In 1968, the Kenyan government upgraded it to a District Hospital.
          Geographically, the hospital is situated at an elevation of
          approximately 399 metres above sea level, providing a cool climate due
          to its proximity to the equator. Notable physical features in the
          vicinity include the Aberdare Ranges to the southeast, the Rift Valley
          to the west, and Lake Ol Bolossat — the only lake in Kenya's central
          region — to the southeast. Thomson Falls, a renowned tourist attraction,
          is also nearby.
        </p>
        <p>
          The hospital is a Level 4 facility offering promotive, preventive,
          curative, and rehabilitative services, and serves as the primary
          referral hospital for Level 2 and Level 3 facilities in the region.
        </p>
      </div>
    </div>
  </section>
);

//  Mission 
const MissionSection = () => (
  <section className="text-center px-5 py-8 sm:py-10 dark:bg-slate-900/40">
    <FaBullseye aria-hidden="true" className="text-4xl text-blue-700 mx-auto mb-4" />
    <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200 mb-4">Our Mission</h2>
    <p className="max-w-3xl mx-auto text-slate-700 leading-relaxed text-base sm:text-lg">
        To provide high-quality, accessible, and equitable healthcare services,
        meeting regional health needs and supporting public health initiatives.
    </p>
  </section>
);

//  Vision 
const VisionSection = () => (
  <section className="text-center px-5 py-8 sm:py-10 dark:bg-slate-900/40">
    <FaEye aria-hidden="true" className="text-4xl text-violet-700 mx-auto mb-4" />
    <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200 mb-4">Our Vision</h2>
    <p className="max-w-3xl mx-auto text-slate-700 leading-relaxed text-base sm:text-lg">
        To provide efficient and effective quality health services to all
        Kenyans.
    </p>
  </section>
);

//  Strategy 
const StrategySection = () => (
  <section className="max-w-5xl mx-auto px-5 sm:px-8 py-12 sm:py-16 dark:bg-slate-900/40">
    <header className="text-center mb-8 sm:mb-10">
      <FaChartLine aria-hidden="true" className="text-4xl text-emerald-700 dark:text-emerald-300 mx-auto mb-4" />
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 dark:text-red-300 mb-2">Planning for the future</p>
      <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200">Strategic Plan</h2>
    </header>
    <p className="text-slate-700 leading-relaxed text-base sm:text-lg mb-10">
      The NCRH Strategic Plan 2025–2029 outlines a roadmap to transform the
      hospital into a Level 5 regional referral facility through improved
      systems, infrastructure, and service capacity. Guided by Kenya's
      Constitution, Vision 2030, and broad stakeholder input, the plan
      emphasises modernising operations, expanding facilities, and ensuring
      long-term financial sustainability and governance.
    </p>
    <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
      {strategyPillars.map((p) => (
        <article key={p.title} className="py-3">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">{p.title}</h3>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">{p.body}</p>
        </article>
      ))}
    </div>
  </section>
);

//  Org Structure 
const OrgStructureSection = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 dark:bg-slate-900/40">
    <header className="text-center mb-8 sm:mb-10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 dark:text-red-300 mb-2">Meet our</p>
      <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200">Management Team</h2>
    </header>
    <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed text-center max-w-3xl mx-auto mb-10">
      Meet the leaders driving our mission and vision forward with dedication
      and expertise.
    </p>

    <Management />
  </section>
);

const BoardSection = () => (
  <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16 dark:bg-slate-900/40">
    <header className="text-center mb-8 sm:mb-10">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-600 dark:text-red-300 mb-2">Meet our</p>
      <h2 className="text-3xl sm:text-4xl font-serif font-semibold text-blue-800 dark:text-blue-200">Board of Management</h2>
    </header>
    <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl mx-auto text-center mb-10">
      Our Board of Management provides strategic oversight and governance,
      ensuring the hospital maintains the highest standards of care and
      operational excellence.
    </p>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
      {boardMembers.map((m) => (
        <article key={m.name} className="text-center">
          <div role="img" aria-label="Neutral profile placeholder" className="h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <div className="w-28 h-28 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <FaUser aria-hidden="true" className="text-5xl text-slate-400 dark:text-slate-500" />
            </div>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{m.name}</p>
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mt-1">
            {m.position}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{m.specialty}</p>
        </article>
      ))}
    </div>
  </section>
);

const sectionMap = {
  about: <AboutSection />,
  "mission-vision": <><MissionSection /><VisionSection /></>,
  strategy: <StrategySection />,
  "org-structure": <OrgStructureSection />,
  board: <BoardSection />,
};

const About = () => {
  const { hash } = useLocation();
  const requestedSection = hash.slice(1);
  const initialSection = menuItems.some((item) => item.id === requestedSection)
    ? requestedSection
    : "about";
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    setActiveSection(
      menuItems.some((item) => item.id === requestedSection) ? requestedSection : "about",
    );
  }, [requestedSection]);

  return (
    <div className="flex flex-col min-h-screen bg-canvas">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      {activeSection === "about" ? <HistoryHero /> : activeSection === "mission-vision" ? <MissionVisionHero /> : activeSection === "strategy" ? <StrategicPlanHero /> : activeSection === "org-structure" ? <ManagementTeamHero /> : activeSection === "board" ? <BoardHero /> : <Slider />}

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-6 py-8">
        <main className="min-w-0" aria-live="polite">
          {sectionMap[activeSection]}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default About;
