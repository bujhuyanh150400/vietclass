"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2Icon, TriangleAlertIcon, XIcon } from "lucide-react"
import { Toast as ToastPrimitive } from "radix-ui"

import { cn } from "@/lib/utils/index"

/**
 * Owns the shared timing and swipe behaviour every toast in the app obeys.
 */
function ToastProvider({
  duration = 5000,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Provider>) {
  return (
    <ToastPrimitive.Provider duration={duration} swipeDirection="right" {...props} />
  )
}

/**
 * Renders the fixed region the toasts stack in, above the page but out of the
 * way of the content on small screens.
 */
function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed top-0 right-0 z-100 flex max-h-screen w-full flex-col gap-2 p-4 sm:top-auto sm:bottom-0 sm:max-w-sm",
        className
      )}
      {...props}
    />
  )
}

/**
 * Builds the toast class string for one outcome variant.
 */
const toastVariants = cva(
  "group pointer-events-auto relative grid w-full grid-cols-[calc(var(--spacing)*4)_1fr_calc(var(--spacing)*4)] items-start gap-x-3 gap-y-0.5 rounded-lg border bg-card p-4 pr-3 text-sm shadow-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:animate-in data-[state=open]:slide-in-from-top-full data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none sm:data-[state=open]:slide-in-from-bottom-full [&>svg]:size-4 [&>svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        success: "border-success/30 [&>svg]:text-success",
        error: "border-destructive/30 [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

/** The icon that leads each toast, chosen by outcome rather than by caller. */
const TOAST_ICONS = {
  success: CheckCircle2Icon,
  error: TriangleAlertIcon,
} as const

/**
 * Renders one toast with the leading icon its variant implies and a close button.
 */
function Toast({
  className,
  variant = "success",
  children,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Root> &
  VariantProps<typeof toastVariants>) {
  const Icon = TOAST_ICONS[variant ?? "success"]

  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden />
      {children}
      <ToastPrimitive.Close
        data-slot="toast-close"
        className="col-start-3 row-start-1 rounded-xs opacity-60 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-hidden [&_svg]:size-4 [&_svg]:shrink-0"
      >
        <XIcon />
        <span className="sr-only">Đóng thông báo</span>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  )
}

/**
 * Renders the toast's short headline, which states the outcome on its own.
 */
function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("col-start-2 font-medium tracking-tight", className)}
      {...props}
    />
  )
}

/**
 * Renders the toast's optional supporting line beneath its headline.
 */
function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("col-start-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport }
