import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../../config/api";
import { toast } from "react-toastify";
import { MdPayment, MdRefresh, MdStore, MdPerson, MdSearch, MdDownload, MdTrendingUp, MdAccountBalance, MdAttachMoney } from "react-icons/md";

const AdminPayments = () => {
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("transactions");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });

  useEffect(() => {
    if (activeTab === "transactions") fetchTransactions();
    else fetchEarnings();
  }, [activeTab, pagination.currentPage]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", pagination.currentPage);
      params.append("limit", "20");
      if (search) params.append("status", search);

      const res = await axios.get(`${API_URL}/api/admin/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setTransactions(res.data.transactions || []);
      setPagination(prev => ({ ...prev, totalPages: res.data.pagination?.totalPages || 1, totalItems: res.data.pagination?.totalItems || 0 }));
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/platform-earnings?period=monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setEarnings(res.data.earnings || []);
    } catch (error) {
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      preparing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      payment_pending: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Payments & Earnings</h1>
          <p className="text-gray-500 text-sm mt-1">View transactions, platform fees, and payouts</p>
        </div>
        <button onClick={() => { activeTab === "transactions" ? fetchTransactions() : fetchEarnings(); }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <MdRefresh size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => { setActiveTab("transactions"); setPagination(prev => ({ ...prev, currentPage: 1 })); }}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "transactions"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <MdPayment className="inline mr-1.5" size={16} /> Transactions
        </button>
        <button
          onClick={() => setActiveTab("earnings")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            activeTab === "earnings"
              ? "border-violet-600 text-violet-600"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <MdTrendingUp className="inline mr-1.5" size={16} /> Platform Earnings
        </button>
      </div>

      {activeTab === "transactions" && (
        <>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Filter by status (pending, paid, failed)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchTransactions()}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Customer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Restaurant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Payment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Platform Fee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Restaurant Payout</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">No transactions found</td></tr>
                  ) : transactions.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">#{t._id?.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm">{t.customer?.fullName || "N/A"}</td>
                      <td className="px-4 py-3 text-sm">{t.restaurant?.businessName || "N/A"}</td>
                      <td className="px-4 py-3 text-sm font-medium">₨ {t.totalAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(t.status)}`}>{t.status}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600">₨ {t.platformFee?.toLocaleString() || "0"}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">₨ {t.restaurantEarnings?.toLocaleString() || "0"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500">
                <span>{pagination.totalItems} total</span>
                <div className="flex gap-2">
                  <button
                    disabled={pagination.currentPage === 1}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >Previous</button>
                  <button
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "earnings" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MdTrendingUp className="text-violet-500" size={20} /> Monthly Platform Earnings
            </h3>
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-gray-200 dark:bg-gray-800" />)}
              </div>
            ) : earnings.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center">No earnings data yet</p>
            ) : (
              <div className="space-y-2">
                {earnings.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {e._id?.year}-{String(e._id?.month || 1).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-gray-500">{e.count} orders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-violet-600">₨ {e.platformFee?.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Revenue: ₨ {e.totalRevenue?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <MdAccountBalance size={24} />
                <h3 className="font-semibold">Total Collected Revenue</h3>
              </div>
              <p className="text-3xl font-bold mt-2">
                ₨ {earnings.reduce((sum, e) => sum + (e.totalRevenue || 0), 0).toLocaleString()}
              </p>
              <p className="text-violet-200 text-sm mt-1">All time platform revenue</p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-2 mb-2">
                <MdAttachMoney size={20} className="text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Total Platform Fees</h3>
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₨ {earnings.reduce((sum, e) => sum + (e.platformFee || 0), 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">10% platform commission on all orders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
