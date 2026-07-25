import React from "react";

export function VegBadge({ isVeg, className = "" }) {
  if (isVeg) {
    return (
      <span
        title="Vegetarian"
        className={`veg-box ${className}`}
        aria-label="Vegetarian"
      />
    );
  }
  return (
    <span
      title="Non-Vegetarian"
      className={`non-veg-box ${className}`}
      aria-label="Non-Vegetarian"
    />
  );
}

export default VegBadge;
