import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { sendOtpEmail, sendVerificationEmail, sendWelcomeEmail, sendTwoFactorOtpEmail } from "../utils/mail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { deleteFromCloudinary, uploadToCloudinary } from "../config/cloudinary.js";
import { emailQueue } from "../utils/emailQueue.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const TWO_FACTOR_CHALLENGE_EXPIRY = "10m";
const MAX_OTP_ATTEMPTS = 5;

const generateSixDigitOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const buildAuthToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const buildTwoFactorChallengeToken = (userId) => {
    return jwt.sign(
        { userId, purpose: "two-factor-login" },
        process.env.JWT_SECRET,
        { expiresIn: TWO_FACTOR_CHALLENGE_EXPIRY }
    );
};

const getTwoFactorEmail = (user) => {
    return user.email || null;
};

const clearTwoFactorState = (user) => {
    user.twoFactorOtp = null;
    user.twoFactorOtpExpires = null;
    user.twoFactorOtpPurpose = null;
    user.twoFactorOtpAttempts = 0;
    user.twoFactorLastSentAt = null;
};

const persistAndSendTwoFactorOtp = async (user, purpose) => {
    const targetEmail = getTwoFactorEmail(user);

    if (!targetEmail) {
        throw new Error("Email is required for 2FA verification");
    }

    const otp = generateSixDigitOtp();
    user.twoFactorOtp = otp;
    user.twoFactorOtpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    user.twoFactorOtpPurpose = purpose;
    user.twoFactorOtpAttempts = 0;
    user.twoFactorLastSentAt = new Date();

    await user.save();
    emailQueue.add(sendTwoFactorOtpEmail, targetEmail, user.fullName, otp, purpose)
        .catch(err => console.error("Queue email failed:", err));

    return {
        expiresAt: user.twoFactorOtpExpires,
        email: targetEmail
    };
};



// Sign up
export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role } = req.body;
        console.log("📝 User signup attempt:", email);
        
        // Validation
        if (!fullName || !email || !password || !mobile || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        // Check existing user
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ error: "Email already exists" });
        }
        
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
            return res.status(400).json({ error: "Mobile number already exists" });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }
        
        if (!/^\d{10,13}$/.test(mobile)) {
            return res.status(400).json({ error: "Mobile number must be 10-13 digits" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

         // Generate email verification token
        const emailVerificationToken = crypto.randomBytes(32).toString('hex');
        
        // Create user
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            mobile,
            role,
             isEmailVerified: false,
            emailVerificationToken: emailVerificationToken,
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
        });
        

        // Send verification email
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`;
        emailQueue.add(sendVerificationEmail, email, fullName, verificationLink)
        .catch(err => console.error("Queue email failed:", err));
        
        const userResponse = {
            _id: newUser._id,
            fullName: newUser.fullName,
            email: newUser.email,
            mobile: newUser.mobile,
            role: newUser.role,
            avatar: newUser.avatar,
            isEmailVerified: false
        };
        
        return res.status(201).json({ 
            success: true,
            message: "User registered successfully. Please verify your email to login.", 
            user: userResponse,
            requiresEmailVerification: true
        });
        
    } catch (error) {
        console.error("Signup error:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email or mobile already exists" });
        }
        
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};



// Sign in
export const signIn = async (req, res) => {
    try {
        
        const { email, password } = req.body;
        
        console.log("👤 User signin attempt:", email);

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid email or password" });
        }

        if (!user.isEmailVerified) {
            if (!user.emailVerificationToken || user.emailVerificationExpires < Date.now()) {
                user.emailVerificationToken = crypto.randomBytes(32).toString("hex");
                user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
                await user.save();
            }

            const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${user.emailVerificationToken}`;
            emailQueue.add(sendVerificationEmail, user.email, user.fullName, verificationLink)
            .catch(err => console.error("Queue email failed:", err));

            return res.status(403).json({
                error: "Email not verified",
                message: "A verification link has been sent to your email. Please verify your email to continue.",
                email: user.email,
                requiresEmailVerification: true
            });
        }

        if (user.twoFactorEnabled) {
            const email = user.email;

            if (!email) {
                return res.status(400).json({
                    error: "Two-factor authentication is enabled but email is not set"
                });
            }

            const challengeToken = buildTwoFactorChallengeToken(user._id.toString());
            const challenge = await persistAndSendTwoFactorOtp(user, "login");

            return res.status(202).json({
                success: true,
                twoFactorRequired: true,
                message: "Verification code sent to your email",
                challengeToken,
                email: challenge.email,
                expiresAt: challenge.expiresAt
            });
        }
        
        const token = buildAuthToken(user._id.toString());

        res.cookie("token", token, {
            sameSite: "strict",
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetOtp;
        delete userResponse.otpExpires;
        delete userResponse.twoFactorOtp;
        delete userResponse.twoFactorOtpExpires;
        delete userResponse.twoFactorOtpPurpose;
        delete userResponse.twoFactorOtpAttempts;
        delete userResponse.twoFactorLastSentAt;

        return res.status(200).json({
            message: "User signed in successfully",
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("Signin error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


export const signOut = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });
        return res.status(200).json({ 
            success: true,
            message: "User logged out successfully" 
        });
    } catch (error) {
        console.error("Signout error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Send OTP for password reset
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User with this email does not exist" });
        }

        const otp = generateSixDigitOtp();

        user.resetOtp = otp;
        user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
        user.isOtpVerified = false;
        await user.save();


        emailQueue.add(sendOtpEmail, email, user.fullName, otp)
            .catch(err => console.error("Queue email failed:", err));

        return res.status(200).json({
            message: "OTP sent successfully",
            email,
            expiresAt: user.otpExpires,
            resendAvailableAt: user.otpExpires
        });
    } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ error: "Failed to send OTP" });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.resetOtp || !user.otpExpires) {
            return res.status(400).json({ error: "OTP not found. Please request a new code.", expired: true });
        }

        if (new Date(user.otpExpires).getTime() < Date.now()) {
            user.resetOtp = null;
            user.otpExpires = null;
            user.isOtpVerified = false;
            await user.save();

            return res.status(400).json({ error: "OTP has expired", expired: true });
        }

        if (user.resetOtp !== otp) {
            return res.status(400).json({ error: "Invalid OTP" });
        }

        user.isOtpVerified = true;
        await user.save();

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ error: "Failed to verify OTP" });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: "Email and new password are required" });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters long" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.isOtpVerified) {
            return res.status(400).json({ error: "OTP not verified. Please verify OTP first." });
        }

        if (!user.otpExpires || new Date(user.otpExpires).getTime() < Date.now()) {
            user.resetOtp = null;
            user.otpExpires = null;
            user.isOtpVerified = false;
            await user.save();

            return res.status(400).json({ error: "OTP has expired. Please resend the code.", expired: true });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = null;
        user.otpExpires = null;
        user.isOtpVerified = false;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ error: "Failed to reset password" });
    }
};



