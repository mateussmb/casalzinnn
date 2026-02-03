import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { useWedding } from "@/contexts/WeddingContext";
import { Heart } from "lucide-react";
import coupleStory1 from "@/assets/couple-story-1.jpg";
import coupleStory2 from "@/assets/couple-story-2.jpg";
import coupleStory3 from "@/assets/couple-story-3.jpg";

const PublicAbout = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();

  const paragraphs = config.aboutText.split("\n\n").filter(Boolean);

  // Use couple's uploaded photos if available, otherwise fallback to defaults
  const hasStoryPhotos = config.storyPhotos && config.storyPhotos.length > 0;
  const defaultImages = [coupleStory1, coupleStory2, coupleStory3];
  const images = hasStoryPhotos ? config.storyPhotos : defaultImages;

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-secondary/50">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Nossa História</p>
          <h2 className="section-title">Como Tudo Começou</h2>
          <div className="gold-divider mt-6" />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Story Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-muted-foreground text-lg leading-relaxed"
                >
                  {paragraph}
                </p>
              ))
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-muted-foreground italic">
                  Os noivos ainda não contaram sua história...
                </p>
              </div>
            )}
            {paragraphs.length > 0 && (
              <p className="text-gold font-serif text-xl italic mt-8">
                "E agora, estamos prontos para dar o próximo passo juntos."
              </p>
            )}
          </motion.div>

          {/* Photo Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            {/* Main photo - spans two columns */}
            <div className="col-span-2">
              {images[0] ? (
                <img
                  src={images[0]}
                  alt="Nosso momento"
                  className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-card"
                />
              ) : (
                <div className="w-full h-64 sm:h-80 bg-muted rounded-lg shadow-card flex items-center justify-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30" />
                </div>
              )}
            </div>
            {/* Secondary photos */}
            {images.slice(1, 3).map((image, index) => (
              <div key={index}>
                {image ? (
                  <img
                    src={image}
                    alt="Nosso momento"
                    className="w-full h-48 sm:h-56 object-cover rounded-lg shadow-card"
                  />
                ) : (
                  <div className="w-full h-48 sm:h-56 bg-muted rounded-lg shadow-card flex items-center justify-center">
                    <Heart className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PublicAbout;
