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
        width: {
          xs: "100px",
          sm: "150px",
          md: "200px",
        },
        height: {
          xs: "60px",
          sm: "62.5px",
          md: "65px",
        },
        font: "RethinkSans",
        fontSize: {
          xs: "12.5px",
          sm: "15px",
          md: "20px",
        },
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
