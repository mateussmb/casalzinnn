import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Calendar, Clock, MapPin, Church, PartyPopper, ExternalLink } from "lucide-react";
import venueImage from "@/assets/venue.jpg";

interface EventInfo {
  title: string;
  icon: React.ReactNode;
  date: string;
  time: string;
  location: string;
  address: string;
  mapUrl: string;
}

const WeddingInfo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const ceremony: EventInfo = {
    title: "Cerimônia",
    icon: <Church className="w-8 h-8" />,
    date: "15 de Agosto de 2025",
    time: "16:00",
    location: "Igreja Nossa Senhora da Paz",
    address: "Rua das Flores, 123 - Jardim Botânico, São Paulo - SP",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975737381287!2d-46.66955388502208!3d-23.56168198468096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQyLjEiUyA0NsKwMzknNTYuMyJX!5e0!3m2!1spt-BR!2sbr!4v1234567890",
  };

  const reception: EventInfo = {
    title: "Recepção",
    icon: <PartyPopper className="w-8 h-8" />,
    date: "15 de Agosto de 2025",
    time: "18:30",
    location: "Villa Garden Eventos",
    address: "Av. das Palmeiras, 456 - Alto de Pinheiros, São Paulo - SP",
    mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1975737381287!2d-46.66955388502208!3d-23.56168198468096!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMzJzQyLjEiUyA0NsKwMzknNTYuMyJX!5e0!3m2!1spt-BR!2sbr!4v1234567890",
  };

  // Converte URL do embed para URL de busca do Google Maps
  const getDirectionsUrl = (address: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const EventCard = ({ event, delay }: { event: EventInfo; delay: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay }}
      className="card-wedding"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-full bg-gold/10 text-gold">
          {event.icon}
        </div>
        <h3 className="font-serif text-2xl text-foreground">{event.title}</h3>
      </div>

      <div className="space-y-4 mb-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Calendar className="w-5 h-5 text-gold flex-shrink-0" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Clock className="w-5 h-5 text-gold flex-shrink-0" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-start gap-3 text-muted-foreground">
          <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{event.location}</p>
            <p className="text-sm mt-0.5">{event.address}</p>
          </div>
        </div>
      </div>

      {/* Botão de mapa elegante no lugar do iframe */}
      <a
        href={getDirectionsUrl(event.address)}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center justify-between w-full px-5 py-4 rounded-xl border border-gold/30 bg-gold/5 hover:bg-gold/10 hover:border-gold/60 transition-all duration-300"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gold/15 group-hover:bg-gold/25 transition-colors">
            <MapPin className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Ver no mapa</p>
            <p className="text-xs text-muted-foreground">Abrir no Google Maps</p>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gold/60 group-hover:text-gold transition-colors" />
      </a>
    </motion.div>
  );

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

        {/* Venue Image */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <img
            src={venueImage}
            alt="Local da cerimônia"
            className="w-full h-64 sm:h-80 object-cover rounded-xl shadow-card"
          />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <EventCard event={ceremony} delay={0.3} />
          <EventCard event={reception} delay={0.4} />
        </div>
      </div>
    </section>
  );
};

export default WeddingInfo;
