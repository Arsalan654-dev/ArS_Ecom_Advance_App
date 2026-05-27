import express from 'express';
import { upload } from '../config/cloudinary.js';
import { 
    signUp, 
    signIn, 
    signOut, 
    sendOtp, 
    resetPassword, 
    verifyOtp, 
    getProfile, 
    updateProfile, 
    googleLogin, 
    verifyEmail,
    resendVerificationEmail,
    changePassword,
    uploadProfilePicture,
    requestTwoFactorSetup,
    verifyTwoFactorSetup,
    disableTwoFactor,
    resendTwoFactorOtp,
    verifyTwoFactorLogin,
    resendTwoFactorLoginOtp,
    deleteAccount,
    downloadProfilePDF } from '../controllers/auth.controllers.js';
import { verifyToken } from '../middleware/auth.middleware.js';


const authRouter = express.Router();

authRouter.post('/signup', signUp);
authRouter.post('/signin', signIn);
authRouter.post('/signout', signOut);

authRouter.post('/send-otp', sendOtp);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/verify-otp', verifyOtp);
authRouter.post('/google', googleLogin);

authRouter.get('/verify-email/:token', verifyEmail);
authRouter.post('/resend-verification', resendVerificationEmail);

authRouter.post('/two-factor/login/verify', verifyTwoFactorLogin);
authRouter.post('/two-factor/login/resend', resendTwoFactorLoginOtp);

// protected routes
authRouter.get('/profile', verifyToken, getProfile);

authRouter.put('/profile', verifyToken, updateProfile);

authRouter.post('/change-password', verifyToken, changePassword);
authRouter.post('/upload-avatar', verifyToken, upload.single('avatar'), uploadProfilePicture);
authRouter.delete('/delete-account', verifyToken, deleteAccount);
authRouter.get('/download-pdf', verifyToken, downloadProfilePDF);
authRouter.post('/two-factor/setup/request', verifyToken, requestTwoFactorSetup);
authRouter.post('/two-factor/setup/verify', verifyToken, verifyTwoFactorSetup);
authRouter.post('/two-factor/disable', verifyToken, disableTwoFactor);
authRouter.post('/two-factor/setup/resend', verifyToken, resendTwoFactorOtp);

export default authRouter;
