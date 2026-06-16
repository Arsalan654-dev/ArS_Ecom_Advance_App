// frontend\src\main.jsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import { OwnerProvider } from "./context/OwnerContext";
import "./index.css";

import "leaflet/dist/leaflet.css";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "1020918215444-87lhp7uigrmhaau99v8p3s6jis0qin96.apps.googleusercontent.com";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <OwnerProvider>
           <CartProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          </CartProvider>
         </OwnerProvider>
       </ThemeProvider>
     </GoogleOAuthProvider>
   </StrictMode>
);