export const requestTwoFactorSetup = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.twoFactorEnabled) {
            return res.status(400).json({ error: "Two-factor authentication is already enabled" });
        }

        const challenge = await persistAndSendTwoFactorOtp(user, "enable");

        return res.status(200).json({
            success: true,
            message: "Verification code sent to your email",
            email: challenge.email,
            expiresAt: challenge.expiresAt
        });
    } catch (error) {
        console.error("Request two-factor setup error:", error);
        return res.status(500).json({
            error: "Failed to send verification code",
            details: error.message
        });
    }
};

export const verifyTwoFactorSetup = async (req, res) => {
    try {
        const userId = req.userId;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ error: "OTP is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.twoFactorOtpPurpose !== "enable") {
            return res.status(400).json({ error: "No active setup verification found" });
        }

        if (!user.twoFactorOtpExpires || new Date(user.twoFactorOtpExpires).getTime() < Date.now()) {
            clearTwoFactorState(user);
            await user.save();
            return res.status(400).json({ error: "OTP has expired", expired: true });
        }

        if (user.twoFactorOtpAttempts >= MAX_OTP_ATTEMPTS) {
            clearTwoFactorState(user);
            await user.save();
            return res.status(429).json({ error: "Too many invalid attempts. Please resend the code." });
        }

        if (user.twoFactorOtp !== otp) {
            user.twoFactorOtpAttempts += 1;
            await user.save();

            return res.status(400).json({
                error: "Invalid OTP",
                attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - user.twoFactorOtpAttempts)
            });
        }

        user.twoFactorEnabled = true;
        clearTwoFactorState(user);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Two-factor authentication enabled successfully",
            twoFactorEnabled: true,
            phoneNumber: user.twoFactorPhone
        });
    } catch (error) {
        console.error("Verify two-factor setup error:", error);
        return res.status(500).json({
            error: "Failed to enable two-factor authentication",
            details: error.message
        });
    }
};

