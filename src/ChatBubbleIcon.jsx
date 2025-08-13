// src/ChatBubbleIcon.jsx
import React from "react";

export default function ChatBubbleIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      width="1em"
      height="1em"
      {...props}
    >
      <path d="M4 20v-2.586A2 2 0 0 1 4.586 16L5.414 15.172A2 2 0 0 0 6 13.586V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7.586a2 2 0 0 0 .586 1.414l.828.828A2 2 0 0 1 20 17.414V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </svg>
  );
}
