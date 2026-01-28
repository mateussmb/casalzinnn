import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Gift, Plane, ExternalLink, Heart } from "lucide-react";

interface GiftOption {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  link: string;
}

const GiftRegistry = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const giftOptions: GiftOption[] = [
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Lista de Presentes",
      description: "Selecionamos alguns itens especiais que vão nos ajudar a construir nosso novo lar juntos.",
      buttonText: "Ver Lista",
      link: "#",
    },
    {
      icon: <Plane className="w-8 h-8" />,
      title: "Cotas de Lua de Mel",
      description: "Ajude-nos a realizar o sonho da nossa lua de mel perfeita com cotas de diferentes valores.",
      buttonText: "Contribuir",
      link: "#",
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
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Presentes</p>
          <h2 className="section-title">Lista de Presentes</h2>
          <div className="gold-divider mt-6" />
          <p className="section-subtitle max-w-2xl mx-auto">
            Sua presença é o nosso maior presente. Mas se desejar nos presentear, 
            preparamos algumas opções especiais.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {giftOptions.map((option, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              className="card-wedding text-center group hover:shadow-elevated transition-shadow duration-300"
            >
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-gold/20 transition-colors">
                <span className="text-gold">{option.icon}</span>
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-4">
                {option.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {option.description}
              </p>
              <a
                href={option.link}
                className="btn-wedding-outline inline-flex items-center"
              >
                {option.buttonText}
                <ExternalLink className="ml-2 w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-rose" />
            Agradecemos do fundo do coração
            <Heart className="w-5 h-5 text-rose" />
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default GiftRegistry;
