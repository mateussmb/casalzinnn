import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Send, MessageCircle, Heart } from "lucide-react";
import { useWedding } from "@/contexts/WeddingContext";

interface Message {
  id: number;
  name: string;
  message: string;
  createdAt: string;
}

const PublicMessageWall = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      name: "Maria Clara",
      message: "Que casal lindo! Que Deus abençoe muito essa união. Muito feliz por vocês!",
      createdAt: "2 dias atrás",
    },
    {
      id: 2,
      name: "João Pedro",
      message: "Parabéns aos noivos! Desejo toda a felicidade do mundo. Ansiosos pelo grande dia!",
      createdAt: "3 dias atrás",
    },
    {
      id: 3,
      name: "Ana e Lucas",
      message: "Vocês formam o casal mais lindo! Que essa jornada seja repleta de amor e cumplicidade.",
      createdAt: "5 dias atrás",
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      name: name.trim(),
      message: message.trim(),
      createdAt: "Agora",
    };

    setMessages([newMessage, ...messages]);
    setName("");
    setMessage("");
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
                />
              </div>
              <button type="submit" className="btn-wedding w-full">
                Enviar Mensagem
                <Send className="ml-2 w-5 h-5" />
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
            {messages.map((msg, index) => (
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
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PublicMessageWall;
