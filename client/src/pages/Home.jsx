import React from "react";
import { Header, Footer } from "../components/layouts";
import Slider from "../components/layouts/Slider";

const Home = () => {
  return (
    <div className="py-4 px-4">
      <div>
        <Header />
      </div>
        <div className="sections">
          <div className="slider ">
            <Slider/>
          </div>

        </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Home;
