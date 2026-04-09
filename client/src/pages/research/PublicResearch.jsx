import React, { useState, useEffect } from "react";
import { Header, Footer } from "../../components/layouts";
import {
  FaSearch,
  FaDownload,
  FaFileAlt,
  FaUserAlt,
  FaUniversity,
  FaCalendarAlt,
  FaBookOpen,
  FaChevronDown,
  FaChevronUp,
  FaMobileAlt,
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaFilter,
  FaSortAmountDown,
} from "react-icons/fa";

const MOCK_RESEARCH = [
  {
    id: "1",
    title:
      "Impact of Climate Change on Agricultural Productivity in the Rift Valley",
    author: "Dr. Amina Wanjiku",
    institution: "Egerton University",
    category: "Agriculture",
    year: 2024,
    abstract:
      "This study examines the long-term effects of shifting rainfall patterns and rising temperatures on smallholder farming communities across the Rift Valley region. Using satellite data and field surveys conducted between 2019 and 2023, the research identifies critical vulnerability zones and proposes adaptive strategies for sustainable food production.",
    downloadPrice: 150,
    downloads: 342,
    pages: 48,
  },
  {
    id: "2",
    title:
      "Mobile Money Adoption and Financial Inclusion Among Rural Youth in Kenya",
    author: "Prof. James Kariuki",
    institution: "University of Nairobi",
    category: "Economics",
    year: 2024,
    abstract:
      "An analysis of M-Pesa usage patterns among 18–30 year-olds in rural Kenya, this paper explores barriers to formal banking and how mobile payment platforms bridge the financial inclusion gap. Survey data from 1,200 respondents across five counties informs policy recommendations for expanding digital financial services.",
    downloadPrice: 200,
    downloads: 218,
    pages: 62,
  },
  {
    id: "3",
    title:
      "Traditional Medicinal Plants and Their Pharmacological Properties in Central Kenya",
    author: "Dr. Grace Muthoni",
    institution: "Kenyatta University",
    category: "Health",
    year: 2023,
    abstract:
      "Documenting over 80 plant species used by traditional healers in Nyeri, Murang'a and Kirinyaga counties, this ethnobotanical study cross-references folk medicinal use with laboratory-confirmed pharmacological activity. Findings suggest several candidates for further clinical investigation in wound healing and antimicrobial applications.",
    downloadPrice: 150,
    downloads: 487,
    pages: 55,
  },
  {
    id: "4",
    title:
      "Urban Planning Challenges and Housing Affordability in Secondary Kenyan Towns",
    author: "Eng. Peter Njoroge",
    institution: "Technical University of Kenya",
    category: "Urban Planning",
    year: 2023,
    abstract:
      "Secondary towns like Nyahururu, Nyeri and Nakuru face rapid population growth without corresponding infrastructure expansion. This paper models housing demand over a 20-year horizon, assesses current zoning frameworks, and proposes evidence-based interventions to prevent informal settlement proliferation.",
    downloadPrice: 100,
    downloads: 156,
    pages: 39,
  },
  {
    id: "5",
    title:
      "Water Resource Management and Community Governance in Semi-Arid Laikipia",
    author: "Dr. Sarah Njoki",
    institution: "Mount Kenya University",
    category: "Environment",
    year: 2024,
    abstract:
      "Drawing on three years of participatory action research with pastoralist communities, this study evaluates the effectiveness of water user associations in managing scarce water resources during prolonged dry seasons. The paper develops a governance scorecard applicable to similar semi-arid contexts across East Africa.",
    downloadPrice: 150,
    downloads: 93,
    pages: 44,
  },
  {
    id: "6",
    title:
      "Digital Literacy and Secondary School Performance in Rural Laikipia County",
    author: "Ms. Ruth Wambui",
    institution: "Laikipia University",
    category: "Education",
    year: 2024,
    abstract:
      "This quantitative study measures the correlation between computer lab access, teacher ICT proficiency, and national examination results across 60 secondary schools in Laikipia County. The findings reveal significant disparities between urban-proximate and remote schools and recommend a targeted digital literacy intervention framework.",
    downloadPrice: 100,
    downloads: 204,
    pages: 36,
  },
];

const CATEGORIES = [
  "All",
  "Agriculture",
  "Economics",
  "Health",
  "Urban Planning",
  "Environment",
  "Education",
];

const CATEGORY_STYLES = {
  Agriculture: { bg: "bg-green-100", text: "text-green-700" },
  Economics: { bg: "bg-blue-100", text: "text-blue-700" },
  Health: { bg: "bg-red-100", text: "text-red-700" },
  "Urban Planning": { bg: "bg-yellow-100", text: "text-yellow-700" },
  Environment: { bg: "bg-teal-100", text: "text-teal-700" },
  Education: { bg: "bg-purple-100", text: "text-purple-700" },
};

