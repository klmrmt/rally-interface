import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext.tsx";
import { PageSkeleton } from "./components/Skeleton.tsx";

const Home = lazy(() => import("./pages/Home.tsx").then((m) => ({ default: m.Home })));
const Login = lazy(() => import("./pages/Login.tsx").then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx").then((m) => ({ default: m.Dashboard })));
const CreateRallyWizard = lazy(() => import("./pages/CreateRallyWizard.tsx").then((m) => ({ default: m.CreateRallyWizard })));
const EditRally = lazy(() => import("./pages/EditRally.tsx").then((m) => ({ default: m.EditRally })));
const JoinRally = lazy(() => import("./pages/JoinRally.tsx").then((m) => ({ default: m.JoinRally })));
const Vote = lazy(() => import("./pages/Vote.tsx").then((m) => ({ default: m.Vote })));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom.tsx").then((m) => ({ default: m.WaitingRoom })));
const Recommendations = lazy(() => import("./pages/Recommendations.tsx").then((m) => ({ default: m.Recommendations })));
const Result = lazy(() => import("./pages/Result.tsx").then((m) => ({ default: m.Result })));
const NotFound = lazy(() => import("./pages/NotFound.tsx").then((m) => ({ default: m.NotFound })));

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
      <Suspense fallback={<PageSkeleton />}>
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
      </Suspense>
    </div>
  );
}

export default App;
