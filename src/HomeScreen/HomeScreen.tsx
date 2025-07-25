import RALLY from "../assets/RALLY-2.png";
import { LinkedButtons } from "../components/LinkedButtons";
import RallyLogo from "../components/RallyLogo";
import { Box } from "@mui/material";

export const HomeScreen = () => {
  return (
    <Box sx={{ textAlign: "center", mt: "4" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <RallyLogo
          RALLY={RALLY}
          width="500px"
          height="500px"
          marginBottom="20px"
        />
        <LinkedButtons
          link="/join"
          BackgroundColor="#000000"
          color="#ffffff"
          text="RALLY UP!"
          borderColor="#ED70C0"
        />
        <LinkedButtons
          link="/join"
          BackgroundColor="#ED70C0"
          color="#ffffff"
          text="Join the Rally!"
          borderColor="#ED70C0"
        />
      </Box>
    </Box>
  );
};
