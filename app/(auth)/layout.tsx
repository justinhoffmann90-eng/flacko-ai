export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center md:justify-center bg-background px-4 pt-12 md:pt-0 pb-4">
      <div className="w-full max-w-md md:max-w-lg">
        {children}
      </div>
    </div>
  );
}
