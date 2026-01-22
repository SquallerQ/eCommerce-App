import { Routes, Route, Navigate } from "react-router";
import App from "../App";
import LoginPage from "../pages/LoginPage/LoginPage";
import MainPage from "../pages/MainPage/mainPage";
import Catalog from "../pages/Catalog/Catalog";
import ProductPage from "../pages/ProductPage/ProductPage";
import { RegisterPage } from "../pages/RegisterPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { ProfilePage } from "../pages/ProfilePage";
import Cart from "../pages/Cart/Cart";
import { PublicRoute } from "./PublicRoute";
import { PrivateRoute } from "./PrivateRoute";
import AboutUs from "../pages/AboutUs/AboutUs";
import { ROUTES } from "./routes";

export const Router = () => {
  return (
    <Routes>
      <Route path={ROUTES.ROOT} element={<App />}>
        <Route index element={<Navigate to={ROUTES.MAIN} replace />} />
        <Route path={ROUTES.MAIN} element={<MainPage />} />

        <Route path={ROUTES.CATALOG} element={<Catalog />} />
        <Route path={ROUTES.PRODUCT} element={<ProductPage />} />
        <Route path={ROUTES.ABOUT_US} element={<AboutUs />} />
        <Route path={ROUTES.CART} element={<Cart />} />
        <Route element={<PublicRoute redirectTo={ROUTES.REDIRECT_ROOT} />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Route>

        <Route element={<PrivateRoute redirectTo={ROUTES.REDIRECT_ROOT} />}>
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
