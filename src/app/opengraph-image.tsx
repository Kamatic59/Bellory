import { ImageResponse } from "next/og";

export const alt = "Bellory — the AI receptionist that answers missed garage door calls";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ink = "#12120E";
const cream = "#F3F1E6";
const mint = "#C6F23D";
const muted = "#99978C";

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
            "radial-gradient(ellipse 900px 500px at 85% -10%, rgba(198,242,61,0.14), transparent), radial-gradient(ellipse 700px 400px at 0% 110%, rgba(255,122,26,0.08), transparent)",
          color: cream,
          fontFamily: "sans-serif",
        }}
      >
        {/* top rail */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <svg width="63" height="42" viewBox="0 0 288 192">
              <path
                d="M122 0 L170 0 C169 6 168 11 167 16 L100 160 C93 175 80 188 48 192 L0 192 C1 186 2 181 3 176 L70 32 C77 17 90 4 122 0 Z"
                fill={mint}
              />
              <path
                d="M122 0 L170 0 C169 6 168 11 167 16 L100 160 C93 175 80 188 48 192 L0 192 C1 186 2 181 3 176 L70 32 C77 17 90 4 122 0 Z"
                fill={mint}
                transform="translate(117 0)"
              />
            </svg>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 700, letterSpacing: -1, color: cream }}>Bellory</div>
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
            borderTop: "1px dashed rgba(243,241,230,0.28)",
            paddingTop: 30,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, color: muted }}>
            <div style={{ display: "flex", color: muted }}>9:47 PM</div>
            <div style={{ display: "flex", color: "#99978C" }}>Broken spring · car trapped</div>
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
