import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Heart, ArrowLeft, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-500" />
        </motion.div>

        <h1 className="font-serif text-3xl text-foreground mb-4">
          Pagamento Confirmado!
        </h1>

        <p className="text-muted-foreground mb-6">
          Obrigado pelo seu presente carinhoso! Os noivos ficarão muito felizes
          com sua generosidade.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-gold mb-3">
            <Gift className="w-5 h-5" />
            <span className="font-medium">Presente enviado com sucesso</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {orderId && (
              <span className="block">
                Código do pedido: <code className="text-foreground">{orderId.slice(0, 8)}</code>
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-8">
          <Heart className="w-4 h-4 text-gold" />
          <span className="text-sm">Com amor e gratidão</span>
          <Heart className="w-4 h-4 text-gold" />
        </div>

        <Button
          asChild
          variant="outline"
          className="border-gold text-gold hover:bg-gold/10"
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao site
          </Link>
        </Button>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
