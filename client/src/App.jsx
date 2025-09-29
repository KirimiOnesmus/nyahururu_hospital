import { BrowserRouter,Route,Routes } from 'react-router-dom'
import {Doctors, Home, Services, About} from "./pages/index"

import './App.css'

function App() {
 

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path ="/about" element={<About/>}/>
        <Route path ="/services" element={<Services/>}/>
        <Route path ="/doctors" element={<Doctors/>}/>

      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App
