import type { ApiResponse } from "./types";

const API_BASE = "/rally-api";

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

  const data: ApiResponse<T> = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.message || "Request failed");
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
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
      }>;
      voteTally: Array<{ recommendationId: string; count: number }>;
      finalVoteCount: number;
      participantCount: number;
    }>(`/session/${hexId}/recommendations`),

  submitPick: (hexId: string, recommendationId: string) =>
    request<{ vote: unknown }>(`/session/${hexId}/pick`, {
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
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
      } | null;
      tally: Array<{ recommendationId: string; count: number }>;
      recommendations: Array<{
        id: string;
        name: string;
        category: string | null;
        whyItFits: string | null;
        priceLevel: string | null;
        rating: number | null;
        mapsUrl: string | null;
        latitude: number | null;
        longitude: number | null;
      }>;
    }>(`/session/${hexId}/result`),

  submitFeedback: (hexId: string, liked: boolean, tags: string[]) =>
    request<{ feedback: unknown }>(`/session/${hexId}/feedback`, {
      method: "POST",
      body: JSON.stringify({ liked, tags }),
    }),

  createRally: (data: {
    groupName: string;
    callToRally?: string;
    hangoutDateTime: string;
    location?: string;
    radiusMiles?: number;
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
    }>("/rally/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