export const disableTwoFactor = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        user.twoFactorEnabled = false;
        clearTwoFactorState(user);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Two-factor authentication disabled successfully",
            twoFactorEnabled: false
        });
    } catch (error) {
        console.error("Disable two-factor error:", error);
        return res.status(500).json({
            error: "Failed to disable two-factor authentication",
            details: error.message
        });
    }
};

export const resendTwoFactorOtp = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const challenge = await persistAndSendTwoFactorOtp(user, "enable");

        return res.status(200).json({
            success: true,
            message: "Verification code resent to your email",
            email: challenge.email,
            expiresAt: challenge.expiresAt
        });
    } catch (error) {
        console.error("Resend two-factor OTP error:", error);
        return res.status(500).json({
            error: "Failed to resend verification code",
            details: error.message
        });
    }
};

export const verifyTwoFactorLogin = async (req, res) => {
    try {
        const { challengeToken, otp } = req.body;

        if (!challengeToken || !otp) {
            return res.status(400).json({ error: "Challenge token and OTP are required" });
        }

        const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);

        if (decoded.purpose !== "two-factor-login") {
            return res.status(400).json({ error: "Invalid two-factor challenge" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.twoFactorOtpPurpose !== "login") {
            return res.status(400).json({ error: "No active login verification found" });
        }

        if (!user.twoFactorOtpExpires || new Date(user.twoFactorOtpExpires).getTime() < Date.now()) {
            clearTwoFactorState(user);
            await user.save();
            return res.status(400).json({ error: "OTP has expired", expired: true });
        }

        if (user.twoFactorOtpAttempts >= MAX_OTP_ATTEMPTS) {
            clearTwoFactorState(user);
            await user.save();
            return res.status(429).json({ error: "Too many invalid attempts. Please resend the code." });
        }

        if (user.twoFactorOtp !== otp) {
            user.twoFactorOtpAttempts += 1;
            await user.save();

            return res.status(400).json({
                error: "Invalid OTP",
                attemptsLeft: Math.max(0, MAX_OTP_ATTEMPTS - user.twoFactorOtpAttempts)
            });
        }

        const token = buildAuthToken(user._id.toString());
        clearTwoFactorState(user);
        await user.save();

        res.cookie("token", token, {
            sameSite: "strict",
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: true
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetOtp;
        delete userResponse.otpExpires;
        delete userResponse.twoFactorOtp;
        delete userResponse.twoFactorOtpExpires;
        delete userResponse.twoFactorOtpPurpose;
        delete userResponse.twoFactorOtpAttempts;
        delete userResponse.twoFactorLastSentAt;

        return res.status(200).json({
            success: true,
            message: "Two-factor login verified successfully",
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("Verify two-factor login error:", error);
        return res.status(500).json({
            error: "Failed to verify two-factor login",
            details: error.message
        });
    }
};

export const resendTwoFactorLoginOtp = async (req, res) => {
    try {
        const { challengeToken } = req.body;

        if (!challengeToken) {
            return res.status(400).json({ error: "Challenge token is required" });
        }

        const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);

        if (decoded.purpose !== "two-factor-login") {
            return res.status(400).json({ error: "Invalid two-factor challenge" });
        }

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (!user.twoFactorEnabled) {
            return res.status(400).json({ error: "Two-factor authentication is not enabled" });
        }

        const challenge = await persistAndSendTwoFactorOtp(user, "login");

        return res.status(200).json({
            success: true,
            message: "Login verification code resent to your email",
            email: challenge.email,
            expiresAt: challenge.expiresAt
        });
    } catch (error) {
        console.error("Resend two-factor login OTP error:", error);
        return res.status(500).json({
            error: "Failed to resend login verification code",
            details: error.message
        });
    }
};



// ============= GOOGLE LOGIN - WORKING VERSION =============
export const googleLogin = async (req, res) => {
    try {
        
        const { email, name, picture, googleId, avatar } = req.body;
        console.log("🔐 Google login attempt:", email);

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        if (!googleId) {
            return res.status(400).json({ error: "Google ID is required" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                fullName: name || email.split("@")[0],
                email,
                password: null,
                role: "user",
                googleId,
                isGoogleVerified: true,
                isEmailVerified: true,
                avatar: picture || avatar || null
            });

            await user.save();
        } else {
            let needsUpdate = false;

            if (!user.googleId) {
                user.googleId = googleId;
                needsUpdate = true;
            }
            if (!user.avatar && (picture || avatar)) {
                user.avatar = picture || avatar;
                needsUpdate = true;
            }
            if (!user.isGoogleVerified) {
                user.isGoogleVerified = true;
                needsUpdate = true;
            }
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await user.save();
            }
        }

        if (user.twoFactorEnabled) {
            const email = user.email;

            if (!email) {
                return res.status(400).json({
                    error: "Two-factor authentication is enabled but email is not set"
                });
            }

            const challengeToken = buildTwoFactorChallengeToken(user._id.toString());
            const challenge = await persistAndSendTwoFactorOtp(user, "login");

            return res.status(202).json({
                success: true,
                twoFactorRequired: true,
                message: "Verification code sent to your email",
                challengeToken,
                email: challenge.email,
                expiresAt: challenge.expiresAt
            });
        }

        const token = buildAuthToken(user._id.toString());

        res.clearCookie("token");
        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        const userResponse = user.toObject();
        delete userResponse.password;
        delete userResponse.resetOtp;
        delete userResponse.otpExpires;
        delete userResponse.twoFactorOtp;
        delete userResponse.twoFactorOtpExpires;
        delete userResponse.twoFactorOtpPurpose;
        delete userResponse.twoFactorOtpAttempts;
        delete userResponse.twoFactorLastSentAt;

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            token,
            user: userResponse
        });
    } catch (error) {
        console.error("Google login error:", error);
        return res.status(500).json({
            error: "Google login failed",
            details: error.message
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, mobile, role } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (mobile) updateData.mobile = mobile;
        if (role && ['user', 'owner', 'deliveryBoy'].includes(role)) updateData.role = role;
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password -resetOtp -otpExpires');
        
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }
        
        return res.status(200).json({ 
            message: "Profile updated successfully", 
            user: updatedUser 
        });
        
    } catch (error) {
        console.error("Update profile error:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: "Mobile number already exists" });
        }
        
        res.status(500).json({ error: "Failed to update profile" });
    }
};



// Get profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password -resetOtp -otpExpires");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


// Verify email address
export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        const user = await User.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired verification token" });
        }
        
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();
        
        // Send welcome email
        emailQueue.add(sendWelcomeEmail, user.email, user.fullName)
            .catch(err => console.error("Queue email failed:", err));
        
        return res.status(200).json({ 
            message: "Email verified successfully! You can now login." 
        });
        
    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ error: "Email verification failed" });
    }
};


