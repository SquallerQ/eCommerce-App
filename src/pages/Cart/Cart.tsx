import { useState } from "react";
import { useCart } from "../../context/cartContext";
import { changeLineItemQuantity, applyDiscountCode } from "../../utils/api";
import {
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import "./Cart.css";

const Cart = () => {
  const { cart, setCart, totalLineItemQuantity } = useCart();
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({});
  const [isClearing, setIsClearing] = useState(false);
  const [openClearDialog, setOpenClearDialog] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const handleQuantityChange = async (
    lineItemId: string,
    currentQuantity: number,
    action: "increment" | "decrement"
  ) => {
    if (!cart) return;
    setIsUpdating((prev) => ({ ...prev, [lineItemId]: true }));
    try {
      const newQuantity = action === "increment" ? currentQuantity + 1 : currentQuantity - 1;
      const updatedCart = await changeLineItemQuantity(cart.id, lineItemId, newQuantity);
      setCart(updatedCart);
    } catch (error) {
      console.error(`Cart: Error updating quantity for ${lineItemId}:`, error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [lineItemId]: false }));
    }
  };

  const handleRemoveItem = async (lineItemId: string) => {
    if (!cart) return;
    setIsUpdating((prev) => ({ ...prev, [lineItemId]: true }));
    try {
      const updatedCart = await changeLineItemQuantity(cart.id, lineItemId, 0);
      setCart(updatedCart);
    } catch (error) {
      console.error(`Cart: Error removing item ${lineItemId}:`, error);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [lineItemId]: false }));
    }
  };

  const handleOpenClearDialog = () => {
    setOpenClearDialog(true);
  };

  const handleCloseClearDialog = () => {
    setOpenClearDialog(false);
  };

  const handleClearCart = async () => {
    if (!cart || cart.lineItems.length === 0) return;
    setIsClearing(true);
    try {
      let updatedCart = { ...cart };
      for (const item of cart.lineItems) {
        updatedCart = await changeLineItemQuantity(cart.id, item.id, 0);
      }
      setCart(updatedCart);
    } catch (error) {
      console.error("Cart: Error clearing cart:", error);
    } finally {
      setIsClearing(false);
      setOpenClearDialog(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!cart || !promoCode.trim()) {
      toast.error("Please enter a promo code", { duration: 3000 });
      return;
    }
    setIsApplyingPromo(true);
    try {
      const updatedCart = await applyDiscountCode(cart.id, cart.version, promoCode);
      setCart(updatedCart);
      toast.success("Promo code applied successfully!", { duration: 3000 });
      setPromoCode("");
    } catch {
      toast.error("Invalid promo code", { duration: 3000 });
    } finally {
      setIsApplyingPromo(false);
    }
  };

  if (!cart || cart.lineItems.length === 0) {
    return (
      <div className="cart-container">
        <Toaster />
        <Typography variant="h4" className="cart-title">
          Shopping Cart
        </Typography>
        <Typography variant="body1" className="cart-empty">
          Your cart is empty.{" "}
          <Link to="/catalog" className="cart-empty-link">
            Start shopping now!
          </Link>
        </Typography>
      </div>
    );
  }

  const originalTotalPrice = cart.lineItems.reduce((sum, item) => {
    const price = item.price.discounted?.value.centAmount || item.price.value.centAmount;
    return sum + item.quantity * price;
  }, 0);

  const discountedTotalPrice =
    cart.discountOnTotalPrice?.discountedAmount?.centAmount &&
    typeof cart.discountOnTotalPrice.discountedAmount.centAmount === "number"
      ? originalTotalPrice - cart.discountOnTotalPrice.discountedAmount.centAmount
      : originalTotalPrice;

  return (
    <div className="cart-container">
      <Toaster />
      <Typography variant="h4" className="cart-title">
        Shopping Cart
      </Typography>
      <Typography variant="body1" className="cart-total">
        Total Items: {totalLineItemQuantity}
      </Typography>
      <div className="cart-items">
        {cart.lineItems.map((item) => {
          return (
            <div key={item.id} className="cart-item">
              {isUpdating[item.id] && <CircularProgress size={20} className="cart-item-loading" />}
              <img
                src={item.variant.images?.[0]?.url || "/placeholder.png"}
                alt={item.name["en-GB"]}
                className="cart-item-image"
              />
              <span className="cart-item-name">{item.name["en-GB"]}</span>
              <div className="cart-item-price">
                {item.price.discounted ? (
                  <>
                    <span className="price-original">£{(item.price.value.centAmount / 100).toFixed(2)}</span>
                    <span className="price-discounted">
                      £{(item.price.discounted.value.centAmount / 100).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="price-regular">£{(item.price.value.centAmount / 100).toFixed(2)}</span>
                )}
              </div>
              <span className="cart-item-total">
                £
                {(
                  (item.quantity * (item.price.discounted?.value.centAmount || item.price.value.centAmount)) /
                  100
                ).toFixed(2)}
              </span>
              <div className="cart-item-quantity">
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity, "decrement")}
                  disabled={isUpdating[item.id] || isClearing || isApplyingPromo}
                  className="quantity-button"
                >
                  −
                </button>
                <span className="quantity-value">{item.quantity}</span>
                <button
                  onClick={() => handleQuantityChange(item.id, item.quantity, "increment")}
                  disabled={isUpdating[item.id] || isClearing || isApplyingPromo}
                  className="quantity-button"
                >
                  +
                </button>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={isUpdating[item.id] || isClearing || isApplyingPromo}
                  className="remove-button"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt={3}>
        <Typography variant="h6" className="cart-total-price">
          Total Price:
          {cart.discountOnTotalPrice?.discountedAmount?.centAmount &&
          typeof cart.discountOnTotalPrice.discountedAmount.centAmount === "number" ? (
            <>
              <span className="price-original"> £{(originalTotalPrice / 100).toFixed(2)}</span>
              <span className="price-discounted"> £{(discountedTotalPrice / 100).toFixed(2)}</span>
            </>
          ) : (
            <span className="price-regular"> £{(originalTotalPrice / 100).toFixed(2)}</span>
          )}
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={handleOpenClearDialog}
          disabled={isClearing || isApplyingPromo}
          className="clear-cart-button"
        >
          Clear Shopping Cart
        </Button>
      </Box>
      <Box display="flex" alignItems="center" gap={2} mt={2} className="promo-code-container">
        <TextField
          label="Promo Code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          disabled={isApplyingPromo || isClearing}
          className="promo-code-input"
          size="small"
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyPromoCode}
          disabled={isApplyingPromo || isClearing || !promoCode.trim()}
          className="apply-promo-button"
        >
          {isApplyingPromo ? <CircularProgress size={20} /> : "Apply"}
        </Button>
      </Box>
      <Dialog
        open={openClearDialog}
        onClose={handleCloseClearDialog}
        aria-labelledby="clear-cart-dialog-title"
        aria-describedby="clear-cart-dialog-description"
      >
        <DialogTitle id="clear-cart-dialog-title">Clear Shopping Cart</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-cart-dialog-description">
            Are you sure you want to remove all items from your shopping cart?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClearDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClearCart} color="error" autoFocus>
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Cart;
