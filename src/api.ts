import type { ApiResponse } from "./types";

const API_BASE = "/rally-api";

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
    if (data.data?.errors?.length) {
      message = data.data.errors.map((e: { message: string }) => e.message).join(". ");
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
    request<{
      token: string;
      user: { userId: string; displayName: string | null };
    }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, mfaCode }),
    }),

  getMe: () =>
    authRequest<{ userId: string; displayName: string | null }>("/user/me"),

  updateMe: (displayName: string) =>
    authRequest<{ userId: string; displayName: string | null }>("/user/me", {
      method: "PATCH",
      body: JSON.stringify({ displayName }),
    }),

  getMyRallies: () =>
    authRequest<{
      rallies: Array<{
        id: string;
        hexId: string;
        groupName: string;
        scheduledTime: string;
        callToAction: string;
        status: string;
        location: string | null;
        participantCount: number;
        role: "creator" | "participant";
      }>;
    }>("/user/rallies"),

  getRallyInfo: (hexId: string) =>
    request<{
      hexId: string;
      groupName: string;
      scheduledTime: string;
      callToAction: string;
      status: string;
      location: string | null;
      votingClosesAt: string | null;
      participantCount: number;
    }>(`/session/${hexId}`),

  joinRally: (hexId: string, displayName?: string) =>
    authRequest<{
      participant: { id: string; displayName: string };
      token: string;
      alreadyJoined: boolean;
      hasVoted: boolean;
      rally: {
        hexId: string;
        groupName: string;
        scheduledTime: string;
        callToAction: string;
        status: string;
        location: string | null;
        votingClosesAt: string | null;
      };
    }>(`/session/${hexId}/join`, {
      method: "POST",
      body: JSON.stringify(displayName ? { displayName } : {}),
    }),

  submitVote: (
    hexId: string,
    vote: { budget: string; vibes: string[]; distance: string }
  ) =>
    request<{ vote: unknown }>(`/session/${hexId}/vote`, {
      method: "POST",
      body: JSON.stringify(vote),
    }),

  getVoteStatus: (hexId: string) =>
    request<{
      status: string;
      voteCount: number;
      participantCount: number;
      votingClosesAt: string | null;
      hasVoted: boolean;
      isOwner: boolean;
      participants: Array<{ id: string; displayName: string }>;
    }>(`/session/${hexId}/votes`),

  getRecommendations: (hexId: string) =>
    request<{
      status: string;
      recommendations: Array<{
        id: string;
        name: string;
        category: string | null;
        whyItFits: string | null;
        distanceLabel: string | null;
        priceLevel: string | null;
        rating: number | null;
        imageUrl: string | null;
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
      }>;
      participantCount: number;
      isOwner: boolean;
    }>(`/session/${hexId}/recommendations`),

  selectWinner: (hexId: string, recommendationId: string) =>
    authRequest<{ recommendation: unknown }>(`/session/${hexId}/select`, {
      method: "POST",
      body: JSON.stringify({ recommendationId }),
    }),

  getResult: (hexId: string) =>
    request<{
      status: string;
      winner: {
        id: string;
        name: string;
        category: string | null;
        whyItFits: string | null;
        priceLevel: string | null;
        rating: number | null;
        imageUrl: string | null;
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
      } | null;
      recommendations: Array<{
        id: string;
        name: string;
        category: string | null;
        whyItFits: string | null;
        priceLevel: string | null;
        rating: number | null;
        imageUrl: string | null;
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
        address: string | null;
      }>;
    }>(`/session/${hexId}/result`),

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
    authRequest<{ recommendations: Array<unknown> }>(
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
    authRequest<{
      id: string;
      hexId: string;
      groupName: string;
      scheduledTime: string;
      callToAction: string;
      status: string;
      location: string | null;
      radiusMiles: number | null;
      latitude: number | null;
      longitude: number | null;
      votingClosesAt: string | null;
    }>("/rally/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getDrafts: () =>
    authRequest<{
      drafts: Array<{
        id: string;
        userId: string;
        step: number;
        data: Record<string, unknown>;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/rally/drafts"),

  createDraft: (step: number, data: Record<string, unknown>) =>
    authRequest<{
      id: string;
      userId: string;
      step: number;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>("/rally/drafts", {
      method: "POST",
      body: JSON.stringify({ step, data }),
    }),

  updateDraft: (id: string, step: number, data: Record<string, unknown>) =>
    authRequest<{
      id: string;
      userId: string;
      step: number;
      data: Record<string, unknown>;
      createdAt: string;
      updatedAt: string;
    }>(`/rally/drafts/${id}`, {
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
    authRequest<{
      id: string;
      hexId: string;
      groupName: string;
      scheduledTime: string;
      callToAction: string;
      status: string;
      location: string | null;
      radiusMiles: number | null;
      latitude: number | null;
      longitude: number | null;
      votingClosesAt: string | null;
    }>(`/rally/${hexId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
