/* frontend/src/components/ProtectedRoute.jsx */

import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

     console.log("ProtectedRoute check - Token:", !!token, "User:", !!user);
    
    // Check if user is authenticated
    const isAuthenticated = token && token !== 'undefined' && token !== 'null';
    
    if (!isAuthenticated && !user) {
        // User not logged in, redirect to signin
        return <Navigate to="/signin" replace />;
    }
    
    // User is logged in, show protected component
    return children;
};

export default ProtectedRoute;