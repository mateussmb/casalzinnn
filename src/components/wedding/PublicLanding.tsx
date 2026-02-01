import { useWedding, WeddingConfig } from "@/contexts/WeddingContext";
import PublicHero from "./PublicHero";
import PublicAbout from "./PublicAbout";
import PublicWeddingInfo from "./PublicWeddingInfo";
import PublicDressCode from "./PublicDressCode";
import GiftRegistrySection from "./GiftRegistrySection";
import PublicRSVP from "./PublicRSVP";
import PublicMessageWall from "./PublicMessageWall";
import VideoSection from "./VideoSection";
import PhotoGallery from "./PhotoGallery";
import PublicFooter from "./PublicFooter";

interface PublicLandingProps {
  isPreview?: boolean;
  config?: WeddingConfig;
  weddingId?: string;
  mercadoPagoPublicKey?: string | null;
}

const PublicLanding = ({ 
  isPreview = false, 
  config: propConfig,
  weddingId,
  mercadoPagoPublicKey 
}: PublicLandingProps) => {
  const contextData = useWedding();
  const config = propConfig || contextData.config;

  return (
    <main className="overflow-x-hidden">
      <PublicHero />
      
      {config.sections.about && <PublicAbout />}
      
      {config.sections.video && config.videoUrl && (
        <VideoSection videoUrl={config.videoUrl} />
      )}
      
      {config.sections.weddingInfo && <PublicWeddingInfo />}
      
      {config.sections.dressCode && <PublicDressCode />}
      
      {config.sections.gifts && <GiftRegistrySection />}
      
      {config.sections.rsvp && <PublicRSVP />}
      
      {config.sections.gallery && <PhotoGallery />}
      
      {config.sections.messageWall && <PublicMessageWall />}
      
      <PublicFooter />
    </main>
  );
};

export default PublicLanding;
