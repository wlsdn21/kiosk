import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import OrderType from './routes/OrderType'
import Menu from './routes/Menu'
import ItemDetail from './routes/ItemDetail'
import Cart from './routes/Cart'
import Checkout from './routes/Checkout'
import Success from './routes/Success'
import PageTransition from './components/PageTransition'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><OrderType /></PageTransition>} />
        <Route path="/menu" element={<PageTransition><Menu /></PageTransition>} />
        <Route path="/item/:id" element={<PageTransition><ItemDetail /></PageTransition>} />
        <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
        <Route path="/checkout" element={<PageTransition><Checkout /></PageTransition>} />
        <Route path="/success" element={<PageTransition><Success /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
