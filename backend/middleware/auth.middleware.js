// middleware/auth.middleware.js (Naya file banao)

import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
    try {


        console.log("========== AUTH MIDDLEWARE ==========");
        console.log("Cookies:", req.cookies);
        console.log("Headers authorization:", req.headers.authorization);


        // Get token from cookie or Authorization header
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            console.log("No token found");
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        console.log("Token found, verifying...");
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token verified, userId:", decoded.userId);
        
        req.userId = decoded.userId;
        next();
        
    } catch (error) {
        console.error("Auth middleware error:", error);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};