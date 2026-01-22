import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./authContext";
import { Cart } from "@commercetools/platform-sdk";
import { getOrCreateCustomerCart, getAnonymousCart, createAnonymousCart } from "../utils/api";

interface CartContextType {
  cart: Cart | null;
  setCart: React.Dispatch<React.SetStateAction<Cart | null>>;
  totalLineItemQuantity: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [totalLineItemQuantity, setTotalLineItemQuantity] = useState(0);

  const loadCart = async () => {
    try {
      if (isLoggedIn) {
        const accessToken = localStorage.getItem("access_token");
        if (accessToken) {
          const customerCart = await getOrCreateCustomerCart(accessToken);
          setCart(customerCart);
        } else {
          setCart(null);
        }
      } else {
        const anonymousCartId = localStorage.getItem("anonymousCartId");
        if (anonymousCartId) {
          const anonymousCart = await getAnonymousCart(anonymousCartId);
          if (anonymousCart) {
            setCart(anonymousCart);
          } else {
            const newCart = await createAnonymousCart();
            localStorage.setItem("anonymousCartId", newCart.id);
            setCart(newCart);
          }
        } else {
          setCart(null);
        }
      }
    } catch {
      setCart(null);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isLoggedIn]);

  useEffect(() => {
    const quantity = cart?.lineItems.reduce((sum, item) => sum + item.quantity, 0) || 0;
    setTotalLineItemQuantity(quantity);
  }, [cart]);

  return <CartContext.Provider value={{ cart, setCart, totalLineItemQuantity }}>{children}</CartContext.Provider>;
};
