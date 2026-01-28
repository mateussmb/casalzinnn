import HeroSection from "@/components/wedding/HeroSection";
import AboutCouple from "@/components/wedding/AboutCouple";
import VideoSection from "@/components/wedding/VideoSection";
import WeddingInfo from "@/components/wedding/WeddingInfo";
import DressCode from "@/components/wedding/DressCode";
import RSVPSection from "@/components/wedding/RSVPSection";
import GiftRegistry from "@/components/wedding/GiftRegistry";
import PhotoGallery from "@/components/wedding/PhotoGallery";
import MessageWall from "@/components/wedding/MessageWall";
import Footer from "@/components/wedding/Footer";

const Index = () => {
  // Configuração do casal - pode ser alimentado por dados do backend
  const weddingConfig = {
    // URL do vídeo do casal (opcional - deixe vazio para esconder a seção)
    videoUrl: "", // Exemplo: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  };

  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <AboutCouple />
      <VideoSection videoUrl={weddingConfig.videoUrl} />
      <WeddingInfo />
      <DressCode />
      <RSVPSection />
      <GiftRegistry />
      <PhotoGallery />
      <MessageWall />
      <Footer />
    </main>
  );
};

export default Index;
