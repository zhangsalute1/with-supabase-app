"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 24,
  className = "",
}) => {
  return (
    <Loader2
      className={`animate-spin text-blue-500 ${className}`}
      size={size}
    />
  );
};
