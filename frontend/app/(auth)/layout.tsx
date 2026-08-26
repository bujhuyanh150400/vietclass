/**
 * Gives the unauthenticated routes their full-height presentation shell so each
 * auth screen can lay itself out against the whole viewport.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <div className="flex min-h-svh grow flex-col">{children}</div>;
}
