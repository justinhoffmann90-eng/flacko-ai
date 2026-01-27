"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          minHeight: "100vh", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          padding: "1rem",
          backgroundColor: "#0a0a0a",
          color: "#fafafa"
        }}>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#a1a1aa", marginBottom: "0.5rem" }}>
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p style={{ fontSize: "0.75rem", color: "#71717a", fontFamily: "monospace", marginBottom: "1rem" }}>
                ID: {error.digest}
              </p>
            )}
            <button 
              onClick={() => reset()}
              style={{
                backgroundColor: "#fafafa",
                color: "#0a0a0a",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                fontWeight: "500",
                marginRight: "0.5rem",
                cursor: "pointer",
                border: "none"
              }}
            >
              Try again
            </button>
            <button 
              onClick={() => window.location.href = "/"}
              style={{
                backgroundColor: "transparent",
                color: "#fafafa",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                fontWeight: "500",
                cursor: "pointer",
                border: "1px solid #3f3f46"
              }}
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
