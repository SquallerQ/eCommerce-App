import { Outlet } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./global.css";
import Footer from "./components/footer/footer";
import Header from "./components/Header";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Header />
        <Outlet />
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
