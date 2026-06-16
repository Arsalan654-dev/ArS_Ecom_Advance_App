import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../../config/api";
import FreeMapPicker from "../../components/FreeMapPicker";
import {
  MdUpload,
  MdDelete,
  MdAddPhotoAlternate,
  MdSave,
  MdCancel,
  MdStore,
} from "react-icons/md";

const RestaurantSetup = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    businessName: "",
    description: "",
    cuisines: [],
    phone: "",
    email: "",
    mainAddress: {
      fullAddress: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      latitude: null,
      longitude: null,
      placeId: null,
    },
  });
  const [cuisineInput, setCuisineInput] = useState("");
  const [bannerImages, setBannerImages] = useState([]);
  const [logoImage, setLogoImage] = useState(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/restaurant`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (res.data.restaurant) {
        setRestaurant(res.data.restaurant);
        setFormData({
          businessName: res.data.restaurant.businessName || "",
          description: res.data.restaurant.description || "",
          cuisines: res.data.restaurant.cuisines || [],
          phone: res.data.restaurant.phone || "",
          email: res.data.restaurant.email || "",
          mainAddress: res.data.restaurant.mainAddress || {
            fullAddress: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
            latitude: null,
            longitude: null,
            placeId: null,
          },
        });
        setBannerImages(res.data.restaurant.bannerImages || []);
        setLogoImage(res.data.restaurant.logoImage || null);
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load restaurant data");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (locationData) => {
    setFormData((prev) => ({
      ...prev,
      mainAddress: {
        fullAddress: locationData.address || prev.mainAddress.fullAddress,
        landmark: prev.mainAddress.landmark,
        city: locationData.addressComponents?.city || prev.mainAddress.city,
        state: locationData.addressComponents?.state || prev.mainAddress.state,
        pincode: locationData.addressComponents?.pincode || prev.mainAddress.pincode,
        latitude: locationData.lat,
        longitude: locationData.lng,
        placeId: locationData.placeId,
      },
    }));
  };

  const addCuisine = () => {
    if (cuisineInput.trim() && !formData.cuisines.includes(cuisineInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        cuisines: [...prev.cuisines, cuisineInput.trim()],
      }));
      setCuisineInput("");
    }
  };

  const removeCuisine = (cuisine) => {
    setFormData((prev) => ({
      ...prev,
      cuisines: prev.cuisines.filter((c) => c !== cuisine),
    }));
  };

  const uploadImage = async (file, type) => {
    const formDataImg = new FormData();
    formDataImg.append("image", file);
    formDataImg.append("imageType", type);

    const token = localStorage.getItem("token");
    const res = await axios.post(`${API_URL}/api/restaurant/upload-images`, formDataImg, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
      withCredentials: true,
    });

    return res.data.restaurant;
  };

  const handleBannerUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (bannerImages.length + files.length > 5) {
      toast.error("Maximum 5 banner images allowed");
      return;
    }

    setUploadingBanner(true);
    try {
      for (const file of files) {
        const updatedRestaurant = await uploadImage(file, "banner");
        setBannerImages(updatedRestaurant.bannerImages);
        toast.success("Banner image uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload banner image");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const updatedRestaurant = await uploadImage(file, "logo");
      setLogoImage(updatedRestaurant.logoImage);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      let res;

      if (restaurant) {
        res = await axios.put(`${API_URL}/api/restaurant`, formData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Restaurant updated successfully!");
      } else {
        res = await axios.post(`${API_URL}/api/restaurant`, formData, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Restaurant created successfully! Waiting for admin approval.");
      }

      // Update user data in localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      user.businessName = formData.businessName;
      localStorage.setItem("user", JSON.stringify(user));

      fetchRestaurant();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save restaurant");
    } finally {
      setSaving(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {restaurant ? "Restaurant Settings" : "Create Your Restaurant"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {restaurant
            ? "Manage your restaurant details, images, and location"
            : "Set up your restaurant to start accepting orders"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cuisines
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cuisineInput}
                  onChange={(e) => setCuisineInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCuisine())}
                  placeholder="e.g., Pakistani, Chinese, BBQ"
                  className="flex-1 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  type="button"
                  onClick={addCuisine}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.cuisines.map((cuisine) => (
                  <span
                    key={cuisine}
                    className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs flex items-center gap-1"
                  >
                    {cuisine}
                    <button
                      type="button"
                      onClick={() => removeCuisine(cuisine)}
                      className="hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Restaurant Location</h2>
          <FreeMapPicker
            onLocationSelect={handleAddressSelect}
            initialLat={formData.mainAddress.latitude || 24.8607}
            initialLng={formData.mainAddress.longitude || 67.0011}
            initialAddress={formData.mainAddress.fullAddress}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Address</label>
              <input
                type="text"
                value={formData.mainAddress.fullAddress || ""}
                readOnly
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Landmark (Optional)</label>
              <input
                type="text"
                value={formData.mainAddress.landmark || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mainAddress: { ...prev.mainAddress, landmark: e.target.value },
                  }))
                }
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>

          {/* Logo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Restaurant Logo</label>
            <div className="flex items-center gap-4">
              {logoImage ? (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={logoImage.url} alt="Logo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {/* Handle logo removal */}}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <MdDelete size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <MdStore size={32} className="text-gray-400" />
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </button>
            </div>
          </div>

          {/* Banner Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Banner Images (Max 5)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
              {bannerImages.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img src={img.url} alt={`Banner ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                  >
                    <MdDelete size={12} />
                  </button>
                </div>
              ))}
              {bannerImages.length < 5 && (
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  className="aspect-video rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center hover:border-violet-500 transition"
                >
                  <MdAddPhotoAlternate size={24} className="text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Banner</span>
                </button>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            <MdSave size={18} />
            {saving ? "Saving..." : restaurant ? "Update Restaurant" : "Create Restaurant"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantSetup;