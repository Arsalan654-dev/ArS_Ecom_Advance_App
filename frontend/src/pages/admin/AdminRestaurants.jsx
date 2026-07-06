import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../../config/api";
import { toast } from "react-toastify";
import { MdStore, MdCheckCircle, MdCancel, MdRefresh, MdSearch, MdVisibility } from "react-icons/md";

const AdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchRestaurants();
  }, [pagination.currentPage, statusFilter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (search) params.append("search", search);
      params.append("page", pagination.currentPage);
      params.append("limit", "20");

      const res = await axios.get(`${API_URL}/api/admin/restaurants?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setRestaurants(res.data.restaurants || []);
      setPagination(prev => ({ ...prev, totalPages: res.data.pagination?.totalPages || 1, totalItems: res.data.pagination?.totalItems || 0 }));
    } catch (error) {
      toast.error("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/admin/restaurants/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      toast.success(res.data.message);
      fetchRestaurants();
      if (selectedRestaurant?._id === id) {
        setSelectedRestaurant(res.data.restaurant);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    }
  };

  const viewDetails = async (id) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setSelectedRestaurant({ ...res.data.restaurant, foodItems: res.data.foodItems });
    } catch (error) {
      toast.error("Failed to load restaurant details");
    } finally {
      setDetailLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      suspended: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">Restaurant Management</h1>
          <p className="text-gray-500 text-sm mt-1">Approve, reject, or manage restaurants</p>
        </div>
        <button onClick={fetchRestaurants} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <MdRefresh size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "suspended", ""].map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPagination(prev => ({ ...prev, currentPage: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </button>
          ))}
        </div>
        <div className="flex-1 relative">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search restaurants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRestaurants()}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Restaurants List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
                ) : restaurants.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">No restaurants found</td></tr>
                ) : restaurants.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{r.businessName}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{r.owner?.fullName || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => viewDetails(r._id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <MdVisibility size={16} />
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(r._id, "approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Approve">
                              <MdCheckCircle size={16} />
                            </button>
                            <button onClick={() => handleStatusChange(r._id, "rejected")} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Reject">
                              <MdCancel size={16} />
                            </button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <button onClick={() => handleStatusChange(r._id, "suspended")} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Suspend">
                            Suspend
                          </button>
                        )}
                        {r.status === "suspended" && (
                          <button onClick={() => handleStatusChange(r._id, "approved")} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Reactivate">
                            Reactivate
                          </button>
                        )}
                      </div>
                    </td>
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
                >
                  Previous
                </button>
                <button
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Detail */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          {detailLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-32 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ) : selectedRestaurant ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{selectedRestaurant.businessName}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedRestaurant.status)}`}>
                {selectedRestaurant.status}
              </span>
              <div className="text-sm space-y-2">
                <p><span className="text-gray-500">Owner:</span> {selectedRestaurant.owner?.fullName}</p>
                <p><span className="text-gray-500">Email:</span> {selectedRestaurant.email}</p>
                <p><span className="text-gray-500">Phone:</span> {selectedRestaurant.phone}</p>
                <p><span className="text-gray-500">Cuisines:</span> {selectedRestaurant.cuisines?.join(", ")}</p>
                <p><span className="text-gray-500">City:</span> {selectedRestaurant.mainAddress?.city}</p>
              </div>
              {selectedRestaurant.foodItems?.length > 0 && (
                <div>
                  <p className="font-medium text-sm mt-4 mb-2">Menu Items ({selectedRestaurant.foodItems.length})</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {selectedRestaurant.foodItems.map(fi => (
                      <div key={fi._id} className="text-sm flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
                        <span>{fi.name}</span>
                        <span className="text-violet-600">₨ {fi.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedRestaurant.status === "pending" && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleStatusChange(selectedRestaurant._id, "approved")} className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                    Approve
                  </button>
                  <button onClick={() => handleStatusChange(selectedRestaurant._id, "rejected")} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <MdStore size={48} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Select a restaurant to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRestaurants;
