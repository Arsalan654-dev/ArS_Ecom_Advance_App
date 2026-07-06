// frontend/src/pages/Cart.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";
import { MdDelete, MdAdd, MdRemove, MdShoppingCart } from "react-icons/md";

const Cart = () => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.info("Please login to view your cart");
            navigate("/signin");
            return;
        }
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get(`${API_URL}/api/cart`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            setCart(res.data.cart);
        } catch (error) {
            toast.error("Failed to load cart");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            const token = localStorage.getItem("token");
            if (quantity <= 0) {
                await axios.delete(`${API_URL}/api/cart/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true,
                });
            } else {
                await axios.put(
                    `${API_URL}/api/cart/${itemId}`,
                    { quantity },
                    { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
                );
            }
            fetchCart();
        } catch (error) {
            toast.error("Failed to update cart");
        }
    };

    const removeItem = async (itemId) => {
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${API_URL}/api/cart/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });
            fetchCart();
            toast.success("Item removed");
        } catch (error) {
            toast.error("Failed to remove item");
        }
    };

    if (loading) {
        return <div className="animate-pulse">Loading cart...</div>;
    }

    if (!cart?.items?.length) {
        return (
            <div className="text-center py-12">
                <MdShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Your cart is empty</h2>
                <p className="text-gray-500 mt-2">Add some delicious items to your cart</p>
                <button
                    onClick={() => navigate("/shop")}
                    className="mt-4 px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
                >
                    Browse Restaurants
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Your Cart
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item) => (
                        <div key={item._id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-4">
                            {item.foodItem?.images?.[0] && (
                                <img src={item.foodItem.images[0].url} alt={item.foodItem.name} className="w-20 h-20 rounded-lg object-cover" />
                            )}
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">{item.foodItem?.name}</h3>
                                <p className="text-sm text-gray-500">{item.foodItem?.category?.name}</p>
                                <p className="text-lg font-bold text-violet-600 mt-1">₨ {item.foodItem?.price}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <button
                                        onClick={() => updateQuantity(item.foodItem._id, item.quantity - 1)}
                                        className="p-2 hover:bg-gray-200 rounded-l-lg"
                                    >
                                        <MdRemove size={16} />
                                    </button>
                                    <span className="w-8 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.foodItem._id, item.quantity + 1)}
                                        className="p-2 hover:bg-gray-200 rounded-r-lg"
                                    >
                                        <MdAdd size={16} />
                                    </button>
                                </div>
                                <button onClick={() => removeItem(item.foodItem._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <MdDelete size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 h-fit sticky top-24">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-semibold">₨ {cart.totalAmount?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Fee</span>
                            <span className="font-semibold">₨ {cart.deliveryFee || 50}</span>
                        </div>
                        {cart.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount</span>
                                <span>- ₨ {cart.discount}</span>
                            </div>
                        )}
                        <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-violet-600">₨ {(cart.totalAmount + (cart.deliveryFee || 50) - (cart.discount || 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/checkout")}
                        className="w-full mt-6 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg transition"
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;