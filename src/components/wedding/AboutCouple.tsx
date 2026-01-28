import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import coupleStory1 from "@/assets/couple-story-1.jpg";
import coupleStory2 from "@/assets/couple-story-2.jpg";
import coupleStory3 from "@/assets/couple-story-3.jpg";

const AboutCouple = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const storyParagraphs = [
    "Nossa história começou de um jeito que nem os melhores roteiristas poderiam imaginar. Era 2019, uma festa de aniversário de um amigo em comum, e nossos olhares se cruzaram do outro lado da sala.",
    "Rafael diz que foi amor à primeira vista. Camila confessa que precisou de um pouco mais de convencimento — mas apenas algumas semanas. O primeiro encontro foi em uma cafeteria aconchegante no centro da cidade, onde conversamos por horas sem perceber o tempo passar.",
    "Desde então, construímos juntos sonhos, viagens inesquecíveis, e a certeza de que queríamos passar o resto de nossas vidas um ao lado do outro. O pedido de casamento veio em um pôr do sol mágico, no mesmo lugar onde nos conhecemos.",
  ];

  const images = [
    { src: coupleStory1, alt: "Camila e Rafael passeando" },
    { src: coupleStory2, alt: "Momento de risadas" },
    { src: coupleStory3, alt: "O pedido de casamento" },
  ];

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
            {storyParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className="text-muted-foreground text-lg leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
            <p className="text-gold font-serif text-xl italic mt-8">
              "E agora, estamos prontos para dar o próximo passo juntos."
            </p>
          </motion.div>

          {/* Photo Grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="col-span-2">
              <img
                src={images[0].src}
                alt={images[0].alt}
                className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-card"
              />
            </div>
            {images.slice(1).map((image, index) => (
              <div key={index}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-48 sm:h-56 object-cover rounded-lg shadow-card"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutCouple;
