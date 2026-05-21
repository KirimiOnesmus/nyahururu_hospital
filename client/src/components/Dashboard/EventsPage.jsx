import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../../api/axios";
import { MdEdit, MdDelete } from "react-icons/md";
import {
  FaSearch, FaPlus, FaImage, FaRegFileAlt, FaCalendarAlt,
  FaMapMarkerAlt, FaTimes, FaEye, FaCalendarCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";


const EMPTY_FORM = { title: "", description: "", date: "", venue: "", image: null };


const IMG_BASE = import.meta.env.VITE_BACKEND_URL?.replace("/api", "") || "http://localhost:5000";

const resolveImage = (url) => {
  if (!url) return null;
  return url.startsWith("http") || url.startsWith("blob:") ? url : `${IMG_BASE}${url}`;
};

const fmtDate = (d, opts = { day: "2-digit", month: "short", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-KE", opts) : "—";

const isUpcoming = (date) => new Date(date) >= new Date();


const StatCard = ({ label, value, accent, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
      <Icon className={`text-xl ${accent.icon}`} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-black ${accent.num}`}>{value}</p>
    </div>
  </div>
);

const Spinner = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-10 h-10 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    <p className="text-sm text-gray-400">Loading events…</p>
  </div>
);

const Empty = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-3">
    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
      <FaCalendarAlt className="text-2xl text-gray-300" />
    </div>
    <p className="text-sm text-gray-400">{text}</p>
  </div>
);

const Thumb = ({ url, title, size = "sm" }) => {
  const sizes = { sm: "w-14 h-14", lg: "w-full h-52" };
  const resolved = resolveImage(url);
  return resolved ? (
    <img src={resolved} alt={title} className={`${sizes[size]} object-cover rounded-xl shrink-0`} />
  ) : (
    <div className={`${sizes[size]} bg-gray-100 rounded-xl flex items-center justify-center shrink-0`}>
      <FaImage className="text-gray-300 text-lg" />
    </div>
  );
};


const Modal = ({ open, onClose, title, subtitle, children, maxW = "max-w-2xl" }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${maxW} max-h-[90vh] overflow-y-auto`}
        style={{ animation: "modalPop .22s cubic-bezier(.34,1.56,.64,1) both" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
            <FaTimes className="text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-shadow";


const EventsPage = () => {
  const [events,       setEvents]       = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData,     setFormData]     = useState(EMPTY_FORM);
  const [previewImage, setPreviewImage] = useState(null);
  const [viewModal,    setViewModal]    = useState(false);
  const [viewingEvent, setViewingEvent] = useState(null);

 
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/events");
      setEvents(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);


  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return events;
    return events.filter(e =>
      e.title?.toLowerCase().includes(q) ||

      e.venue?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  }, [events, search]);

  const stats = useMemo(() => ({
    total:    events.length,
    upcoming: events.filter(e => isUpcoming(e.date)).length,
    past:     events.filter(e => !isUpcoming(e.date)).length,
    withImage:events.filter(e => e.imageUrl).length,
  }), [events]);


  const openModal = (event = null) => {
    setEditingEvent(event);
    setFormData(event
      ? {
          title:       event.title       || "",
          description: event.description || "",
          date:        event.date ? event.date.split("T")[0] : "",
          venue:       event.venue || event.location || "",
          image:       null,
        }
      : EMPTY_FORM
    );
    setPreviewImage(event?.imageUrl ? resolveImage(event.imageUrl) : null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
    if (previewImage?.startsWith("blob:")) URL.revokeObjectURL(previewImage);
    setPreviewImage(null);
    setModalOpen(false);
  };

  const setField = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    if (previewImage?.startsWith("blob:")) URL.revokeObjectURL(previewImage);
    setField("image", file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim())       { toast.error("Title is required"); return; }
    if (!formData.date)               { toast.error("Date is required"); return; }
    if (!formData.venue.trim())       { toast.error("Venue is required"); return; }
    if (!formData.description.trim()) { toast.error("Description is required"); return; }

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("title",       formData.title.trim());
      payload.append("description", formData.description.trim());
      payload.append("date",        formData.date);
      payload.append("venue",       formData.venue.trim());
      if (formData.image) payload.append("image", formData.image);

      const cfg = { headers: { "Content-Type": "multipart/form-data" } };

      if (editingEvent) {
        await api.put(`/events/${editingEvent._id}`, payload, cfg);
        toast.success("Event updated");
      } else {
        await api.post("/events", payload, cfg);
        toast.success("Event created");
      }
      closeModal();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error saving event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success("Event deleted");
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Error deleting event");
    }
  };

  const openView = (event) => { setViewingEvent(event); setViewModal(true); };

  return (
    <div className="min-h-screen bg-[#f8f7f5]">
      <style>{`
        @keyframes modalPop {
          from { opacity:0; transform:scale(0.94) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);    }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        .fade-up { animation: fadeUp .3s ease both; }
        .line-clamp-2 { display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">


        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 fade-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <FaCalendarAlt className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Events Management</h1>
              <p className="text-xs text-gray-400">Create, edit, and manage all hospital events</p>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 cursor-pointer"
          >
            <FaPlus className="text-xs" /> Add Event
          </button>
        </div>

  
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total"      value={stats.total}     icon={FaRegFileAlt}    accent={{ bg:"bg-blue-50",    icon:"text-blue-500",    num:"text-blue-600"    }} />
          <StatCard label="Upcoming"   value={stats.upcoming}  icon={FaCalendarCheck} accent={{ bg:"bg-emerald-50", icon:"text-emerald-500", num:"text-emerald-600" }} />
          <StatCard label="Past"       value={stats.past}      icon={FaCalendarAlt}   accent={{ bg:"bg-gray-100",   icon:"text-gray-400",    num:"text-gray-600"    }} />
          <StatCard label="With Image" value={stats.withImage} icon={FaImage}         accent={{ bg:"bg-violet-50",  icon:"text-violet-500",  num:"text-violet-600"  }} />
        </div>

       
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title or venue…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>
          {search && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 self-center shrink-0">
              <span className="font-semibold text-gray-700">{filtered.length}</span> of {events.length}
              <button onClick={() => setSearch("")} className="ml-1 text-gray-300 hover:text-rose-400 cursor-pointer">
                <FaTimes />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : filtered.length === 0 ? (
            <Empty text={search ? "No events match your search" : "No events yet"} />
          ) : (
            <>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Banner", "Event", "Date", "Venue", "Actions"].map((h, i) => (
                        <th key={h} className={`px-5 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${i === 4 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(ev => {
                      const upcoming = isUpcoming(ev.date);
  
                      const venue = ev.venue || ev.location || "—";
                      return (
                        <tr key={ev._id} className="hover:bg-gray-50/80 transition-colors group">

                     
                          <td className="px-5 py-4"><Thumb url={ev.imageUrl} title={ev.title} /></td>

                          <td className="px-5 py-4 max-w-xs">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 line-clamp-2">{ev.title}</p>
                              <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${upcoming ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                {upcoming ? "Upcoming" : "Past"}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-1">{ev.description}</p>
                          </td>

                   
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaCalendarAlt className="text-gray-300 shrink-0" />{fmtDate(ev.date)}
                            </span>
                          </td>

                         
                          <td className="px-5 py-4">
                            <span className="flex items-center gap-1.5 text-xs text-gray-600">
                              <FaMapMarkerAlt className="text-gray-300 shrink-0" />{venue}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openView(ev)}
                                className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer transition-colors" title="View">
                                <FaEye className="text-sm" />
                              </button>
                              <button onClick={() => openModal(ev)}
                                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors" title="Edit">
                                <MdEdit className="text-sm" />
                              </button>
                              <button onClick={() => handleDelete(ev._id)}
                                className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer transition-colors" title="Delete">
                                <MdDelete className="text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                  <p className="text-xs text-gray-400">
                    Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of <span className="font-semibold text-gray-600">{events.length}</span> events
                  </p>
                </div>
              </div>

  
              <div className="md:hidden space-y-3 p-4">
                {filtered.map(ev => {
                  const venue = ev.venue || ev.location || "—";
                  const upcoming = isUpcoming(ev.date);
                  return (
                    <div key={ev._id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-4">
                      <Thumb url={ev.imageUrl} title={ev.title} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm line-clamp-2">{ev.title}</p>
                          <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${upcoming ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {upcoming ? "Upcoming" : "Past"}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <FaCalendarAlt className="text-gray-300" />{fmtDate(ev.date)}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <FaMapMarkerAlt className="text-gray-300" />{venue}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => openView(ev)} className="p-2 rounded-xl text-blue-500 hover:bg-blue-50 cursor-pointer"><FaEye /></button>
                        <button onClick={() => openModal(ev)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 cursor-pointer"><MdEdit /></button>
                        <button onClick={() => handleDelete(ev._id)} className="p-2 rounded-xl text-rose-400 hover:bg-rose-50 cursor-pointer"><MdDelete /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>


      <Modal
        open={viewModal}
        onClose={() => setViewModal(false)}
        title="Event Preview"
        maxW="max-w-3xl"
      >
        {viewingEvent && (() => {
          const venue = viewingEvent.venue || viewingEvent.location || "—";
          const upcoming = isUpcoming(viewingEvent.date);
          return (
            <>
              <Thumb url={viewingEvent.imageUrl} title={viewingEvent.title} size="lg" />
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <h3 className="text-xl font-black text-gray-900 flex-1">{viewingEvent.title}</h3>
                  <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${upcoming ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {upcoming ? "Upcoming" : "Past"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <FaCalendarAlt className="text-blue-400 text-[10px]" />Date
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(viewingEvent.date, { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-rose-400 text-[10px]" />Venue
                    </p>
                    <p className="text-sm font-semibold text-gray-800">{venue}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{viewingEvent.description}</p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => setViewModal(false)}
                    className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                    Close
                  </button>
                  <button onClick={() => { setViewModal(false); openModal(viewingEvent); }}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 cursor-pointer">
                    <MdEdit /> Edit
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </Modal>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingEvent ? "Edit Event" : "New Event"}
        subtitle={editingEvent ? "Update event details" : "Create a new hospital event"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Event Title" required>
            <input
              name="title" value={formData.title}
              onChange={e => setField("title", e.target.value)}
              placeholder="e.g., World Health Day Conference"
              className={inputCls} required
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" required>
              <input
                type="date" name="date" value={formData.date}
                onChange={e => setField("date", e.target.value)}
                className={inputCls} required
              />
            </Field>
            <Field label="Venue" required>
              <input
                name="venue" value={formData.venue}
                onChange={e => setField("venue", e.target.value)}
                placeholder="e.g., Main Conference Hall"
                className={inputCls} required
              />
            </Field>
          </div>

          <Field label="Description" required>
            <textarea
              name="description" value={formData.description}
              onChange={e => setField("description", e.target.value)}
              placeholder="Describe the event, agenda, and what attendees can expect…"
              rows={5} className={`${inputCls} resize-none`} required
            />
          </Field>

          <Field label="Event Banner (optional)">
            {previewImage && (
              <div className="relative mb-3 group/img">
                <img src={previewImage} alt="Preview" className="w-full h-44 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => {
                    if (previewImage.startsWith("blob:")) URL.revokeObjectURL(previewImage);
                    setPreviewImage(null);
                    setField("image", null);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow text-gray-500 hover:text-rose-500 cursor-pointer opacity-0 group-hover/img:opacity-100 transition-opacity"
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
            <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 transition-colors">
              <FaImage className="text-gray-300 text-lg shrink-0" />
              <span className="text-sm text-gray-400 truncate">
                {formData.image ? formData.image.name : "Click to upload banner (JPG, PNG, WEBP · max 5 MB)"}
              </span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </Field>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={closeModal}
              className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 cursor-pointer transition-colors shadow-sm shadow-blue-200">
              {submitting
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <>{editingEvent ? "Update Event" : "Create Event"}</>
              }
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventsPage;