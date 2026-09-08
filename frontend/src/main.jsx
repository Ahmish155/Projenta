import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { UnreadProvider } from "./context/UnreadContext.jsx";
import { firebaseConfigError } from "./firebase.js";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

if (firebaseConfigError) {
  root.render(
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#2A343A", color: "#F7F4EC", fontFamily: "sans-serif", padding: 24, textAlign: "center",
    }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 20, marginBottom: 12 }}>Configuration error</h1>
        <p style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>{firebaseConfigError}</p>
      </div>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <UnreadProvider>
              <App />
            </UnreadProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}