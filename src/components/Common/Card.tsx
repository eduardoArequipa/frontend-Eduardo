
import * as React from "react";
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';
import UserAvatar from '../Specific/UserAvatar';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-50 dark:border-gray-700",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight dark:text-gray-100", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// ProfileCard - Specialized card for users and personas
interface ProfileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: {
    src?: string;
    alt: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showFallback?: boolean;
  };
  title: string;
  subtitle?: string;
  description?: string;
  badges?: Array<{
    text: string;
    variant?: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

const ProfileCard = React.forwardRef<HTMLDivElement, ProfileCardProps>(
  ({ className, avatar, title, subtitle, description, badges = [], actions, children, ...props }, ref) => {
    const getBadgeClasses = (variant: string = 'secondary') => {
      const variants = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      };
      return variants[variant as keyof typeof variants] || variants.secondary;
    };

    return (
      <Card 
        ref={ref}
        className={cn(
          "shadow-lg transform hover:scale-105 transition-transform duration-300 ease-in-out flex flex-col",
          className
        )}
        {...props}
      >
        <CardHeader className="relative p-4">
          {actions && (
            <div className="absolute top-4 right-4">
              {actions}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {avatar && (
              <div className="flex-shrink-0">
                <UserAvatar
                  src={avatar.src}
                  alt={avatar.alt}
                  size={avatar.size || 'md'}
                  showFallback={avatar.showFallback !== false}
                  className="ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-indigo-500"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate" title={title}>
                {title}
              </CardTitle>
              {subtitle && (
                <CardDescription className="truncate" title={subtitle}>
                  {subtitle}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4 flex-grow flex flex-col justify-between">
          <div>
            {description && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">
                  INFORMACIÓN:
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300" title={description}>
                  {description}
                </p>
              </div>
            )}
            {children}
          </div>

          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              {badges.map((badge, index) => (
                <span
                  key={index}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold leading-tight rounded-full",
                    getBadgeClasses(badge.variant)
                  )}
                >
                  {badge.text}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);
ProfileCard.displayName = "ProfileCard";

// TransactionCard - Specialized card for sales and purchases
interface TransactionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  transactionId: string | number;
  date: string;
  client?: string;
  total: number;
  currency?: string;
  status: {
    text: string;
    variant: 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  };
  items?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    valueClassName?: string;
  }>;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'sale' | 'purchase';
}

const TransactionCard = React.forwardRef<HTMLDivElement, TransactionCardProps>(
  ({ 
    className, 
    transactionId, 
    date, 
    client, 
    total, 
    currency = 'Bs.', 
    status, 
    items = [], 
    actions, 
    children,
    variant = 'sale',
    ...props 
  }, ref) => {
    const getBadgeClasses = (variant: string = 'secondary') => {
      const variants = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
        warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
        secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      };
      return variants[variant as keyof typeof variants] || variants.secondary;
    };

    const getVariantStyles = () => {
      if (variant === 'purchase') {
        return 'border-l-4 border-l-orange-500/30 hover:border-l-orange-500';
      }
      return 'border-l-4 border-l-green-500/30 hover:border-l-green-500';
    };

    const getVariantIcon = () => {
      if (variant === 'purchase') {
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        );
      }
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l4-4m0 0l4 4m-4-4v18" />
        </svg>
      );
    };

    return (
      <Card 
        ref={ref}
        className={cn(
          "hover:shadow-xl transition-all duration-300",
          getVariantStyles(),
          className
        )}
        {...props}
      >
        <CardHeader className="p-4">
          {/* Header con ID y fecha */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getVariantIcon()}
              <CardTitle className="text-lg">
                #{transactionId}
              </CardTitle>
            </div>
            <span className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full",
              getBadgeClasses(status.variant)
            )}>
              {status.text}
            </span>
          </div>

          {/* Fecha y cliente */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{new Date(date).toLocaleString('es-BO')}</span>
            </div>
            {client && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate">{client}</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4">
          {/* Información adicional */}
          {items.length > 0 && (
            <div className="space-y-2 mb-4">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {item.icon}
                    <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                  </div>
                  <span className={item.valueClassName || "text-gray-800 dark:text-gray-200 font-medium"}>{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {children}

          {/* Footer con Total y Acciones */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
                <span className={cn(
                  "text-xl font-bold",
                  variant === 'purchase' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                )}>
                  {typeof total === 'number' ? total.toFixed(2) : total} {currency}
                </span>
              </div>
              {actions && (
                <div className="flex-shrink-0">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
TransactionCard.displayName = "TransactionCard";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, ProfileCard, TransactionCard };
