import { useState } from "react";
import * as React from "react";
import { Box, ToggleButtonGroup } from "@mui/material";
import Typography from "@mui/material/Typography";
import { ToggleButtons } from "../components/ToggleButtons";

interface ToggleButtonsProps {
  Name: string;
  Value: string;
  Aria: string;
}

export const JoinScreen = () => {
  const [formats, setFormats] = React.useState(() => ["bold", "italic"]);

  const handleFormat = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[]
  ) => {
    setFormats(newFormats);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        minHeight: "100vh",
        width: "100%",
        maxWidth: { xs: "100%", sm: 500, md: 700 }, // Responsive max width
        background: "white",
        borderRadius: { xs: 0, sm: "8px" }, // No radius on mobile, rounded on desktop
        boxShadow: { xs: "none", sm: "0 4px 6px rgba(0, 0, 0, 0.1)" },
        p: { xs: 2, sm: 4 }, // Responsive padding
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontSize: { xs: "1.5rem", sm: "2.125rem" },
          mb: 1,
        }}
      >
        Diddy's Party
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontSize: { xs: "1rem", sm: "1.5rem" },
          mb: 1,
        }}
      >
        We're Rallying On
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontSize: { xs: "0.9rem", sm: "1.25rem" },
          mb: 1,
        }}
      >
        Date and Time
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontSize: { xs: "0.8rem", sm: "1rem" },
          mb: 2,
          mt: { xs: 2, sm: 4 },
          alignSelf: "flex-start", // Aligns "Vibe" to the left
        }}
      >
        Vibe
      </Typography>

      <ToggleButtonGroup
        value={formats}
        onChange={handleFormat}
        aria-label="text formatting"
        sx={{
          gap: { xs: 1, sm: 2 },
          flexWrap: "wrap",
          justifyContent: "flex-start",
          "& .MuiToggleButton-root": {
            borderRadius: 2,
            width: { xs: 250, sm: 150 }, // Set to fit your widest button
            fontSize: { xs: "1rem", sm: "1rem" },
            fontWeight: "bold",
            display: "flex-start",
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        <ToggleButtons Name={"Chill😎"} Value={"first"} Aria={"Hello"} />
        <ToggleButtons Name={"Hype🔥"} Value={"second"} Aria={"Hello"} />
        <ToggleButtons Name={"Foodie🍽️"} Value={"third"} Aria={"Hello"} />
        <ToggleButtons Name={"Active💃"} Value={"fourth"} Aria={"Hello"} />
        <ToggleButtons
          Name={"Art & Culture🎭"}
          Value={"fifth"}
          Aria={"Hello"}
        />
      </ToggleButtonGroup>
    </Box>
  );
};
