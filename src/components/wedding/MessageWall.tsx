import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Send, MessageCircle, Heart, Loader2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { useWedding } from "@/contexts/WeddingContext";
import { toast } from "sonner";

const supabasePublic = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

interface Message {
  id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

const MessageWall = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { wedding } = useWedding();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!wedding?.id) return;

    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabasePublic
        .from("messages")
        .select("id, guest_name, message, created_at")
        .eq("wedding_id", wedding.id)
        .eq("approved", true)
        .eq("show_on_wall", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) setMessages(data as Message[]);
      setLoading(false);
    };

    fetchMessages();
  }, [wedding?.id]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Hoje";
      if (diffDays === 1) return "Ontem";
      if (diffDays < 7) return `${diffDays} dias atrás`;
      return date.toLocaleDateString("pt-BR");
    } catch { return ""; }
  };

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !messageText.trim()) return;
    if (!email.trim() || !isValidEmail(email.trim())) {
      toast.error("Por favor, informe um e-mail válido");
      return;
    }
    if (!wedding?.id) {
      toast.error("Erro ao identificar o casamento");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabasePublic
        .from("messages")
        .insert({
          wedding_id: wedding.id,
          guest_name: name.trim().substring(0, 100),
          guest_email: email.trim().substring(0, 200),
          message: messageText.trim().substring(0, 500),
          topic: "mural",       // campo obrigatório — identifica origem
          extension: "wall",    // campo obrigatório — identifica tipo
          approved: true,
          show_on_wall: true,
          private: false,
        })
        .select("id, guest_name, message, created_at")
        .single();

      if (error) throw error;

      if (data) setMessages((prev) => [data as Message, ...prev]);

      setName("");
      setEmail("");
      setMessageText("");
      toast.success("Mensagem enviada com sucesso!");
    } catch (err: unknown) {
      console.error("Error submitting message:", err);
      toast.error("Erro ao enviar mensagem. Por favor, tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section ref={ref} className="py-24 sm:py-32 bg-secondary/50">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Mensagens</p>
          <h2 className="section-title">Mural de Recados</h2>
          <div className="gold-divider mt-6" />
          <p className="section-subtitle max-w-2xl mx-auto">
            Deixe uma mensagem carinhosa para os noivos
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.form
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            onSubmit={handleSubmit}
            className="card-wedding h-fit"
          >
            <h3 className="font-serif text-2xl text-foreground mb-6 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-gold" />
              Deixe sua Mensagem
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="messageName" className="block text-sm font-medium text-foreground mb-2">
                  Seu Nome *
                </label>
                <input
                  type="text"
                  id="messageName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-wedding"
                  placeholder="Digite seu nome"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="messageEmail" className="block text-sm font-medium text-foreground mb-2">
                  Seu E-mail *
                </label>
                <input
                  type="email"
                  id="messageEmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-wedding"
                  placeholder="Digite seu e-mail"
                  required
                  maxLength={200}
                />
                {email && !isValidEmail(email) && (
                  <p className="text-xs text-destructive mt-1">Formato de e-mail inválido</p>
                )}
              </div>
              <div>
                <label htmlFor="messageText" className="block text-sm font-medium text-foreground mb-2">
                  Sua Mensagem *
                </label>
                <textarea
                  id="messageText"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="textarea-wedding"
                  placeholder="Escreva uma mensagem para os noivos..."
                  required
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  {messageText.length}/500
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting || !name.trim() || !messageText.trim() || !isValidEmail(email)}
                className="btn-wedding w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar Mensagem
                    <Send className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4 max-h-[500px] overflow-y-auto pr-2"
          >
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Seja o primeiro a deixar uma mensagem!</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="card-wedding"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-gold font-serif text-lg">
                          {msg.guest_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{msg.guest_name}</h4>
                        <p className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</p>
                      </div>
                    </div>
                    <Heart className="w-4 h-4 text-rose" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    "{msg.message}"
                  </p>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default MessageWall;
