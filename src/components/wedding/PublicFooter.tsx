import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";

const PublicFooter = () => {
  const { config } = useWedding();

  // Fix timezone issue by parsing the date correctly
  const formattedDate = config.weddingDate 
    ? (() => {
        const [year, month, day] = config.weddingDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString("pt-BR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      })()
    : "";

  return (
    <footer className="py-16 bg-foreground text-background">
      <div className="section-container text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-16 h-px bg-gold/50" />
            <Heart className="w-6 h-6 text-gold fill-gold" />
            <div className="w-16 h-px bg-gold/50" />
          </div>

          <p className="font-serif text-xl sm:text-2xl italic mb-6 text-background/80 max-w-2xl mx-auto">
            "Com carinho, esperamos você para celebrar esse dia tão especial conosco."
          </p>

          <h3 className="font-serif text-3xl sm:text-4xl text-gold mb-8">
            {config.coupleName}
          </h3>

          <p className="text-background/60 text-sm capitalize">
            {formattedDate}
          </p>

          <div className="mt-12 pt-8 border-t border-background/10">
            <p className="text-background/40 text-xs">
              Feito com amor para nosso grande dia ❤️
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default PublicFooter;
