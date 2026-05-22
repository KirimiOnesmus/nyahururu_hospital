import React, { useState } from "react";
import { Header, Footer, Slider, Management } from "../components/layouts";
import {
  FaHistory,
  FaBullseye,
  FaEye,
  FaChartLine,
  FaSitemap,
  FaUsers,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const menuItems = [
  { id: "about", label: "About Us — History", icon: FaHistory },
  { id: "mission", label: "Our Mission", icon: FaBullseye },
  { id: "vision", label: "Our Vision", icon: FaEye },
  { id: "strategy", label: "Strategic Plan", icon: FaChartLine },
  { id: "org-structure", label: "Management Team", icon: FaSitemap },
  { id: "board", label: "Board of Management", icon: FaUsers },
];

const strategyPillars = [
  {
    title: "Service Delivery",
    color: "border-blue-600",
    bg: "bg-blue-50",
    body: "Improving how patients receive care by enhancing quality, reducing waiting times, and expanding the range of services offered to ensure consistent, patient-centered healthcare.",
  },
  {
    title: "Health Workforce",
    color: "border-emerald-600",
    bg: "bg-emerald-50",
    body: "Recruiting, training, and retaining skilled staff while prioritising welfare, motivation, and continuous professional development to enhance performance.",
  },
  {
    title: "Health Information Systems",
    color: "border-violet-600",
    bg: "bg-violet-50",
    body: "Modernising hospital operations by digitising records, improving data accuracy, and strengthening reporting systems to support evidence-based decision-making.",
  },
  {
    title: "Access to Medicines & Technology",
    color: "border-orange-500",
    bg: "bg-orange-50",
    body: "Ensuring continuous availability of essential medicines, medical supplies, and functional equipment, including modern diagnostic and treatment technologies.",
  },
  {
    title: "Health Financing",
    color: "border-teal-600",
    bg: "bg-teal-50",
    body: "Strengthening financial sustainability through diversified revenue, improved insurance uptake, and efficient budgeting to reduce out-of-pocket patient payments.",
  },
  {
    title: "Leadership & Governance",
    color: "border-slate-600",
    bg: "bg-slate-50",
    body: "Strengthening accountability, transparent decision-making, inclusive management practices, and stakeholder engagement across the hospital.",
  },
  {
    title: "Infrastructure Development",
    color: "border-rose-600",
    bg: "bg-rose-50",
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

const SectionCard = ({
  icon: Icon,
  iconColor = "text-blue-600",
  title,
  children,
}) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-8">
    <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
      <Icon className={`text-2xl ${iconColor}`} />
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    </div>
    {children}
  </div>
);

// ── About ─────────────────────────────────────────────────────────────────────
const AboutSection = () => (
  <SectionCard icon={FaHistory} title="About Us — History">
    <div className="space-y-4 text-slate-700 leading-relaxed text-[0.97rem]">
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
  </SectionCard>
);

// ── Mission ───────────────────────────────────────────────────────────────────
const MissionSection = () => (
  <SectionCard icon={FaBullseye} title="Our Mission">
    <div className="border-l-4 border-blue-600 pl-6 py-2">
      <p className="text-slate-700 leading-relaxed text-[0.97rem]">
        To provide high-quality, accessible, and equitable healthcare services,
        meeting regional health needs and supporting public health initiatives.
      </p>
    </div>
  </SectionCard>
);

// ── Vision ────────────────────────────────────────────────────────────────────
const VisionSection = () => (
  <SectionCard icon={FaEye} iconColor="text-violet-600" title="Our Vision">
    <div className="border-l-4 border-violet-600 pl-6 py-2">
      <p className="text-slate-700 leading-relaxed text-[0.97rem]">
        To provide efficient and effective quality health services to all
        Kenyans.
      </p>
    </div>
  </SectionCard>
);

// ── Strategy ──────────────────────────────────────────────────────────────────
const StrategySection = () => (
  <SectionCard
    icon={FaChartLine}
    iconColor="text-emerald-600"
    title="Strategic Plan"
  >
    <p className="text-slate-700 leading-relaxed text-[0.97rem] mb-8">
      The NCRH Strategic Plan 2025–2029 outlines a roadmap to transform the
      hospital into a Level 5 regional referral facility through improved
      systems, infrastructure, and service capacity. Guided by Kenya's
      Constitution, Vision 2030, and broad stakeholder input, the plan
      emphasises modernising operations, expanding facilities, and ensuring
      long-term financial sustainability and governance.
    </p>
    <div className="grid md:grid-cols-2 gap-4">
      {strategyPillars.map((p) => (
        <div
          key={p.title}
          className={`${p.bg} border-l-4 ${p.color} rounded-xl p-5`}
        >
          <h4 className="font-bold text-slate-800 mb-1.5 text-sm">{p.title}</h4>
          <p className="text-slate-600 text-sm leading-relaxed">{p.body}</p>
        </div>
      ))}
    </div>
  </SectionCard>
);

// ── Org Structure ─────────────────────────────────────────────────────────────
const OrgStructureSection = () => (
  <SectionCard
    icon={FaSitemap}
    iconColor="text-indigo-600"
    title="Management Team"
  >
    <p className="text-slate-600 text-[0.97rem] leading-relaxed mb-8">
      Meet the leaders driving our mission and vision forward with dedication
      and expertise.
    </p>

    <div className="mb-8">
      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-5 text-center">
        Organisational Structure
      </h3>
      <div className="flex flex-col items-center gap-4">
        <div className="border-2 border-blue-600 rounded-xl px-8 py-3 text-center bg-white">
          <p className="font-bold text-slate-800 text-sm">
            Chief Executive Officer
          </p>
          <p className="text-xs text-slate-500">Hospital Director</p>
        </div>

        <div className="w-px h-5 bg-slate-300" />
        <div className="flex flex-wrap justify-center gap-3">
          {[
            "Medical Director",
            "Nursing Director",
            "Finance Director",
            "Operations Director",
          ].map((pos) => (
            <div
              key={pos}
              className="border border-slate-300 rounded-xl px-5 py-2.5 text-center bg-white"
            >
              <p className="font-semibold text-slate-700 text-xs">{pos}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="border-t border-slate-100 pt-6">
      <Management />
    </div>
  </SectionCard>
);

const BoardSection = () => (
  <SectionCard icon={FaUsers} title="Board of Management">
    <p className="text-slate-600 text-[0.97rem] leading-relaxed mb-8">
      Our Board of Management provides strategic oversight and governance,
      ensuring the hospital maintains the highest standards of care and
      operational excellence.
    </p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boardMembers.map((m) => (
        <div
          key={m.name}
          className="border border-slate-200 rounded-xl p-5 flex flex-col items-center text-center bg-white hover:border-blue-300 transition-colors duration-200"
        >
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
            <FaUsers className="text-xl text-white" />
          </div>
          <p className="font-bold text-slate-800 text-sm">{m.name}</p>
          <p className="text-xs font-semibold text-blue-600 mt-0.5">
            {m.position}
          </p>
          <p className="text-xs text-slate-500 mt-1">{m.specialty}</p>
        </div>
      ))}
    </div>
  </SectionCard>
);

const sectionMap = {
  about: <AboutSection />,
  mission: <MissionSection />,
  vision: <VisionSection />,
  strategy: <StrategySection />,
  "org-structure": <OrgStructureSection />,
  board: <BoardSection />,
};

const About = () => {
  const [activeSection, setActiveSection] = useState("about");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenuClick = (id) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <Header />
      </div>

      <Slider />

      <div className="flex flex-1 relative max-w-7xl mx-auto w-full px-4 md:px-6 py-8 gap-6 items-start">
        {/* Mobile toggle */}
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="md:hidden fixed bottom-8 left-5 z-40 bg-blue-600 text-white p-3.5 rounded-full shadow-lg"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`
            fixed md:sticky top-[72px] left-0 h-[calc(100vh-72px)] md:h-auto
            bg-white border-r border-slate-200 md:border md:border-slate-200
            md:rounded-2xl z-40 md:z-auto
            transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            w-64 md:w-60 overflow-y-auto shrink-0
          `}
        >
          <nav className="p-4 space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 px-3 pb-3 pt-1">
              Sections
            </p>
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleMenuClick(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-150 text-left ${
                  activeSection === id
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                }`}
              >
                <Icon className="text-base flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{sectionMap[activeSection]}</main>
      </div>

      <Footer />
    </div>
  );
};

export default About;
