import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, #2f241f 0%, #5d3323 45%, #b96a39 100%)",
          color: "#fff7f2",
          fontSize: 68,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          borderRadius: 42,
          border: "8px solid rgba(255, 240, 229, 0.16)",
        }}
      >
        JD
      </div>
    ),
    size,
  );
}
