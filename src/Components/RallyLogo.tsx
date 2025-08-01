import { Box } from "@mui/material";

interface RallyLogoProps {
  RALLY: string;
}

export default function RallyLogo({ RALLY }: RallyLogoProps) {
  return (
    <Box
      component="img"
      src={RALLY}
      alt="RALLY"
      sx={{
        width: {
          xs: "300px",
          sm: "350px",
          md: "400px",
        },
        height: {
          xs: "300px",
          sm: "350px",
          md: "400px",
        },
        marginBottom: {
          xs: "10px",
          sm: "15px",
          md: "20px",
          lg: "25px",
          xl: "30px",
        },
      }}
    />
  );
}
