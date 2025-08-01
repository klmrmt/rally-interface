import { ToggleButton } from "@mui/material";

interface ToggleButtonsProps {
  Name: string;
  Value: string;
  Aria: string;
}

export const ToggleButtons = ({ Name, Value, Aria }: ToggleButtonsProps) => {
  return (
    <ToggleButton
      value={Value}
      aria-label={Aria}
      sx={{
        px: 3,
        py: 1.5,
        height: 40,
        backgroundColor: "#fff",
        color: "#333",
        margin: "10px",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        textTransform: "none",
        "&.Mui-selected": {
          backgroundColor: "#000000ff",
          color: "#ED70C0",
          fontWeight: "bold",
        },
        "&:hover": {
          backgroundColor: "#f3c6e8",
        },
      }}
    >
      {Name}
    </ToggleButton>
  );
};
