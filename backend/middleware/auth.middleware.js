// Verify JWT token middleware
import jwt from 'jsonwebtoken';

export const verifyToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;
        
        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
        
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};