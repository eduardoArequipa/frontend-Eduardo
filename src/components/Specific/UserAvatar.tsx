import React from 'react';

interface UserAvatarProps {
  src?: string; // ahora opcional
  alt: string;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ src, alt, className }) => {
  if (!src) return null; // No renderiza nada si src no está definido o está vacío

  return (
    <img
      src={src}
      alt={alt}
      className={`h-8 w-8 rounded-full object-cover ${className || ''}`}
    />
  );
};

export default UserAvatar;
