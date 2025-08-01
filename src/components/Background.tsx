import Box from "@mui/material/Box";
import type { ReactNode } from "react";

interface BackgroundProps {
  InnerBox: ReactNode;
}

export const Background = ({InnerBox}:BackgroundProps) => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "linear-gradient(180deg, #ffffff 0%, #fef7f9 50%, #fceef2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "20px",
        margin: 0,
        zIndex: 0,
      }}
    >{InnerBox}</Box>
  );
};
