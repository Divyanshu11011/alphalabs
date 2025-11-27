import { RocketIllustration } from "@/components/rocket-illustration";
import { HeroShader } from "@/components/hero-shader";
import LD2Navbar from "@/components/ld2-navbar";
import LD2HeroContent from "@/components/ld2-hero-content";
import LD2DashboardPreview from "@/components/ld2-dashboard-preview";
import LD2GallerySection from "@/components/ld2-gallery-section";

export default function LD2Page() {
  return (
    <>
      <LD2Navbar />
      <LD2HeroContent />
      <LD2DashboardPreview />
      <LD2GallerySection />
      <div
        className="am-shader-container"
        style={{
          flexFlow: "column",
          inset: "0%",
          zIndex: -1,
          aspectRatio: "1282 / 868",
          width: "92%",
          marginTop: "12rem",
          display: "flex",
          position: "absolute",
        }}
      >
        <RocketIllustration />
        <HeroShader
          color1={[232, 64, 13]}
          color2={[255, 238, 216]}
          color3={[208, 178, 255]}
        />
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
body {
  background-color: white !important;
  margin: 0;
  min-height: 100vh;
}
`,
        }}
      />
    </>
  );
}
