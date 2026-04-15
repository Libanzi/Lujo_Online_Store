import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[LUJO] Uncaught error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
            background: "#0a0a0a",
            color: "#fff",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>LUJO</p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#888", maxWidth: "480px", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
            {this.state.message || "An unexpected error occurred. Please try refreshing the page."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#c9a84c",
              color: "#000",
              border: "none",
              padding: "0.6rem 1.5rem",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
