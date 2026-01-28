import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import heroCoupleImage from "@/assets/hero-couple.jpg";

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const HeroSection = () => {
  const weddingDate = new Date("2025-08-15T16:00:00");
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
  }, []);

  const scrollToInfo = () => {
    document.getElementById("wedding-info")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroCoupleImage}
          alt="Camila e Rafael"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/20 to-foreground/50" />
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
          className="font-serif text-5xl sm:text-7xl lg:text-8xl text-cream mb-6 tracking-tight"
        >
          Camila & Rafael
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-cream/80 text-xl sm:text-2xl font-light italic mb-8 font-serif"
        >
          "Estamos ansiosos para celebrar esse dia com você"
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mb-12"
        >
          <p className="text-gold-light text-2xl sm:text-3xl font-serif tracking-wide">
            15 de Agosto de 2025
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
          ].map((item, index) => (
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

export default HeroSection;
