import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Send, CheckCircle, Users, Loader2 } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RSVPFormData {
  name: string;
  guests: number;
  attending: "yes" | "no" | "";
}

interface PublicRSVPProps {
  weddingId?: string;
}

const PublicRSVP = ({ weddingId }: PublicRSVPProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RSVPFormData>({
    name: "",
    guests: 1,
    attending: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weddingId) {
      toast.error("Erro ao enviar confirmação. Por favor, recarregue a página.");
      return;
    }

    if (!formData.name.trim() || !formData.attending) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setLoading(true);
    
    try {
      const sanitizedName = formData.name.trim().replace(/[<>]/g, '').substring(0, 200);
      const clampedGuests = Math.max(1, Math.min(20, formData.guests));
      const { error } = await supabase.from("rsvp_responses").insert({
        wedding_id: weddingId,
        guest_name: sanitizedName,
        guests_count: clampedGuests,
        attendance: formData.attending === "yes" ? "confirmed" : "declined",
      });

      if (error) {
        console.error("RSVP error:", error);
        throw error;
      }

      setSubmitted(true);
      toast.success("Confirmação enviada com sucesso!");
    } catch (err) {
      console.error("Error submitting RSVP:", err);
      toast.error("Erro ao enviar confirmação. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) : value,
    }));
  };

  if (submitted) {
    return (
      <section ref={ref} id="rsvp" className="py-24 sm:py-32 bg-background">
        <div className="section-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg mx-auto text-center card-wedding"
          >
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-gold" />
            </div>
            <h3 className="font-serif text-3xl text-foreground mb-4">
              Confirmação Recebida!
            </h3>
            <p className="text-muted-foreground text-lg">
              {formData.attending === "yes"
                ? "Que alegria! Mal podemos esperar para celebrar esse dia especial com você."
                : "Sentiremos sua falta, mas agradecemos por nos avisar."}
            </p>
            <p className="text-gold font-serif text-xl mt-6 italic">
              Com carinho, {config.coupleName}
            </p>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section ref={ref} id="rsvp" className="py-24 sm:py-32 bg-background">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">RSVP</p>
          <h2 className="section-title">Confirme sua Presença</h2>
          <div className="gold-divider mt-6" />
          <p className="section-subtitle max-w-2xl mx-auto">
            Por favor, confirme sua presença até 30 dias antes do casamento
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto card-wedding"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Seu Nome Completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                maxLength={200}
                value={formData.name}
                onChange={handleInputChange}
                className="input-wedding"
                placeholder="Digite seu nome"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="guests"
                className="block text-sm font-medium text-foreground mb-2"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Quantidade de Pessoas (incluindo você)
              </label>
              <select
                id="guests"
                name="guests"
                required
                value={formData.guests}
                onChange={handleInputChange}
                className="input-wedding"
                disabled={loading}
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "pessoa" : "pessoas"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Você irá comparecer?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.attending === "yes"
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="attending"
                    value="yes"
                    checked={formData.attending === "yes"}
                    onChange={handleInputChange}
                    className="sr-only"
                    disabled={loading}
                  />
                  <span className={formData.attending === "yes" ? "text-gold" : "text-foreground"}>
                    Sim, estarei presente
                  </span>
                </label>
                <label
                  className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.attending === "no"
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <input
                    type="radio"
                    name="attending"
                    value="no"
                    checked={formData.attending === "no"}
                    onChange={handleInputChange}
                    className="sr-only"
                    disabled={loading}
                  />
                  <span className={formData.attending === "no" ? "text-gold" : "text-foreground"}>
                    Não poderei ir
                  </span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!formData.name || !formData.attending || loading}
              className="btn-wedding w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  Enviar Confirmação
                  <Send className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </section>
  );
};

export default PublicRSVP;
