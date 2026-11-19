import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { ASSET_BASE_URL } from "../../config/env";
import { Header, Footer } from "../../common/layouts";
import { FaStethoscope, FaCheckCircle, FaHospital, FaTags, FaArrowLeft } from "react-icons/fa";

const formatKes = (value) => value == null ? "Price to be confirmed" : `KES ${Number(value).toLocaleString()}`;
const divisionLabel = (division) => division === "Specialist Clinics" ? "Clinics (Specialized Clinics)" : division;
const ITEMS_PER_PAGE = 5;

function ItemPagination({ page, pages, onChange, label }) {
  if (pages <= 1) return null;
  return <nav className="mt-4 flex items-center justify-between gap-3" aria-label={`${label} pagination`}>
    <span className="text-xs text-slate-500">Page {page} of {pages}</span>
    <div className="flex gap-2">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
    </div>
  </nav>;
}

const ServiceDetails = () => {
  const { id: slug } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupPages, setGroupPages] = useState([1, 1]);

  useEffect(() => setGroupPages([1, 1]), [slug]);

  useEffect(() => {
    let active = true;
    api.get(`/services/${slug}`).then(({ data }) => { if (active) setService(data); })
      .catch(() => { if (active) setError("Failed to load service details."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  const Shell = ({ children }) => <div className="min-h-screen flex flex-col bg-canvas">
    <div className="sticky top-0 z-50 bg-surface border-b border-line"><Header /></div>
    <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">{children}</main><Footer />
  </div>;
  const backButton = <button onClick={() => navigate("/services")} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-8"><FaArrowLeft /> Back to Services</button>;

  if (loading) return <Shell>{backButton}<div className="py-28 text-center text-slate-500">Loading service details…</div></Shell>;
  if (error || !service) return <Shell>{backButton}<div className="py-28 text-center"><FaStethoscope className="mx-auto text-3xl text-red-400" /><h2 className="mt-4 text-xl font-bold text-slate-800">Service Not Found</h2><p className="mt-2 text-slate-500">{error || "The service you're looking for doesn't exist or has been removed."}</p></div></Shell>;

  const covered = (service.items || []).filter((item) => item.shaCovered);
  const uncovered = (service.items || []).filter((item) => !item.shaCovered);
  const priceLists = [["Services covered by SHA", covered], ["Services not covered by SHA", uncovered]];
  const pageItems = (items, groupIndex) => {
    const pageCount = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
    const currentPage = Math.min(groupPages[groupIndex], pageCount);
    return { pageCount, currentPage, items: items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE) };
  };

  return <Shell>
    {backButton}
    <article>
      {service.imageUrl && <img src={`${ASSET_BASE_URL}${service.imageUrl}`} alt={service.name} className="w-full max-h-[420px] object-cover rounded-2xl mb-8" />}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"><FaHospital /> {divisionLabel(service.division)}</span>
        {service.category && <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"><FaTags /> {service.category}</span>}
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{service.name}</h1>
      <p className="mt-4 max-w-4xl text-slate-600 leading-relaxed whitespace-pre-line">{service.description}</p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        {priceLists.map(([heading, items], groupIndex) => {
          const page = pageItems(items, groupIndex);
          return <section key={heading}>
          <div className="flex items-center gap-2 mb-4"><FaCheckCircle className={heading.includes("not") ? "text-slate-400" : "text-emerald-600"} /><h2 className="text-lg font-bold text-slate-800">{heading}</h2><span className="text-sm text-slate-400">{items.length}</span></div>
          {items.length ? <ul className="divide-y divide-slate-200">
            {page.items.map((item) => <li key={item.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 py-3">
              <span className="text-sm text-slate-700">{item.name}</span>
              <span className="sm:text-right text-xs text-slate-500">Cash/mobile: {formatKes(item.cashPrice)}{item.shaCovered ? <><br />SHA: {formatKes(item.shaPrice)}</> : null}</span>
            </li>)}
          </ul> : <p className="text-sm text-slate-500">No services listed in this group.</p>}
          <ItemPagination page={page.currentPage} pages={page.pageCount} label={heading} onChange={(nextPage) => setGroupPages((current) => current.map((value, index) => index === groupIndex ? nextPage : value))} />
        </section>;
        })}
      </div>
      <div className="mt-12 py-8 text-center border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Ready to get started?</h2>
        <p className="mt-2 text-sm text-slate-500">Book an appointment or explore other hospital services.</p>
        <button onClick={() => navigate("/appointment")} className="mt-5 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Book an appointment</button>
      </div>
    </article>
  </Shell>;
};

export default ServiceDetails;
