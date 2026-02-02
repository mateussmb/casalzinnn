import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentFailure = () => {
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
          className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <XCircle className="w-12 h-12 text-red-500" />
        </motion.div>

        <h1 className="font-serif text-3xl text-foreground mb-4">
          Pagamento não aprovado
        </h1>

        <p className="text-muted-foreground mb-6">
          Infelizmente o pagamento não foi processado. Isso pode acontecer por
          diversos motivos. Por favor, tente novamente.
        </p>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <p className="text-sm text-muted-foreground">
            Possíveis causas:
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Saldo insuficiente</li>
            <li>• Dados do cartão incorretos</li>
            <li>• Limite excedido</li>
            <li>• Problema temporário no sistema</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            asChild
            className="bg-gold hover:bg-gold-dark text-white"
          >
            <Link to="/">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Link>
          </Button>

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
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentFailure;
