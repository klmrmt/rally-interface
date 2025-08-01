import RALLY from "../assets/RALLY-2.png";
import { LinkedButtons } from "../components/LinkedButtons";
import RallyLogo from "../components/RallyLogo";
import { Box } from "@mui/material";
import { Background } from "../components/Background";

export const HomeScreen = () => {
  return (
    <Background
      InnerBox={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <RallyLogo RALLY={RALLY} />
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
      }
    ></Background>
  );
};
