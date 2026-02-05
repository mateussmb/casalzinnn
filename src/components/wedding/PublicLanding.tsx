import { useState } from "react";
import { useWedding, WeddingConfig } from "@/contexts/WeddingContext";
import { CartProvider } from "@/contexts/CartContext";
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
import CartButton from "./CartButton";
import CheckoutModal from "./CheckoutModal";

interface PublicLandingProps {
  isPreview?: boolean;
  config?: WeddingConfig;
  weddingId?: string;
  mercadoPagoPublicKey?: string | null;
}

const PublicLandingContent = ({ 
  weddingId,
  mercadoPagoPublicKey 
}: {
  weddingId?: string;
  mercadoPagoPublicKey?: string | null;
}) => {
  const { config } = useWedding();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  return (
    <>
      <main className="overflow-x-hidden">
        <PublicHero />
        
        {config.sections.about && <PublicAbout />}
        
        {config.sections.video && config.videoUrl && (
          <VideoSection videoUrl={config.videoUrl} />
        )}
        
        {config.sections.weddingInfo && <PublicWeddingInfo />}
        
        {config.sections.dressCode && <PublicDressCode />}
        
        {config.sections.gifts && <GiftRegistrySection />}
        
        {config.sections.rsvp && <PublicRSVP weddingId={weddingId} />}
        
        {config.sections.gallery && <PhotoGallery />}
        
        {config.sections.messageWall && <PublicMessageWall weddingId={weddingId} />}
        
        <PublicFooter />
      </main>

      {config.sections.gifts && (
        <>
          <CartButton onClick={() => setIsCheckoutOpen(true)} />
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            weddingId={weddingId || ""}
            mercadoPagoPublicKey={mercadoPagoPublicKey}
          />
        </>
      )}
    </>
  );
};

const PublicLanding = ({ 
  isPreview = false, 
  config: propConfig,
  weddingId,
  mercadoPagoPublicKey 
}: PublicLandingProps) => {
  return (
    <CartProvider>
      <PublicLandingContent 
        weddingId={weddingId}
        mercadoPagoPublicKey={mercadoPagoPublicKey}
      />
    </CartProvider>
  );
};

export default PublicLanding;
