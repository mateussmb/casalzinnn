import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { X, Heart } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import heroCoupleImage from "@/assets/hero-couple.jpg";
import coupleStory1 from "@/assets/couple-story-1.jpg";
import coupleStory2 from "@/assets/couple-story-2.jpg";
import coupleStory3 from "@/assets/couple-story-3.jpg";
import venueImage from "@/assets/venue.jpg";

interface Photo {
  src: string;
  alt: string;
  span?: "col" | "row" | "both";
}

const PhotoGallery = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { config } = useWedding();

  // Use couple's uploaded photos if available, otherwise fallback to defaults
  const hasStoryPhotos = config.storyPhotos && config.storyPhotos.length > 0;
  const defaultPhotos: Photo[] = [
    { src: heroCoupleImage, alt: "Foto principal", span: "both" },
    { src: coupleStory1, alt: "Passeio no jardim" },
    { src: coupleStory2, alt: "Momento de risadas" },
    { src: coupleStory3, alt: "O pedido" },
    { src: venueImage, alt: "Local da cerimônia", span: "col" },
  ];

  const couplePhotos: Photo[] = hasStoryPhotos
    ? [
        ...(config.heroImage ? [{ src: config.heroImage, alt: `${config.coupleName} - Foto principal`, span: "both" as const }] : []),
        ...config.storyPhotos.map((src, i) => ({
          src,
          alt: `${config.coupleName} - Momento ${i + 1}`,
          span: i === 0 && !config.heroImage ? "both" as const : undefined,
        })),
      ]
    : defaultPhotos;

  const photos = couplePhotos.length > 0 ? couplePhotos : defaultPhotos;

  return (
    <>
      <section ref={ref} className="py-24 sm:py-32 bg-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Galeria</p>
            <h2 className="section-title">Nossos Momentos</h2>
            <div className="gold-divider mt-6" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {photos.map((photo, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                onClick={() => setSelectedPhoto(photo.src)}
                className={`relative overflow-hidden rounded-lg group cursor-pointer ${
                  photo.span === "col"
                    ? "col-span-2"
                    : photo.span === "row"
                    ? "row-span-2"
                    : photo.span === "both"
                    ? "col-span-2 row-span-2"
                    : ""
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                    photo.span === "both" ? "h-64 sm:h-96" : "h-48 sm:h-64"
                  }`}
                />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300" />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      {selectedPhoto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/90 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-background/10 text-background hover:bg-background/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            src={selectedPhoto}
            alt="Foto ampliada"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </>
  );
};

export default PhotoGallery;
