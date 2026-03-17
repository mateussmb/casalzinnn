import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Send, MessageCircle, Heart, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWedding } from "@/contexts/WeddingContext";
import { toast } from "sonner";

interface Message {
  id: string;
  guest_name: string;
  content: string;
  created_at: string;
}

const MessageWall = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { wedding } = useWedding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const weddingId = wedding?.id;

  // Load approved messages from database
  useEffect(() => {
    if (!weddingId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, guest_name, content, created_at")
          .eq("wedding_id", weddingId)
          .eq("approved", true)
          .eq("show_on_wall", true)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [weddingId]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return "Agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return "Ontem";
    return `${diffDays} dias atrás`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !message.trim() || !email.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isValidEmail(email.trim())) {
      toast.error("E-mail inválido");
      return;
    }

    if (!weddingId) {
      toast.error("Erro ao identificar o casamento");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("messages").insert({
        wedding_id: weddingId,
        guest_name: name.trim().substring(0, 100),
        guest_email: email.trim().substring(0, 200),
        content: message.trim().substring(0, 500),
        approved: true,      // mensagens do mural são aprovadas por padrão
        show_on_wall: true,  // e aparecem no mural por padrão
        source: "wall",      // diferencia de mensagens do carrinho
      });

      if (error) throw error;

      // Add to local state immediately for instant feedback
      const newMessage: Message = {
        id: Date.now().toString(),
        guest_name: name.trim(),
        content: message.trim(),
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [newMessage, ...prev]);
      setName("");
      setEmail("");
      setMessage("");
      toast.success("Mensagem enviada com sucesso!");
    } catch (err) {
      console.error("Error sending message:", err);
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
            Deixe uma mensagem carinhosa para os noivos
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
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="textarea-wedding"
                  placeholder="Escreva uma mensagem para os noivos..."
                  required
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {message.length}/500
                </p>
              </div>
              <button
                type="submit"
                className="btn-wedding w-full"
                disabled={loading || !name.trim() || !email.trim() || !message.trim() || !isValidEmail(email)}
              >
                {loading ? (
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

          {/* Messages Grid */}
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
              <div className="text-center py-12 card-wedding">
                <Heart className="w-12 h-12 text-gold/30 mx-auto mb-3" />
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
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold font-serif text-lg">
                          {msg.guest_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{msg.guest_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                    <Heart className="w-4 h-4 text-rose flex-shrink-0" />
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    "{msg.content}"
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
