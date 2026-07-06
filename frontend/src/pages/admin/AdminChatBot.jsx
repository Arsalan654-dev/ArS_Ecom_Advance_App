import React, { useState, useEffect } from "react";
import axios from "axios";
import API_URL from "../../config/api";
import { toast } from "react-toastify";
import { MdSmartToy, MdSave, MdRefresh } from "react-icons/md";

const AdminChatBot = () => {
  const [instructions, setInstructions] = useState("");
  const [originalInstructions, setOriginalInstructions] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    fetchInstructions();
  }, []);

  const fetchInstructions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/chatbot/admin/instructions`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setInstructions(res.data.instructions);
      setOriginalInstructions(res.data.instructions);
      setUpdatedAt(res.data.updatedAt);
    } catch (error) {
      toast.error("Failed to load chatbot instructions");
    } finally {
      setLoading(false);
    }
  };

  const saveInstructions = async () => {
    if (!instructions.trim()) {
      toast.error("Instructions cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(`${API_URL}/api/chatbot/admin/instructions`,
        { instructions },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      setOriginalInstructions(res.data.instructions);
      setUpdatedAt(res.data.updatedAt);
      toast.success("Chatbot instructions updated successfully!");
    } catch (error) {
      toast.error("Failed to save instructions");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = instructions !== originalInstructions;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
        <div className="h-96 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <MdSmartToy className="text-violet-600" /> VingoBot Settings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure the AI chatbot's behavior and instructions
            {updatedAt && (
              <span className="ml-2 text-xs text-gray-400">
                Last updated: {new Date(updatedAt).toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInstructions} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
            <MdRefresh size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">System Instructions</h2>
          <p className="text-sm text-gray-500">
            These instructions define how VingoBot behaves and responds to users.
            You can set rules, tone, and what information the bot should provide.
          </p>
        </div>

        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={16}
          className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
          placeholder="Enter chatbot instructions..."
        />

        <div className="flex justify-between items-center mt-4">
          <p className="text-xs text-gray-400">
            The chatbot will use these instructions along with user context data to provide personalized responses.
          </p>
          <button
            onClick={saveInstructions}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            <MdSave size={18} />
            {saving ? "Saving..." : "Save Instructions"}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl p-6 text-white">
        <h3 className="font-semibold mb-2">How VingoBot Works</h3>
        <ul className="space-y-2 text-sm text-violet-100">
          <li>• Uses Gemini AI with your custom instructions</li>
          <li>• For logged-in users: provides personalized data (orders, cart, etc.)</li>
          <li>• For restaurant owners: shows their restaurant orders and menu</li>
          <li>• For delivery boys: shows their delivery information</li>
          <li>• Anyone can look up orders by Order ID or Email</li>
          <li>• Responds in the same language as the user (Urdu/English)</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminChatBot;
