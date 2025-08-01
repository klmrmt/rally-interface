import { useState } from "react";
import { Box } from "@mui/material";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import Button from "@mui/material/Button";
import IosShareIcon from "@mui/icons-material/IosShare";
import { SectionLabel } from "../components/SectionLabel";
import { ToggleButtonGroups } from "../components/ToggleButtonGroups";
import { Background } from "../components/Background";

interface JoinScreenProps {
  Name: string;
  Date: string;
  Aria: string;
}

export const JoinScreen = () => {
  const [vibe, setVibe] = useState<string[]>([]);
  const [location, setLocation] = useState<string[]>([]);

  const handleVibeChange = (
    event: React.MouseEvent<HTMLElement>,
    newVibe: string[]
  ) => {
    setVibe(newVibe);
  };

  const handleLocationChange = (
    event: React.MouseEvent<HTMLElement>,
    newLocation: string[]
  ) => {
    setLocation(newLocation);
  };

  const handleSubmit = () => {
    console.log("Submitting...");
    console.log("Vibe:", vibe);
    console.log("Location:", location);
  };

  return (
    <Background
      InnerBox={
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            minHeight: "100vh",
            width: "100%",
            maxWidth: { xs: "100%", sm: 500, md: 700 },
            background: "white",
            borderRadius: { xs: "8px", sm: "8px" },
            boxShadow: { xs: "none", sm: "0 4px 6px rgba(0, 0, 0, 0.1)" },
            p: { xs: 2, sm: 4 },
            overflow: "auto",
            maxHeight: "90vh",
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
              mb: 2,
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            Diddy's Party
            <br />
            <span style={{ fontSize: "1.5rem" }}>We're Rallying On</span>
            <br />
            <span style={{ fontSize: "1.25rem" }}>Date and Time</span>
          </Typography>

          <SectionLabel Name={"Vibe"} />

          <ToggleButtonGroups
            value={vibe}
            onChange={handleVibeChange}
            options={[
              { Name: "Chill😎", Value: "Chill", Aria: "Hello" },
              { Name: "Hype🔥", Value: "Hype", Aria: "Hello" },
              { Name: "Active💃", Value: "Active", Aria: "Hello" },
              { Name: "Foodie🍽️", Value: "Foodie", Aria: "Hello" },
              { Name: "Art & Culture 🎭", Value: "Art", Aria: "Hello" },
            ]}
          />

          <SectionLabel Name={"Location"} />

          <ToggleButtonGroups
            value={location}
            onChange={handleLocationChange}
            options={[
              { Name: "1 Mile", Value: "1 Mile", Aria: "Hello" },
              { Name: "2 Miles", Value: "2 Miles", Aria: "Hello" },
              { Name: "5 Miles", Value: "5 Miles", Aria: "Hello" },
              { Name: "10 Miles", Value: "10 Miles", Aria: "Hello" },
            ]}
          />

          <SectionLabel Name={"Price"} />
          <Slider
            aria-label="Cost"
            defaultValue={30}
            valueLabelDisplay="auto"
            shiftStep={30}
            step={10}
            marks
            min={10}
            max={110}
            sx={{
              color: "#ED70C0",
              "& .MuiSlider-thumb": {
                width: 8,
                height: 28,
                borderRadius: 2, // less round = more bar-like
                backgroundColor: "#ED70C0",
                "&:hover, &.Mui-focusVisible, &.Mui-active": {
                  boxShadow: "0 0 0 8px rgba(25, 118, 210, 0.16)",
                },
              },
              "& .MuiSlider-track": {
                height: 8,
                width: 30,
                borderRadius: 4,
              },
              "& .MuiSlider-rail": {
                height: 8,
                borderRadius: 4,
              },
            }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            sx={{
              backgroundColor: "#ED70C0",
            }}
          >
            Lets Rally!! <IosShareIcon />
          </Button>
        </Box>
      }
    ></Background>
  );
};
