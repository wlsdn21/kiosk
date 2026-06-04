import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OrderType from './routes/OrderType'
import Menu from './routes/Menu'
import ItemDetail from './routes/ItemDetail'
import Cart from './routes/Cart'
import Checkout from './routes/Checkout'
import Success from './routes/Success'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OrderType />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </BrowserRouter>
  )
}
