import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Clock, MapPin, Church, PartyPopper } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";

const PublicWeddingInfo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();

  const generateMapUrl = (address: string) => {
    const encoded = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encoded}`;
  };

  return (
    <section id="wedding-info" ref={ref} className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Informações</p>
          <h2 className="section-title">Quando & Onde</h2>
          <div className="gold-divider mt-6" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Ceremony */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="card-wedding"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-gold/10 text-gold">
                <Church className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-foreground">Cerimônia</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5 text-gold" />
                <span>{config.ceremonyDate}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-5 h-5 text-gold" />
                <span>{config.ceremonyTime}</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{config.ceremonyLocation}</p>
                  <p className="text-sm">{config.ceremonyAddress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden h-48 bg-muted">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.ceremonyAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa - Cerimônia"
              />
            </div>
          </motion.div>

          {/* Reception */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="card-wedding"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-gold/10 text-gold">
                <PartyPopper className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl text-foreground">Recepção</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="w-5 h-5 text-gold" />
                <span>{config.ceremonyDate}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="w-5 h-5 text-gold" />
                <span>{config.receptionTime}</span>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{config.receptionLocation}</p>
                  <p className="text-sm">{config.receptionAddress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg overflow-hidden h-48 bg-muted">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(config.receptionAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa - Recepção"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PublicWeddingInfo;
