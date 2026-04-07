import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.tsx";
import { Login } from "./pages/Login.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { CreateRally } from "./pages/CreateRally.tsx";
import { JoinRally } from "./pages/JoinRally.tsx";
import { Vote } from "./pages/Vote.tsx";
import { WaitingRoom } from "./pages/WaitingRoom.tsx";
import { Recommendations } from "./pages/Recommendations.tsx";
import { Result } from "./pages/Result.tsx";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <div className="animate-pulse text-[var(--color-muted)]">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-cream)]">
        <div className="animate-pulse text-[var(--color-muted)]">Loading...</div>
      </div>
    );
  }

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/login" replace />;
}

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-cream)] text-[var(--color-brown)]">
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/create" element={<RequireAuth><CreateRally /></RequireAuth>} />
        <Route path="/:hexId" element={<RequireAuth><JoinRally /></RequireAuth>} />
        <Route path="/:hexId/vote" element={<RequireAuth><Vote /></RequireAuth>} />
        <Route path="/:hexId/waiting" element={<RequireAuth><WaitingRoom /></RequireAuth>} />
        <Route path="/:hexId/recommendations" element={<RequireAuth><Recommendations /></RequireAuth>} />
        <Route path="/:hexId/result" element={<RequireAuth><Result /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
