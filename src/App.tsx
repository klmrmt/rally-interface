import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.tsx";
import { Home } from "./pages/Home.tsx";
import { Login } from "./pages/Login.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { CreateRallyWizard } from "./pages/CreateRallyWizard.tsx";
import { EditRally } from "./pages/EditRally.tsx";
import { JoinRally } from "./pages/JoinRally.tsx";
import { Vote } from "./pages/Vote.tsx";
import { WaitingRoom } from "./pages/WaitingRoom.tsx";
import { Recommendations } from "./pages/Recommendations.tsx";
import { Result } from "./pages/Result.tsx";
import { NotFound } from "./pages/NotFound.tsx";
import { PageSkeleton } from "./components/Skeleton.tsx";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageSkeleton />;
  }

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : <Home />;
}

function App() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/create" element={<RequireAuth><CreateRallyWizard /></RequireAuth>} />
        <Route path="/:hexId/edit" element={<RequireAuth><EditRally /></RequireAuth>} />
        <Route path="/:hexId" element={<JoinRally />} />
        <Route path="/:hexId/vote" element={<Vote />} />
        <Route path="/:hexId/waiting" element={<RequireAuth><WaitingRoom /></RequireAuth>} />
        <Route path="/:hexId/recommendations" element={<RequireAuth><Recommendations /></RequireAuth>} />
        <Route path="/:hexId/result" element={<RequireAuth><Result /></RequireAuth>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