// Resend Verification Email
export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({ error: "Email already verified" });
        }
        
        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();
        
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        emailQueue.add(sendVerificationEmail, user.email, user.fullName, verificationLink)
            .catch(err => console.error("Queue email failed:", err));
        
        return res.status(200).json({ message: "Verification email sent" });
        
    } catch (error) {
        console.error("Resend verification error:", error);
        res.status(500).json({ error: "Failed to send verification email" });
    }
};



// Change password
export const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
        return res.status(200).json({ message: "Password changed successfully" });
        
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ error: "Failed to change password" });
    }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
    try {
        const userId = req.userId;
        
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Delete old avatar from Cloudinary if exists
        if (user.avatarPublicId) {
            await deleteFromCloudinary(user.avatarPublicId);
        }
        
        // Upload new image to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, 'vingo/users');
        
        // Update user with new avatar info
        user.avatar = result.secure_url;
        user.avatarPublicId = result.public_id;
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            avatar: user.avatar
        });
        
    } catch (error) {
        console.error("Upload profile picture error:", error);
        res.status(500).json({ 
            error: "Failed to upload profile picture",
            details: error.message 
        });
    }
};

// Delete User Account
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required to delete account" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Password is incorrect" });
        }

        console.log(`🗑️ Deleting user account: ${user._id}`);

        await User.deleteOne({ _id: userId });

        console.log(`✅ User account deleted successfully: ${userId}`);

        res.clearCookie("token");

        return res.status(200).json({ 
            success: true,
            message: "Account deleted successfully. All associated data has been removed." 
        });

    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ 
            error: "Failed to delete account",
            details: error.message 
        });
    }
};

// Download Profile as PDF
export const downloadProfilePDF = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).populate('addresses');

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const { generateUserProfilePDF } = await import('../utils/pdfGenerator.js');
        
        const pdfBuffer = await generateUserProfilePDF(user, user.addresses || []);

        res.contentType('application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Vingo_Profile_${user.fullName.replace(/\s+/g, '_')}_${Date.now()}.pdf"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error("Download PDF error:", error);
        res.status(500).json({ 
            error: "Failed to generate PDF",
            details: error.message 
        });
    }
};
