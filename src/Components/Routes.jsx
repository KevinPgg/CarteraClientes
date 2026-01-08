// src/components/Routes.jsx
import { BrowserRouter, Routes as RRDRoutes, Route } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext";
import MainLayout from "../Layout/MainLayout";
import Home from "../Pages/Home";
import Shop from "../Pages/Shop";
import Cart from "../Pages/Cart";
import Login from "../Pages/Login";
import Account from "../Pages/Account";
import ProductDetails from "../Pages/ProductDetails";
import OrderConfirmation from "../Pages/OrderConfirmation";

export default function Routes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainLayout>
          <RRDRoutes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          </RRDRoutes>
        </MainLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}