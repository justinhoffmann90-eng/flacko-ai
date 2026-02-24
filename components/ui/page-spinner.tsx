export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div
          className="w-8 h-8 mx-auto animate-spin"
          style={{
            border: "2.5px solid rgba(255,255,255,0.1)",
            borderTopColor: "#22c55e",
            borderRadius: "50%",
            animationDuration: "0.7s",
          }}
        />
        {label && (
          <p className="text-sm text-zinc-500 font-mono">{label}</p>
        )}
      </div>
    </div>
  );
}
