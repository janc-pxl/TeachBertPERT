import Image from "next/image";
import pxlLogo from "../../../public/pxl-logo-64.png";

export function Footer() {
  return (
    <footer style={{ background: "#030203", padding: "1.5rem" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: "1.2rem",
          flexWrap: "wrap",
        }}
      >
        <Image
          src={pxlLogo}
          alt="Hogeschool PXL"
          width={36}
          height={36}
          style={{ borderRadius: "50%" }}
        />
        <span
          style={{
            fontFamily: "'Raleway', Arial, sans-serif",
            fontSize: ".82rem",
            color: "rgba(255,255,255,.6)",
          }}
        >
          Hogeschool PXL &bull; Elfde-Liniestraat 24 &bull; B-3500 HASSELT &bull; www.pxl.be
        </span>
      </div>
    </footer>
  );
}
