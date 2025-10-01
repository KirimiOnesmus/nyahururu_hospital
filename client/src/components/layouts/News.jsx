import React,{useState} from 'react'
import newsData from '../../data/newsData'
import { useNavigate } from 'react-router-dom'

const News = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4;

  const startIndex = currentPage * itemsPerPage;
  const visibleNews = newsData.slice(startIndex, startIndex + itemsPerPage);

  const hasNext = startIndex + itemsPerPage < newsData.length;
  const hasPrev = currentPage > 0;

  return (
    <div className="news my-8 mx-6">
   

      
      <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleNews.map((item) => (
          <div
            key={item.id}
            onClick={() => navigate(`/news/${item.id}`)}
       
            className="rounded-2xl shadow-md p-4 bg-white hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <img
              src={item.image}
              alt={item.title}
              className="rounded-lg mb-3 h-40 w-full object-cover"
            />
            <h4 className="font-bold text-lg mb-2">{item.title}</h4>
           
          </div>
        ))}
      </div>

     
      <div className="flex justify-center items-center mt-6 gap-4">
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={!hasPrev}
          className={`px-6 py-2 rounded-lg font-bold ${
            hasPrev
              ? "bg-blue-500 text-white hover:bg-white hover:text-blue-500 border border-blue-500 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Previous
        </button>

        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={!hasNext}
          className={`px-6 py-2 rounded-lg font-bold ${
            hasNext
              ? "bg-blue-500 text-white hover:bg-white hover:text-blue-500 border border-blue-500 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default News