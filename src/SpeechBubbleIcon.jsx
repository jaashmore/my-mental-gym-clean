// src/SpeechBubbleIcon.jsx
import React from "react";

export default function SpeechBubbleIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      width="1em"
      height="1em"
      {...props}
    >
      <path d="M21 6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9l4 4v-4h1a2 2 0 0 0 2-2V6z" />
    </svg>
  );
}
