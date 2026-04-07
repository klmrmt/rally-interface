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
  rallyId: string;
  name: string;
  category: string | null;
  whyItFits: string | null;
  distanceLabel: string | null;
  priceLevel: string | null;
  rating: number | null;
  imageUrl: string | null;
  mapsUrl: string | null;
};

export type VoteTally = {
  recommendationId: string;
  count: number;
};

export type Feedback = {
  id: string;
  liked: boolean;
  tags: string[];
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
