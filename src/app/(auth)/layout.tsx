// File: src/app/(auth)/layout.tsx
// ============================================================================
// Auth Layout - Simple passthrough (ThemeProvider is in root layout)
// ============================================================================

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
