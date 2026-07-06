// frontend/src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import API_URL from "../config/api";
import { MdLocationOn, MdLocalOffer } from "react-icons/md";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, restaurantId, fetchCart, clearCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("Please login to checkout");
      navigate("/signin");
      return;
    }
    fetchCart(); // Refresh cart data from backend
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/address`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      setAddresses(res.data.addresses || []);
      const defaultAddr = res.data.addresses?.find(a => a.isDefault);
      setSelectedAddress(defaultAddr || res.data.addresses?.[0]);
      
    } catch (error) {
      console.error("Fetch addresses error:", error);
      toast.error("Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.price || item.foodItem?.price || 0;
    const quantity = item.quantity || 1;
    return sum + (price * quantity);
  }, 0);
  
  const deliveryFee = 50;
  const total = subtotal + deliveryFee - promoDiscount;

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }
    
    if (!restaurantId) {
      toast.error("Restaurant information not available");
      return;
    }
    
    setApplyingPromo(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/api/promo-code/validate`,
        {
          code: promoCode,
          restaurantId: restaurantId,
          orderValue: subtotal
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      if (res.data.success) {
        setPromoDiscount(res.data.promoCode.finalDiscount);
        setAppliedPromoCode(promoCode);
        toast.success(`Promo code applied! You saved ₨ ${res.data.promoCode.finalDiscount}`);
      }
    } catch (error) {
      console.error("Promo error:", error);
      toast.error(error.response?.data?.error || "Invalid or expired promo code");
      setPromoDiscount(0);
      setAppliedPromoCode("");
    } finally {
      setApplyingPromo(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPlacing(true);
    try {
      const token = localStorage.getItem("token");
      
      const res = await axios.post(
        `${API_URL}/api/orders`,
        {
          addressId: selectedAddress._id,
          promoCode: appliedPromoCode || null,
          paymentMethod: paymentMethod
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      if (res.data.paymentRequired) {
        // Online payment - redirect to payment page
        navigate(`/payment/${res.data.order._id}`, {
          state: { clientSecret: res.data.clientSecret }
        });
      } else {
        // ✅ COD - Immediately clear cart
        toast.success("Order placed successfully!");
        
        // Clear cart from backend
        await clearCart();
        
        // Refresh cart context to update UI
        await fetchCart();
        
        // Navigate to order tracking
        navigate(`/order-tracking/${res.data.order._id}`);
      }
      
    } catch (error) {
      console.error("Place order error:", error);
      toast.error(error.response?.data?.error || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Your cart is empty</p>
        <button
          onClick={() => navigate("/shop")}
          className="mt-4 px-6 py-2 bg-violet-600 text-white rounded-lg"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Delivery Address</h2>
              <button
                onClick={() => navigate("/address-book")}
                className="text-sm text-violet-600 hover:text-violet-700"
              >
                + Add New
              </button>
            </div>
            <div className="space-y-3">
              {addresses.map((addr) => (
                <label key={addr._id} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddress?._id === addr._id}
                    onChange={() => setSelectedAddress(addr)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{addr.receiverName}</span>
                      {addr.isDefault && <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">Default</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{addr.fullAddress}</p>
                    <p className="text-sm text-gray-500">📞 {addr.phoneNumber}</p>
                  </div>
                </label>
              ))}
              {addresses.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No addresses found. Please add a delivery address.
                </p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when you receive your order</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                />
                <div>
                  <p className="font-medium">Credit / Debit Card</p>
                  <p className="text-sm text-gray-500">Pay online securely with Stripe</p>
                </div>
              </label>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Promo Code</h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Enter promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
              />
              <button
                onClick={applyPromoCode}
                disabled={applyingPromo}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
              >
                {applyingPromo ? "Applying..." : "Apply"}
              </button>
            </div>
            {promoDiscount > 0 && (
              <p className="mt-2 text-sm text-green-600">
                Promo code "{appliedPromoCode}" applied! Discount: -₨ {promoDiscount}
              </p>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 h-fit sticky top-24">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>₨ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee</span>
              <span>₨ {deliveryFee}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>- ₨ {promoDiscount}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-violet-600">₨ {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button
            onClick={placeOrder}
            disabled={placing || addresses.length === 0}
            className="w-full mt-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;