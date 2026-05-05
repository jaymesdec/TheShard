const SIZES = {
  xs: { container: 16, text: 9 },
  sm: { container: 28, text: 11 },
  md: { container: 40, text: 14 },
};

function getInitials(name, email, size) {
  const displayName = name || email || '?';
  if (size === 'xs' || size === 'sm') {
    return displayName.charAt(0).toUpperCase();
  }
  return displayName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

import { useState } from "react";

export default function UserAvatar({ name, email, profileColor, image, size = 'sm' }) {
  const dimensions = SIZES[size] || SIZES.sm;
  const initials = getInitials(name, email, size);
  const [imageError, setImageError] = useState(false);

  if (image && !imageError) {
    return (
      <img
        src={image}
        alt={name || email || ""}
        className="rounded-full object-cover flex-shrink-0"
        style={{
          width: dimensions.container,
          height: dimensions.container,
        }}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{
        backgroundColor: profileColor || '#2563FF',
        width: dimensions.container,
        height: dimensions.container,
        fontSize: dimensions.text,
      }}
    >
      {initials}
    </div>
  );
}
