import type {
  ApiResponse,
  RallyInfo,
  User,
  RallySummary,
  JoinResult,
  VoteStatus,
  RecommendationsData,
  ResultData,
  Recommendation,
  RallyDetail,
  Draft,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE || "/rally-api";

const AUTH_EXPIRED_PATTERNS = [
  "log in again",
  "token expired",
  "invalid token",
  "jwt expired",
  "unauthorized",
];

function isAuthExpiredMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return AUTH_EXPIRED_PATTERNS.some((p) => lower.includes(p));
}

function handleAuthExpired() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("authUser");
  sessionStorage.removeItem("participantToken");
  window.dispatchEvent(new CustomEvent("auth:expired"));
  window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const incomingHeaders = (options.headers as Record<string, string>) || {};

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...incomingHeaders,
  };

  if (!headers["Authorization"]) {
    const participantToken = sessionStorage.getItem("participantToken");
    const authToken = localStorage.getItem("authToken");
    const token = participantToken || authToken;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    let message = "Unauthorized";
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {}
    if (isAuthExpiredMessage(message)) {
      handleAuthExpired();
    }
    throw new Error(message);
  }

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    let message = data.message || "Request failed";
    if (
      data.data &&
      typeof data.data === "object" &&
      "errors" in data.data &&
      Array.isArray((data.data as Record<string, unknown>).errors)
    ) {
      const errors = (data.data as Record<string, unknown>).errors as Array<{ message: string }>;
      if (errors.length) {
        message = errors.map((e) => e.message).join(". ");
      }
    }
    if (isAuthExpiredMessage(message)) {
      handleAuthExpired();
    }
    throw new Error(message);
  }

  return data.data as T;
}

function authRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authToken = localStorage.getItem("authToken");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  return request<T>(endpoint, { ...options, headers });
}

export const api = {
  sendOTP: (phoneNumber: string) =>
    request<void>("/auth/otp/send", {
      method: "POST",
      body: JSON.stringify({ phoneNumber }),
    }),

  verifyOTP: (phoneNumber: string, mfaCode: string) =>
    request<{ token: string; user: User }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, mfaCode }),
    }),

  getMe: () => authRequest<User>("/user/me"),

  updateMe: (displayName: string) =>
    authRequest<User>("/user/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    }),

  getMyRallies: () =>
    authRequest<{ rallies: RallySummary[] }>("/user/rallies"),

  getRallyInfo: (hexId: string) =>
    request<RallyInfo>(`/session/${hexId}`),

  joinRally: (hexId: string, displayName?: string) =>
    authRequest<JoinResult>(`/session/${hexId}/join`, {
      method: "POST",
      body: JSON.stringify(displayName ? { displayName } : {}),
    }),

  submitVote: (hexId: string, vote: { budget: string; vibes: string[]; distance: string }) =>
    request<{ vote: unknown }>(`/session/${hexId}/vote`, {
      method: "POST",
      body: JSON.stringify(vote),
    }),

  getVoteStatus: (hexId: string) =>
    request<VoteStatus>(`/session/${hexId}/votes`),

  getRecommendations: (hexId: string) =>
    request<RecommendationsData>(`/session/${hexId}/recommendations`),

  selectWinner: (hexId: string, recommendationId: string) =>
    authRequest<{ recommendation: Recommendation }>(`/session/${hexId}/select`, {
      method: "POST",
      body: JSON.stringify({ recommendationId }),
    }),

  getResult: (hexId: string) =>
    request<ResultData>(`/session/${hexId}/result`),

  submitFeedback: (hexId: string, liked: boolean, tags: string[]) =>
    request<{ feedback: unknown }>(`/session/${hexId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ liked, tags }),
    }),

  closeVoting: (hexId: string) =>
    authRequest<void>(`/session/${hexId}/close-voting`, {
      method: "POST",
    }),

  generateRecommendations: (hexId: string) =>
    authRequest<{ recommendations: Recommendation[] }>(
      `/session/${hexId}/generate-recommendations`,
      { method: "POST" },
    ),

  createRally: (data: {
    groupName: string;
    callToRally?: string;
    hangoutDateTime: string;
    location?: string;
    radiusMiles?: number;
    latitude?: number;
    longitude?: number;
    votingDurationMinutes?: number;
    draftId?: string;
  }) =>
    authRequest<RallyDetail>("/rally/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDrafts: () =>
    authRequest<{ drafts: Draft[] }>("/rally/drafts"),

  createDraft: (step: number, data: Record<string, unknown>) =>
    authRequest<Draft>("/rally/drafts", {
      method: "POST",
      body: JSON.stringify({ step, data }),
    }),

  updateDraft: (id: string, step: number, data: Record<string, unknown>) =>
    authRequest<Draft>(`/rally/drafts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ step, data }),
    }),

  deleteDraft: (id: string) =>
    authRequest<void>(`/rally/drafts/${id}`, {
      method: "DELETE",
    }),

  updateRally: (hexId: string, data: {
    groupName?: string;
    callToRally?: string;
    hangoutDateTime?: string;
    location?: string | null;
    radiusMiles?: number | null;
    latitude?: number | null;
    longitude?: number | null;
  }) =>
    authRequest<RallyDetail>(`/rally/${hexId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
