import { ToggleButtonGroup } from "@mui/material";
import { ToggleButtons } from "./ToggleButtons";

interface Option {
  Name: string;
  Value: string;
  Aria: string;
}

interface ToggleGroupProps {
  value: string[];
  onChange: (event: React.MouseEvent<HTMLElement>, newValue: string[]) => void;
  options: Option[];
}

export const ToggleButtonGroups = ({
  value,
  onChange,
  options,
}: ToggleGroupProps) => (
  <ToggleButtonGroup
    value={value}
    onChange={onChange}
    aria-label="toggle group"
    sx={{
      gap: { xs: 1, sm: 2 },
      flexWrap: "wrap",
      justifyContent: "flex-start",
      "& .MuiToggleButton-root": {
        borderRadius: 2,
        width: { xs: 250, sm: 150 },
        fontSize: { xs: "1rem", sm: "1rem" },
        fontWeight: "bold",
        display: "flex-start",
        justifyContent: "center",
        alignItems: "center",
      },
    }}
  >
    {options.map((opt) => (
      <ToggleButtons
        key={opt.Value}
        Name={opt.Name}
        Value={opt.Value}
        Aria={opt.Aria}
      />
    ))}
  </ToggleButtonGroup>
);
