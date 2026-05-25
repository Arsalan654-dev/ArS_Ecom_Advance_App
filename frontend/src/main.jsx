
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google';


import 'leaflet/dist/leaflet.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';


const GOOGLE_CLIENT_ID = '1020918215444-87lhp7uigrmhaau99v8p3s6jis0qin96.apps.googleusercontent.com'; // Replace with your Client ID

createRoot(document.getElementById('root')).render(
  
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
 
);