const formatPhone = (v) => {
  const d = v.replace(/\D/g, "");
  if (d.startsWith("0")) return d.slice(0, 10);
  if (d.startsWith("254")) return d.slice(0, 12);
  return d.slice(0, 10);
};

const PaymentModal = ({ research, onClose, onSuccess }) => {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState("form"); // form | processing | success
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Please enter a valid Safaricom number e.g. 0712 345 678");
      return;
    }
    setError("");
    setStep("processing");
    try {
      const res = await fetch("/api/mpesa/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: digits.startsWith("0") ? "254" + digits.slice(1) : digits,
          amount: research.downloadPrice,
          researchId: research.id,
          type: "download",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Payment failed");
      setStep("success");
      setTimeout(() => {
        onSuccess(research.id);
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message);
      setStep("form");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 
      backdrop-blur-sm animate-fadeIn"
      onClick={(e) =>
        e.target === e.currentTarget && step === "form" && onClose()
      }
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md 
      p-8 relative animate-slideUp"
      >
        {step === "form" && (
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-red-600 
            transition-colors cursor-pointer"
          >
            <FaTimes size={20} />
          </button>
        )}

        {step === "processing" && (
          <div className="text-center py-6">
            <FaSpinner className="text-5xl text-blue-600 mx-auto mb-5 animate-spin" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Check Your Phone
            </h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              An M-Pesa STK Push has been sent to{" "}
              <span className="font-semibold text-gray-800">{phone}</span>.
              <br />
              Enter your PIN to complete the payment.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FaCheckCircle className="text-3xl text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Payment Confirmed!
            </h3>
            <p className="text-gray-500 text-sm">
              Your download will begin shortly.
            </p>
          </div>
        )}

        {step === "form" && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FaDownload className="text-blue-600 text-sm" />
              </div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                Download Paper
              </span>
            </div>

            <h3 className="text-md font-bold text-gray-900  mb-5 line-clamp-2">
              {research.title}
            </h3>

            <div className="bg-gray-100 rounded-xl p-4 mb-5 flex items-center justify-between border border-blue-100">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  KES {research.downloadPrice}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">via</p>
                <p className="text-base font-bold text-green-600 flex items-center gap-1">
                  <FaMobileAlt /> M-Pesa
                </p>
              </div>
            </div>

            <label className="block mb-5">
              <span className="text-sm font-semibold text-gray-700 mb-1.5 block">
                Safaricom Number
              </span>
              <input
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className={`w-full px-4 py-3 rounded-lg border text-gray-900
                     placeholder-gray-400 outline-none
                    text-base focus:outline-none focus:ring focus:ring-blue-500 transition-all ${
                  error
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              />
              {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
            </label>

            <button
              onClick={handlePay}
              className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700
               text-white font-bold py-3.5 rounded-xl transition-all duration-200
                hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center 
                justify-center gap-2 text-base cursor-pointer"
            >
              <FaMobileAlt />
              Pay KES {research.downloadPrice} via M-Pesa
            </button>

            <p className="text-center text-xs text-gray-400 mt-3 leading-relaxed">
              You'll receive an STK Push on your phone.
              <br />A receipt will be emailed after confirmation.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

//resesarch card component
const ResearchCard = ({ item, onDownload }) => {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORY_STYLES[item.category] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-100
     shadow-sm hover:shadow-md transition-all duration-200
      flex flex-col"
    >
      <div className="p-6 flex flex-col gap-3 flex-grow">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full ${cat.bg} ${cat.text}`}
          >
            {item.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <FaCalendarAlt className="text-gray-300" />
            {item.year}
          </span>
        </div>

        <h3 className="font-bold text-gray-900 text-[15px] leading-snug">
          {item.title}
        </h3>

        {/* Author + Institution */}
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <FaUserAlt className="text-blue-400 text-[11px] flex-shrink-0" />
            <span className="font-medium">{item.author}</span>
          </p>
          <p className="flex items-center gap-2 text-xs text-gray-400">
            <FaUniversity className="text-gray-300 text-[11px] flex-shrink-0" />
            {item.institution}
          </p>
        </div>

        <div>
          <p
            className={`text-sm text-gray-500 leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
          >
            {item.abstract}
          </p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 
            text-xs font-semibold mt-2 transition-colors hover:cursor-pointer"
          >
            {expanded ? (
              <>
                <FaChevronUp className="text-[10px]" /> Show less
              </>
            ) : (
              <>
                <FaChevronDown className="text-[10px]" /> Read more
              </>
            )}
          </button>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-gray-50 rounded-b-xl">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <FaFileAlt className="text-gray-300" /> {item.pages} pages
          </span>
          <span className="flex items-center gap-1.5">
            <FaDownload className="text-gray-300" />{" "}
            {item.downloads.toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => onDownload(item)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700
           active:bg-blue-800 text-white text-sm font-bold px-6 py-2 cursor-pointer
           rounded-lg transition-all duration-200 hover:-translate-y-0.5 
           shadow-sm hover:shadow-md"
        >
          <FaDownload className="text-xs" />
          KES {item.downloadPrice}
        </button>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3 animate-pulse">
    <div className="flex justify-between">
      <div className="h-5 w-24 bg-gray-100 rounded-full" />
      <div className="h-4 w-10 bg-gray-100 rounded" />
    </div>
    <div className="h-4 w-full bg-gray-100 rounded" />
    <div className="h-4 w-3/4 bg-gray-100 rounded" />
    <div className="h-4 w-1/2 bg-gray-100 rounded" />
    <div className="space-y-1.5 pt-1">
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
      <div className="h-4 w-24 bg-gray-100 rounded" />
      <div className="h-8 w-28 bg-gray-100 rounded-lg" />
    </div>
  </div>
);

const PublicResearch = () => {
  const [research, setResearch] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedItem, setSelectedItem] = useState(null);
  const [unlockedIds, setUnlockedIds] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setResearch(MOCK_RESEARCH);
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(t);
  }, []);

  const filtered = research
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        (category === "All" || r.category === category) &&
        (r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.abstract.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.year - a.year;
      if (sortBy === "downloads") return b.downloads - a.downloads;
      if (sortBy === "price-asc") return a.downloadPrice - b.downloadPrice;
      return 0;
    });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white/60 backdrop-blur-md shadow-sm">
        <Header />
      </div>

      <main className="flex-grow">
        <section className="relative bg-blue-700 text-white overflow-hidden">
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full 
          translate-x-1/3 -translate-y-1/3 pointer-events-none"
          />

          <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm font-semibold mb-5 backdrop-blur-sm">
              <FaBookOpen className="text-green-300" />
              Open Research Repository
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
              Discover Research.
              <br />
              <span className="text-green-500">Download Knowledge.</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-xl mx-auto leading-relaxed mb-8">
              Browse peer-reviewed papers from Kenyan institutions. Abstracts
              are free. Pay per download to access full papers and support local
              research.
            </p>

            <div className="relative max-w-lg mx-auto">
              <FaSearch
                className="absolute left-4 top-1/2 -translate-y-1/2
               text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by title, author, or keyword…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-white text-gray-800
                 placeholder-gray-400 text-base focus:outline-none focus:ring-2 
                 focus:ring-green-300 shadow-md transition-all duration-200"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-gray-100 shadow-sm">
          <div
            className="max-w-6xl mx-auto py-4 md:flex 
           items-center gap-6 justify-end px-6 "
          >
            <div className="flex items-center gap-4 md:p-0 py-2 ">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-sm text-gray-600 border border-gray-200 rounded-md 
                p-3 bg-white focus:outline-none focus:ring focus:ring-blue-400 
                cursor-pointer w-full md:w-auto"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.filter((cat) => cat !== "All").map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 ">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm text-gray-600 border border-gray-200 rounded-md 
                p-3 bg-white focus:outline-none focus:ring focus:ring-blue-400 
                cursor-pointer w-full md:w-auto"
              >
                <option value="newest">Newest first</option>
                <option value="downloads">Most downloaded</option>
                <option value="price-asc">Price: low to high</option>
              </select>
            </div>
          </div>
        </section>

       
        <section className="max-w-6xl mx-auto px-6 py-8">
          {!isLoading && (
            <p className="text-sm text-gray-400 mb-5">
              Showing{" "}
              <span className="font-semibold text-gray-600">
                {filtered.length}
              </span>{" "}
              {filtered.length === 1 ? "paper" : "papers"}
              {category !== "All" && (
                <span className="text-blue-500 font-medium">
                  {" "}
                  in {category}
                </span>
              )}
              {search && (
                <span className="text-blue-500 font-medium">
                  {" "}
                  for "{search}"
                </span>
              )}
            </p>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaSearch className="text-gray-300 text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No papers found
                </h3>
                <p className="text-gray-400 text-sm">
                  Try adjusting your search or selecting a different category.
                </p>
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                  className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              filtered.map((item) => (
                <ResearchCard
                  key={item.id}
                  item={item}
                  onDownload={setSelectedItem}
                />
              ))
            )}
          </div>
        </section>
      </main>

      <Footer />

      {selectedItem && (
        <PaymentModal
          research={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={(id) => setUnlockedIds((prev) => [...prev, id])}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease;
        }
        .animate-slideUp {
          animation: slideUp 0.25s ease;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PublicResearch;
