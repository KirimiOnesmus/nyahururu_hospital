import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { Header, Footer } from "../components/layouts";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaUsers,
  FaChevronRight,
} from "react-icons/fa";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

 
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const [allEventsRes, upcomingRes] = await Promise.all([
        api.get("/events"),
        api.get("/events/upcoming"),
      ]);

      setEvents(allEventsRes.data);
      setUpcomingEvents(upcomingRes.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: "2-digit", minute: "2-digit" };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };


  const EventCard = ({ event }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
     
      {event.image && (
        <div className="h-48 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

   
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>

        <p className="text-gray-600 mb-4 line-clamp-2">
          {event.description?.slice(0, 70)}...
        </p>

        <div className="space-y-2 mb-4 text-gray-700">
          <div className="flex items-center">
            <FaCalendarAlt className="w-4 h-4 mr-2 text-blue-600" />
            <span>{formatDate(event.date)}</span>
          </div>

          {event.time && (
            <div className="flex items-center">
              <FaClock className="w-4 h-4 mr-2 text-blue-600" />
              <span>{formatTime(event.date)}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center">
              <FaMapMarkerAlt className="w-4 h-4 mr-2 text-blue-600" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setSelectedEvent(event)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition-colors"
        >
          View Details
          <FaChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
         <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
           <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
             <Header />
           </div>
           <div className="min-h-screen flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
               <p className="text-gray-600 font-medium text-lg">
                 Loading Events...
               </p>
             </div>
           </div>
           <Footer />
         </div>
    );
  }

  const displayEvents = activeTab === "all" ? events : upcomingEvents;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 space-y-10">
 
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-600">Discover and join our upcoming events</p>
        </div>

    
        <div className="border-b border-gray-200">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-4 px-1 border-b-2 font-medium ${
                activeTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              All Events ({events.length})
            </button>

            <button
              onClick={() => setActiveTab("upcoming")}
              className={`pb-4 px-1 border-b-2 font-medium ${
                activeTab === "upcoming"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500"
              }`}
            >
              Upcoming ({upcomingEvents.length})
            </button>
          </div>
        </div>

   
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayEvents.map((event) => {
            const id = event._id || event.id;
            return <EventCard key={id} event={event} />;
          })}
        </div>
      </div>

      <Footer />

      {/* MODAL ONLY */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-6 relative">

            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
            >
              X
            </button>

            
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {selectedEvent.title}
            </h2>

            
            {selectedEvent.image && (
              <img
                src={selectedEvent.image}
                alt="event"
                className="rounded-lg mb-4 w-full h-56 object-cover"
              />
            )}

          
            <p className="text-gray-700 mb-4">{selectedEvent.description}</p>

           
            <div className="space-y-3 text-gray-700">
              <div className="flex items-center">
                <FaCalendarAlt className="mr-2 text-blue-600" />
                {formatDate(selectedEvent.date)}
              </div>

              {selectedEvent.time && (
                <div className="flex items-center">
                  <FaClock className="mr-2 text-blue-600" />
                  {formatTime(selectedEvent.date)}
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-blue-600" />
                  {selectedEvent.location}
                </div>
              )}

              {selectedEvent.capacity && (
                <div className="flex items-center">
                  <FaUsers className="mr-2 text-blue-600" />
                  Capacity: {selectedEvent.capacity}
                </div>
              )}
            </div>

            <div className="text-right mt-6">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
