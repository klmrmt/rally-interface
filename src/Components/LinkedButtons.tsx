import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";

interface LinkedButtonsProps {
  link: string;
  BackgroundColor: string;
  color: string;
  text: string;
  borderColor: string;
}

export const LinkedButtons = ({
  link,
  BackgroundColor,
  color,
  text,
  borderColor,
}: LinkedButtonsProps) => {
  const navigate = useNavigate();
  return (
    <Button
      variant="contained"
      sx={{
        backgroundColor: BackgroundColor,
        color: color,
        marginTop: "2rem",
        width: { xs: 300, sm: 300 },
        height: "15vh",
        font: "RethinkSans",
        fontSize: "2rem",
        borderColor: borderColor,
        "&:hover": {
          backgroundColor: BackgroundColor,
          borderColor: "#ED70C0",
        },
      }}
      onClick={() => navigate("/join")}
    >
      {text}
    </Button>
  );
};
