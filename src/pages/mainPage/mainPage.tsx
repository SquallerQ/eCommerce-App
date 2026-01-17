import { Toaster } from "react-hot-toast";
import "./MainPage.css";

const MainPage = () => {
  return (
    <div className="page-container">
      <Toaster />
      <main className="main">
        <h2>Main Page</h2>
        <div className="coupon-info">
          <p>
            Use promo code <span className="coupon-code">SAVE10</span> at checkout to get a
            <strong> 10% discount </strong>
            on your order!
          </p>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
