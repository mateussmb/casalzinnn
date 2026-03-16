import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Send, MessageCircle, Heart, Loader2 } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

interface PublicMessageWallProps {
  weddingId?: string;
}

const PublicMessageWall = ({ weddingId }: PublicMessageWallProps) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  // Load only approved messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!weddingId) {
        setLoadingMessages(false);
        return;
      }

      try {
      const { data, error } = await supabase
          .from("messages")
          .select("id, guest_name, message, created_at, show_on_wall")
          .eq("wedding_id", weddingId)
          .eq("show_on_wall", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Error loading messages:", error);
          return;
        }

        if (data) {
          setMessages(
            data.map((m) => ({
              id: m.id,
              name: m.guest_name,
              message: m.message,
              createdAt: formatDate(m.created_at),
            }))
          );
        }
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [weddingId]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weddingId) {
      toast.error("Erro ao enviar mensagem. Por favor, recarregue a página.");
      return;
    }

    if (!name.trim() || !message.trim()) {
      toast.error("Por favor, preencha seu nome e mensagem.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          wedding_id: weddingId,
          guest_name: name.trim().substring(0, 200),
          message: message.trim().substring(0, 1000),
        });

      if (error) {
        console.error("Message error:", error);
        throw error;
      }

      setName("");
      setMessage("");
      toast.success("Mensagem enviada com sucesso!");
    } catch (err) {
      console.error("Error submitting message:", err);
      toast.error("Erro ao enviar mensagem. Por favor, tente novamente.");
    } finally {
      setLoading(false);
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
            Deixe uma mensagem carinhosa para {config.coupleName}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
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
                <label
                  htmlFor="messageName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Seu Nome
                </label>
                <input
                  type="text"
                  id="messageName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-wedding"
                  placeholder="Digite seu nome"
                  required
                  maxLength={200}
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="messageText"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Sua Mensagem
                </label>
                <textarea
                  id="messageText"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="textarea-wedding"
                  placeholder="Escreva uma mensagem para os noivos..."
                  required
                  maxLength={1000}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Sua mensagem será exibida no mural após aprovação dos noivos.
              </p>
              <button 
                type="submit" 
                className="btn-wedding w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !name.trim() || !message.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
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

          {/* Messages Grid - only approved */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4 max-h-[500px] overflow-y-auto pr-2"
          >
            {loadingMessages ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gold" />
              </div>
            ) : messages.length === 0 ? (
              <div className="card-wedding text-center py-12">
                <MessageCircle className="w-12 h-12 text-gold/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Seja o primeiro a deixar uma mensagem!
                </p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card-wedding"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <span className="text-gold font-serif text-lg">
                          {msg.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{msg.name}</h4>
                        <p className="text-xs text-muted-foreground">{msg.createdAt}</p>
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

export default PublicMessageWall;
