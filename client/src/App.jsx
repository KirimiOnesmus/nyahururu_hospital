import { BrowserRouter,Route,Routes } from 'react-router-dom'
import {Doctors, Home, Services, About} from "./pages/index"
import { ServiceDetails } from './components/modals'

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
        <Route path='services/:id' element={<ServiceDetails/>}/>

      </Routes>
    </BrowserRouter>
      
    </>
  )
}

export default App
