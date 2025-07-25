import { Box } from "@mui/material";

interface RallyLogoProps {
  RALLY: string;
  width: string;
  height: string;
  marginBottom: string;
}

export default function RallyLogo({ RALLY, width, height, marginBottom }: RallyLogoProps) {
  return (
    <Box
      component="img"
      src={RALLY}
      alt="RALLY"
      sx={{
        width: width,
        height: height,
        marginBottom: marginBottom,
      }}
    />
  );
}