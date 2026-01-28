import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown, Heart } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import heroCoupleImage from "@/assets/hero-couple.jpg";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const PublicHero = () => {
  const { config } = useWedding();
  const weddingDate = new Date(config.weddingDate + "T16:00:00");
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference > 0) {
        setCountdown({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [config.weddingDate]);

  const scrollToInfo = () => {
    document.getElementById("wedding-info")?.scrollIntoView({ behavior: "smooth" });
  };

  const formattedDate = new Date(config.weddingDate).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasHeroImage = config.heroImage || heroCoupleImage;

  // Layout-specific styles
  const layoutStyles = {
    classic: {
      overlay: "bg-gradient-to-b from-foreground/30 via-foreground/20 to-foreground/50",
      titleClass: "font-serif",
    },
    modern: {
      overlay: "bg-gradient-to-b from-slate-900/40 via-slate-900/30 to-slate-900/60",
      titleClass: "font-sans tracking-tight",
    },
    minimalist: {
      overlay: "bg-gradient-to-b from-stone-900/20 via-transparent to-stone-900/40",
      titleClass: "font-serif font-light",
    },
  };

  const currentStyle = layoutStyles[config.layout];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        {hasHeroImage ? (
          <>
            <img
              src={config.heroImage || heroCoupleImage}
              alt={config.coupleName}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 ${currentStyle.overlay}`} />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary via-muted to-accent flex items-center justify-center">
            <Heart className="w-40 h-40 text-gold/20" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-cream/90 text-lg sm:text-xl tracking-[0.3em] uppercase mb-4 font-light">
            Vamos nos casar
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className={`${currentStyle.titleClass} text-5xl sm:text-7xl lg:text-8xl text-cream mb-6`}
        >
          {config.coupleName}
        </motion.h1>

        {config.tagline && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-cream/80 text-xl sm:text-2xl font-light italic mb-8 font-serif"
          >
            "{config.tagline}"
          </motion.p>
        )}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-12"
        >
          <p className="text-gold-light text-2xl sm:text-3xl font-serif tracking-wide capitalize">
            {formattedDate}
          </p>
        </motion.div>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex justify-center gap-4 sm:gap-8 mb-12"
        >
          {[
            { value: countdown.days, label: "Dias" },
            { value: countdown.hours, label: "Horas" },
            { value: countdown.minutes, label: "Min" },
            { value: countdown.seconds, label: "Seg" },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center bg-cream/10 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-3 sm:py-4 border border-cream/20"
            >
              <span className="block text-3xl sm:text-4xl lg:text-5xl font-serif text-cream">
                {String(item.value).padStart(2, "0")}
              </span>
              <span className="text-cream/70 text-xs sm:text-sm uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          onClick={scrollToInfo}
          className="btn-wedding group"
        >
          Ver informações do casamento
          <ChevronDown className="ml-2 w-5 h-5 group-hover:translate-y-1 transition-transform" />
        </motion.button>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-cream/40 rounded-full flex justify-center p-2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-cream/60 rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default PublicHero;
