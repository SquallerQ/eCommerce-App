import { Outlet } from "react-router";
import { AuthProvider } from "./context/authContext";
import { CartProvider } from "./context/cartContext";
import "./global.css";
import Footer from "./components/Footer/Footer";
import Header from "./components/Header/Header";

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
