import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";
import App from "./App.jsx";

const root = createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    {/* <div onContextMenu={(e) => e.preventDefault()}> */}
       {/* Use it for inspect on off */}
        <App />
      {/* </div> */}
  </BrowserRouter>
);
