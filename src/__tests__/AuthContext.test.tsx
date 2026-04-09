import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function TestConsumer() {
  const { isAuthenticated, user, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="user-name">{user?.displayName ?? "none"}</span>
      <button onClick={() => login("tok123", { userId: "u1", displayName: "Kyle" })}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts unauthenticated", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId("auth-status").textContent).toBe("no");
    expect(screen.getByTestId("user-name").textContent).toBe("none");
  });

  it("login sets user and token", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Login"));

    expect(screen.getByTestId("auth-status").textContent).toBe("yes");
    expect(screen.getByTestId("user-name").textContent).toBe("Kyle");
    expect(localStorage.getItem("authToken")).toBe("tok123");
  });

  it("logout clears state", () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Login"));
    expect(screen.getByTestId("auth-status").textContent).toBe("yes");

    fireEvent.click(screen.getByText("Logout"));
    expect(screen.getByTestId("auth-status").textContent).toBe("no");
    expect(localStorage.getItem("authToken")).toBeNull();
  });
});
