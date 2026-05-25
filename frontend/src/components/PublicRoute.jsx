// components/PublicRoute.jsx (Naya file banao)

import React from 'react';
import { Navigate } from 'react-router-dom';

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    const isAuthenticated = token && token !== 'undefined' && token !== 'null';
    
    if (isAuthenticated) {
        // Already logged in, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }
    
    // Not logged in, show public page
    return children;
};

export default PublicRoute;