import { useEffect, useState, useCallback } from "react";
import { FaMapMarkerAlt, FaCalendarAlt, FaTimes } from "react-icons/fa";
import api from "../../api/axios";

const SLIDE_INTERVAL = 30000;

const EventOverlay = () => {
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/events");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const active = res.data.filter(
          (e) => new Date(e.date) >= today
        );
        if (active.length > 0) {
          setEvents(active);
          setVisible(true);
        }
      } catch (err) {
        // silently fail — overlay is non-critical
      }
    };
    fetchEvents();
  }, []);

  const goTo = useCallback(
    (idx) => {
      setFading(true);
      setTimeout(() => {
        setCurrent(idx);
        setFading(false);
      }, 300);
    },
    []
  );

  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      goTo((current + 1) % events.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [events.length, current, goTo]);

  if (!visible || events.length === 0) return null;

  const ev = events[current];

  const formatDate = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => setVisible(false)}
    >
      <div
        className="relative w-full max-w-xl mx-4 h-[90vh] rounded-2xl overflow-hidden bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
   
        <button
          type="button"
          aria-label="Close events overlay"
          onClick={() => setVisible(false)}
          className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-black/40
                     flex items-center justify-center text-white hover:text-red-600 hover:bg-transparent transition-colors cursor-pointer"
        >
          <FaTimes className="text-md" />
        </button>


        <div
          className={`relative  overflow-hidden transition-opacity duration-300 h-full w-full ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          {ev.image && (
            <img
              src={`${BACKEND_URL}${ev.image}`}
              alt={ev.title}
              className="w-full h-full object-cover"
            />
          )}
         
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>


        {/* <div
          className={`px-5 py-4 transition-opacity duration-300 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-lg font-bold text-slate-800 mb-3">{ev.title}</p>
          <div className="flex flex-col gap-2 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600 shrink-0" />
              {formatDate(ev.date)}
            </span>
            {ev.location && (
              <span className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-blue-600 shrink-0" />
                {ev.location}
              </span>
            )}
          </div>
        </div> */}

      
        {events.length > 1 && (
          <div className="flex items-center justify-center gap-2 pb-4">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to event ${i + 1}`}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 h-2 bg-blue-600"
                    : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventOverlay;