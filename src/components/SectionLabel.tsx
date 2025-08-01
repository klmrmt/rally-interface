import Typography from "@mui/material/Typography";

interface SectionLabelProps {
  Name: String;
}

export const SectionLabel = ({ Name }: SectionLabelProps) => {
  return (
    <Typography
      variant="body2"
      sx={{
        fontSize: { xs: "0.8rem", sm: "1rem" },
        mb: 2,
        mt: { xs: 2, sm: 4 },
        alignSelf: "flex-start", 
      }}
    >
      {Name}
    </Typography>
  );
};
