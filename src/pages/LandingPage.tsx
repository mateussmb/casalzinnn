import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, Gift, Calendar, MessageSquare, Camera, 
  Users, Smartphone, Palette, CreditCard, Share2,
  Check, ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Palette,
    title: "Layouts Personalizáveis",
    description: "Escolha entre layouts clássico, moderno ou minimalista para combinar com o estilo do seu casamento."
  },
  {
    icon: Gift,
    title: "Lista de Presentes com Pagamento",
    description: "Integração com Mercado Pago para que seus convidados possam presentear o casal de forma segura."
  },
  {
    icon: Users,
    title: "Confirmação de Presença",
    description: "RSVP integrado para gerenciar a lista de convidados e restrições alimentares."
  },
  {
    icon: MessageSquare,
    title: "Mural de Mensagens",
    description: "Seus convidados podem deixar mensagens de carinho para vocês."
  },
  {
    icon: Camera,
    title: "Galeria de Fotos",
    description: "Compartilhe sua história através de fotos especiais do casal."
  },
  {
    icon: Calendar,
    title: "Informações Completas",
    description: "Local, horário, mapa e todas as informações que seus convidados precisam."
  },
  {
    icon: Smartphone,
    title: "100% Responsivo",
    description: "Seu site fica perfeito em qualquer dispositivo, do celular ao desktop."
  },
  {
    icon: Share2,
    title: "URL Personalizada",
    description: "Receba uma URL única com os nomes do casal para compartilhar com todos."
  },
];

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Registre-se gratuitamente em segundos."
  },
  {
    number: "02",
    title: "Configure seu site",
    description: "Personalize cores, textos e adicione fotos."
  },
  {
    number: "03",
    title: "Adicione presentes",
    description: "Monte sua lista com os presentes desejados."
  },
  {
    number: "04",
    title: "Compartilhe",
    description: "Envie a URL personalizada para seus convidados."
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-gold fill-gold" />
              <span className="font-serif text-xl font-semibold text-foreground">Casalzinnn</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Entrar</Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gold hover:bg-gold-light text-background">
                  Criar Conta Grátis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 text-gold text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Crie seu site de casamento em minutos
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight"
            >
              O site perfeito para
              <br />
              <span className="text-gold">seu casamento</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Crie um site elegante com lista de presentes integrada, confirmação de presença 
              e pagamentos via Mercado Pago. Tudo em um só lugar.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register">
                <Button size="lg" className="bg-gold hover:bg-gold-light text-background text-lg px-8 py-6 w-full sm:w-auto">
                  Começar Agora - É Grátis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 w-full sm:w-auto">
                  Ver Demonstração
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 relative"
          >
            <div className="aspect-[16/9] max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-border bg-gradient-to-br from-gold/5 via-background to-gold/10">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center p-8">
                  <Heart className="w-16 h-16 text-gold mx-auto mb-4" />
                  <p className="text-2xl font-serif text-foreground">Camila & Rafael</p>
                  <p className="text-muted-foreground mt-2">15 de Agosto de 2025</p>
                  <div className="mt-6 flex gap-4 justify-center">
                    <div className="px-4 py-2 bg-gold/10 rounded-lg">
                      <p className="text-2xl font-serif text-gold">180</p>
                      <p className="text-xs text-muted-foreground">dias</p>
                    </div>
                    <div className="px-4 py-2 bg-gold/10 rounded-lg">
                      <p className="text-2xl font-serif text-gold">12</p>
                      <p className="text-xs text-muted-foreground">horas</p>
                    </div>
                    <div className="px-4 py-2 bg-gold/10 rounded-lg">
                      <p className="text-2xl font-serif text-gold">45</p>
                      <p className="text-xs text-muted-foreground">min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Tudo que você precisa
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos completos para criar o site de casamento dos seus sonhos
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card p-6 rounded-xl border border-border hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-medium text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground">
              Como funciona
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Em 4 passos simples você terá seu site pronto
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-serif text-gold">{step.number}</span>
                </div>
                <h3 className="font-medium text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Integration */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">
                Integração com Mercado Pago
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Seus convidados podem presentear o casal diretamente pelo site, 
                com pagamento seguro via Mercado Pago. Você recebe direto na sua conta!
              </p>
              <ul className="space-y-4">
                {[
                  "Pagamento via Pix, cartão ou boleto",
                  "Receba diretamente na sua conta",
                  "Acompanhe os pagamentos em tempo real",
                  "Seus próprios dados do Mercado Pago",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card p-8 rounded-2xl border border-border"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Pagamento Seguro</h3>
                  <p className="text-sm text-muted-foreground">Processado pelo Mercado Pago</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground">Jogo de Panelas</span>
                  <span className="text-gold font-medium">R$ 599,90</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="text-foreground">Cafeteira Expresso</span>
                  <span className="text-gold font-medium">R$ 899,00</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-center">
                  <span className="font-medium text-foreground">Total</span>
                  <span className="text-xl font-serif text-gold">R$ 1.498,90</span>
                </div>
                <Button className="w-full bg-gold hover:bg-gold-light text-background">
                  Pagar com Mercado Pago
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground mb-6">
              Pronto para criar seu site?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Junte-se a milhares de casais que já criaram seus sites conosco.
              Comece agora, é grátis!
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-gold hover:bg-gold-light text-background text-lg px-12 py-6">
                Criar Meu Site Agora
                <Heart className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-gold fill-gold" />
            <span className="font-serif text-foreground">Casalzinnn</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Casalzinnn. Feito com amor.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
