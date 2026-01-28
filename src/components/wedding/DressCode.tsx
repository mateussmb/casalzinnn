import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Shirt, AlertCircle, Info, Sun } from "lucide-react";

interface Guideline {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const DressCode = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const guidelines: Guideline[] = [
    {
      icon: <Shirt className="w-6 h-6" />,
      title: "Traje Sugerido",
      description: "Esporte fino. Para homens, terno ou blazer com calça social. Para mulheres, vestido longo ou midi elegante.",
    },
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: "Cores a Evitar",
      description: "Pedimos gentilmente que evitem branco, off-white e tons muito claros de bege, cores reservadas para a noiva.",
    },
    {
      icon: <Sun className="w-6 h-6" />,
      title: "Cerimônia ao Ar Livre",
      description: "A cerimônia será realizada em ambiente externo. Recomendamos calçados confortáveis para caminhar na grama.",
    },
    {
      icon: <Info className="w-6 h-6" />,
      title: "Informações Importantes",
      description: "Pedimos que cheguem com 30 minutos de antecedência. Haverá estacionamento no local.",
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

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {guidelines.map((guideline, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              className="card-wedding flex gap-4"
            >
              <div className="p-3 rounded-full bg-gold/10 text-gold h-fit">
                {guideline.icon}
              </div>
              <div>
                <h3 className="font-serif text-xl text-foreground mb-2">
                  {guideline.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {guideline.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DressCode;
