import { WeddingProvider } from "@/contexts/WeddingContext";
import PublicLanding from "@/components/wedding/PublicLanding";

const Demo = () => {
  return (
    <WeddingProvider>
      <PublicLanding isPreview />
    </WeddingProvider>
  );
};

export default Demo;
