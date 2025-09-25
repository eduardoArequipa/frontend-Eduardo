import React from 'react';
import { twMerge } from 'tailwind-merge';

interface UserAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallback?: boolean; // Nueva prop para controlar fallback
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  src, 
  alt, 
  className,
  size = 'sm',
  showFallback = true 
}) => {
  // Generar iniciales del alt (nombre)
  const getInitials = (name: string): string => {
    const cleanName = name.replace(/^(Foto de|Avatar de|Imagen de)\s*/i, '').trim();
    const names = cleanName.split(' ').filter(n => n.length > 0);
    
    if (names.length === 0) return '??';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  // Generar color basado en el nombre
  const getColorFromName = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'bg-gradient-to-br from-blue-500 to-blue-600',
      'bg-gradient-to-br from-green-500 to-green-600', 
      'bg-gradient-to-br from-purple-500 to-purple-600',
      'bg-gradient-to-br from-pink-500 to-pink-600',
      'bg-gradient-to-br from-indigo-500 to-indigo-600',
      'bg-gradient-to-br from-red-500 to-red-600',
      'bg-gradient-to-br from-yellow-500 to-yellow-600',
      'bg-gradient-to-br from-teal-500 to-teal-600',
      'bg-gradient-to-br from-orange-500 to-orange-600',
      'bg-gradient-to-br from-cyan-500 to-cyan-600'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Tamaños responsivos
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-16 w-16 text-lg',
    lg: 'h-20 w-20 text-xl', 
    xl: 'h-24 w-24 text-2xl'
  };

  const baseClasses = 'rounded-full object-cover';

  // Si hay imagen, mostrarla
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={twMerge(baseClasses, sizeClasses[size], className)}
        onError={(e) => {
          // Si la imagen falla al cargar, ocultar el elemento para activar fallback
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Si no hay imagen y no se quiere fallback, no renderizar (comportamiento original)
  if (!showFallback) {
    return null;
  }

  // Fallback con iniciales y color generado
  const initials = getInitials(alt);
  const colorClass = getColorFromName(alt);

  return (
    <div
      className={twMerge(
        'rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-white/20',
        sizeClasses[size],
        colorClass,
        className
      )}
      title={alt}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
