// App.jsx - Complete updated version

import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SignUp from './pages/SignuP';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Profile from './pages/Profile';
import VerifyEmail from './pages/VerifyEmail';
import TwoFactorVerify from './pages/TwoFactorVerify';
import AddressBook from './pages/AddressBook';

const App = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Public Routes - Redirect to dashboard if already logged in */}
        <Route path='/signup' element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        } />


        <Route path='/signin' element={
          <PublicRoute>
            <SignIn />
          </PublicRoute>
        } />

        <Route path='/forgot-password' element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />

        <Route path='/verify-email/:token' element={<VerifyEmail />} />
        <Route path='/two-factor-verify' element={<TwoFactorVerify />} />


        {/* Protected Routes - Require login */}
        <Route path='/dashboard' element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />


        <Route path='/profile' element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />


        <Route path='/address-book' element={
          <ProtectedRoute>
            <AddressBook />
          </ProtectedRoute>
        } />

        {/* Default route - redirect to signin or dashboard based on auth */}
        <Route path='/' element={
          localStorage.getItem('token') ?
            <Navigate to="/dashboard" replace /> :
            <Navigate to="/signin" replace />
        } />

        {/* Catch all - redirect to signin */}
        <Route path='*' element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
};

export default App;