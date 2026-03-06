import { useState, useEffect } from "react";
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
  paymentCreditCard?: boolean;
  paymentPix?: boolean;
  paymentBoleto?: boolean;
  maxInstallments?: number;
}

const PublicLandingContent = ({ 
  weddingId,
  mercadoPagoPublicKey,
  paymentCreditCard,
  paymentPix,
  paymentBoleto,
  maxInstallments,
}: {
  weddingId?: string;
  mercadoPagoPublicKey?: string | null;
  paymentCreditCard?: boolean;
  paymentPix?: boolean;
  paymentBoleto?: boolean;
  maxInstallments?: number;
}) => {
  const { config } = useWedding();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Apply layout theme to root element
  useEffect(() => {
    document.documentElement.setAttribute('data-layout', config.layout || 'classic');
    return () => {
      document.documentElement.removeAttribute('data-layout');
    };
  }, [config.layout]);

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
            paymentCreditCard={paymentCreditCard}
            paymentPix={paymentPix}
            paymentBoleto={paymentBoleto}
            maxInstallments={maxInstallments}
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
