export type RallyStatus = "voting" | "recommending" | "picking" | "decided" | "completed";

export type RallyInfo = {
  hexId: string;
  groupName: string;
  scheduledTime: string;
  callToAction: string;
  status: RallyStatus;
  location: string | null;
  votingClosesAt: string | null;
  participantCount: number;
};

export type Participant = {
  id: string;
  rallyId: string;
  userId: string | null;
  displayName: string;
  joinedAt: string;
};

export type ConstraintVote = {
  id: string;
  budget: string;
  vibes: string[];
  distance: string;
};

export type Recommendation = {
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
};

export type ApiResponse<T = undefined> = {
  success: boolean;
  message: string;
  data?: T;
};

export type User = {
  userId: string;
  displayName: string | null;
};

export type RallySummary = {
  id: string;
  hexId: string;
  groupName: string;
  scheduledTime: string;
  callToAction: string;
  status: RallyStatus;
  location: string | null;
  participantCount: number;
  role: "creator" | "participant";
};

export type VoteStatus = {
  status: string;
  voteCount: number;
  participantCount: number;
  votingClosesAt: string | null;
  hasVoted: boolean;
  isOwner: boolean;
  participants: Array<{ id: string; displayName: string }>;
};

export type JoinResult = {
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
};

export type RallyDetail = {
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
};

export type Draft = {
  id: string;
  userId: string;
  step: number;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ResultData = {
  status: string;
  winner: Recommendation | null;
  recommendations: Recommendation[];
};

export type RecommendationsData = {
  status: string;
  recommendations: Recommendation[];
  participantCount: number;
  isOwner: boolean;
};
