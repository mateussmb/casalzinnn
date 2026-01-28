import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shirt, AlertCircle, Info, Sun } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";

const PublicDressCode = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();

  const guidelines = [
    {
      icon: <Shirt className="w-6 h-6" />,
      title: "Traje Sugerido",
      description: config.dressCodeText,
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Cores a Evitar",
      description: config.colorsToAvoid,
    },
    {
      icon: <Info className="w-6 h-6" />,
      title: "Informações Importantes",
      description: config.additionalInfo,
    },
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
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Orientações</p>
          <h2 className="section-title">Dress Code & Dicas</h2>
          <div className="gold-divider mt-6" />
          <p className="section-subtitle max-w-2xl mx-auto">
            Algumas orientações para que você aproveite ao máximo esse dia especial conosco
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {guidelines.map((guideline, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              className="card-wedding text-center"
            >
              <div className="p-4 rounded-full bg-gold/10 text-gold w-fit mx-auto mb-4">
                {guideline.icon}
              </div>
              <h3 className="font-serif text-xl text-foreground mb-3">
                {guideline.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {guideline.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PublicDressCode;
