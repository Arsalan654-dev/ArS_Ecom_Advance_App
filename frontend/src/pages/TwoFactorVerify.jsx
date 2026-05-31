import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import API_URL from "../config/api";

export const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const [challengeToken, setChallengeToken] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("twoFactorChallengeToken");
    const storedEmail = sessionStorage.getItem("twoFactorEmail");
    const expiry = sessionStorage.getItem("twoFactorExpiresAt");

    if (!token || !storedEmail) {
      toast.error("Session expired. Please login again.");
      navigate("/signin");
      return;
    }

    setChallengeToken(token);
    setEmail(storedEmail);
    setExpiresAt(expiry);

    const interval = setInterval(() => {
      if (expiry) {
        const remaining = Math.max(0, Math.floor((new Date(expiry).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setResendDisabled(false);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter valid 6-digit code");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/two-factor/login/verify`,
        {
          challengeToken: challengeToken,
          otp: otp,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        localStorage.clear();
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        sessionStorage.removeItem("twoFactorChallengeToken");
        sessionStorage.removeItem("twoFactorEmail");
        sessionStorage.removeItem("twoFactorExpiresAt");
        sessionStorage.removeItem("isGoogleTwoFactor");

        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("2FA Error:", error);
      const errorMsg = error.response?.data?.error || "Invalid code";
      if (error.response?.data?.expired) {
        toast.warning("Code expired. Resending...");
        setResendDisabled(false);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendDisabled(true);
    setResendCountdown(60);

    try {
      const response = await axios.post(
        `${API_URL}/api/auth/two-factor/login/resend`,
        {
          challengeToken,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        sessionStorage.setItem("twoFactorExpiresAt", response.data.expiresAt);
        setExpiresAt(response.data.expiresAt);
        toast.success("New code sent! Check app console/email.");

        const timer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to resend code");
      setResendDisabled(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4 text-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full">
        <h1 className="text-2xl font-extrabold text-center text-violet-600 mb-4 tracking-tight">Two-Factor Auth</h1>

        <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800 rounded-lg p-4 mb-5 text-violet-800 dark:text-violet-200 text-xs leading-relaxed">
          <p>Please type the verification code sent to:</p>
          <p className="font-bold my-1 text-violet-950 dark:text-violet-100">{email}</p>
          <p className="text-[10px] text-violet-600 dark:text-violet-400">
            For local testing, finding 2FA OTP printed in the **dev execution terminal logs** is extremely fast!
          </p>
          {timeLeft > 0 && (
            <p className="mt-2 text-xs">
              Expires in: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider mb-1.5">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-center text-xl font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-violet-500"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || !otp || otp.length !== 6}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold p-2.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Verifying..." : "Verify & Login"}
        </button>

        <div className="flex justify-between items-center text-xs mt-4">
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-violet-600 hover:text-violet-700 disabled:text-gray-400 font-semibold cursor-pointer"
          >
            {resendDisabled ? `Resend in ${resendCountdown}s` : "Resend Code"}
          </button>

          <button onClick={() => navigate("/signin")} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 cursor-pointer">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
