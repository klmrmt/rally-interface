import type { NavigateFunction } from "react-router-dom";

export function navigateByStatus(
  navigate: NavigateFunction,
  hexId: string,
  status: string,
  hasVoted: boolean
) {
  if (status === "voting") {
    if (hasVoted) {
      navigate(`/${hexId}/waiting`, { replace: true });
    } else {
      navigate(`/${hexId}/vote`, { replace: true });
    }
  } else if (status === "picking" || status === "recommending") {
    navigate(`/${hexId}/recommendations`, { replace: true });
  } else {
    navigate(`/${hexId}/result`, { replace: true });
  }
}
