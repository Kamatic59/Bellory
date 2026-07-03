import { ImageResponse } from "next/og";

export const alt = "Bellory — the AI receptionist that answers missed garage door calls";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#100E0A";
const cream = "#FFF7E8";
const mint = "#C7F76F";
const muted = "#94836A";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: ink,
          backgroundImage:
            "radial-gradient(ellipse 900px 500px at 85% -10%, rgba(199,247,111,0.14), transparent), radial-gradient(ellipse 700px 400px at 0% 110%, rgba(246,198,106,0.08), transparent)",
          color: cream,
          fontFamily: "sans-serif",
        }}
      >
        {/* top rail */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(199,247,111,0.12)",
                border: "1px solid rgba(199,247,111,0.35)",
                color: mint,
                fontSize: 24,
              }}
            >
              ●
            </div>
            <div style={{ display: "flex", fontSize: 34, letterSpacing: -1, color: cream }}>Bellory</div>
          </div>
          <div style={{ display: "flex", fontSize: 18, letterSpacing: 5, textTransform: "uppercase", color: muted }}>
            AI receptionist · Private installs
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontSize: 76, letterSpacing: -2, lineHeight: 1.06, color: cream }}>
            It&apos;s 9:47 PM. A spring just snapped.
          </div>
          <div style={{ display: "flex", fontSize: 76, letterSpacing: -2, lineHeight: 1.06, color: mint }}>
            Bellory answers.
          </div>
        </div>

        {/* bottom ledger line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px dashed rgba(255,247,232,0.28)",
            paddingTop: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, color: muted }}>
            <div style={{ display: "flex", color: muted }}>9:47 PM</div>
            <div style={{ display: "flex", color: "#C6B9A6" }}>Broken spring · car trapped</div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 10,
              border: `2px solid ${mint}`,
              color: mint,
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              transform: "rotate(-2deg)",
            }}
          >
            Booked · 7:30 AM
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
