import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./src/pages/Login";
import Order from "./src/pages/Order";
import Bill from "./src/pages/Bill";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/order" element={<Order />} />
        <Route path="/bill" element={<Bill />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;