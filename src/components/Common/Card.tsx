import * as React from "react";

// Función de utilidad para unir clases de CSS. 
// Puedes instalar una librería como `clsx` (`npm install clsx`) para esto, 
// pero una función simple también funciona.
import { twMerge } from 'tailwind-merge';
import clsx, { ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Componente Principal: Card ----
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-white text-gray-900 shadow-sm", // Estilos base
      className // Permite sobreescribir o añadir clases desde fuera
    )}
    {...props}
  />
));
Card.displayName = "Card";

// ---- Componente de Cabecera: CardHeader ----
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

// ---- Componente de Título: CardTitle ----
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// ---- Componente de Descripción: CardDescription ----
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)} // Texto con color apagado
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

// ---- Componente de Contenido: CardContent ----
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

// ---- Componente de Pie de Página: CardFooter ----
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

// ---- Exportamos todo ----
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };