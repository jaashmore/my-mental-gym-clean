import React from "react";

// Imported SVG logo
import logoUrl from "./logo.svg";

const Logo = ({ className = "" }) => (
  <img
    src={logoUrl}
    className={className}
    alt="Logo"
    style={{ background: "#282c34", display: "block", width: "100%", height: "auto", maxWidth: "67.5px" }}
  />
);

export default Logo;
