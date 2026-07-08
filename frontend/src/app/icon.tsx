import { ImageResponse } from "next/og";

export const dynamic = "force-static";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 176,
          fontWeight: 700,
          letterSpacing: "-0.06em",
          borderRadius: 120,
          border: "18px solid rgba(255, 240, 229, 0.18)",
        }}
      >
        JD
      </div>
    ),
    size,
  );
}
