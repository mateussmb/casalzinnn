import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Minus,
  Plus,
  Trash2,
  Gift,
  Mail,
  Loader2,
  CreditCard,
  QrCode,
  FileText,
  ShoppingBag,
  Check,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWedding } from "@/contexts/WeddingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId: string;
  mercadoPagoPublicKey?: string | null;
}

type CheckoutStep = "cart" | "info" | "payment";

const CheckoutModal = ({
  isOpen,
  onClose,
  weddingId,
  mercadoPagoPublicKey,
}: CheckoutModalProps) => {
  const { config } = useWedding();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalPrice,
    includeEnvelope,
    setIncludeEnvelope,
    envelopePrice,
  } = useCart();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const handleClose = () => {
    setStep("cart");
    setGuestName("");
    setGuestEmail("");
    setPaymentUrl(null);
    onClose();
  };

  const handleProceedToInfo = () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um presente ao carrinho");
      return;
    }
    setStep("info");
  };

  const handleProceedToPayment = async () => {
    if (!guestName.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }

    setLoading(true);

    try {
      // Build items array for the payment
      const paymentItems = items.map((item) => ({
        id: item.gift.id,
        name: item.gift.name,
        quantity: item.quantity,
        unit_price: item.gift.price,
      }));

      // Add envelope if selected
      if (includeEnvelope) {
        paymentItems.push({
          id: "envelope-personalizado",
          name: `Envelope Personalizado para ${config.coupleName}`,
          quantity: 1,
          unit_price: envelopePrice,
        });
      }

      // Get access token from weddings table (via edge function)
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          weddingId,
          items: paymentItems,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Erro ao criar pagamento");
      }

      if (data?.initPoint) {
        setPaymentUrl(data.initPoint);
        setStep("payment");
      } else {
        throw new Error("URL de pagamento não recebida");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast.error(message);
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, "_blank");
      clearCart();
      handleClose();
      toast.success("Você será redirecionado para o pagamento!");
    }
  };

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (acc, item) => acc + item.gift.price * item.quantity,
    0
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-2xl shadow-elevated max-w-lg w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-full">
                <ShoppingBag className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-foreground">
                  {step === "cart" && "Carrinho de Presentes"}
                  {step === "info" && "Suas Informações"}
                  {step === "payment" && "Pagamento"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Presente para {config.coupleName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-2 py-4 border-b border-border">
            {["cart", "info", "payment"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step === s
                      ? "bg-gold text-white"
                      : i < ["cart", "info", "payment"].indexOf(step)
                      ? "bg-green-500 text-white"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < ["cart", "info", "payment"].indexOf(step) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 mx-1 ${
                      i < ["cart", "info", "payment"].indexOf(step)
                        ? "bg-green-500"
                        : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {step === "cart" && (
              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Seu carrinho está vazio
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Escolha presentes para {config.coupleName}
                    </p>
                  </div>
                ) : (
                  <>
                    {items.map((item) => (
                      <div
                        key={item.gift.id}
                        className="flex gap-4 p-4 bg-secondary/50 rounded-lg"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.gift.image ? (
                            <img
                              src={item.gift.image}
                              alt={item.gift.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Gift className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {item.gift.name}
                          </h4>
                          <p className="text-sm text-gold font-medium">
                            R$ {item.gift.price.toFixed(2).replace(".", ",")}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() =>
                                updateQuantity(item.gift.id, item.quantity - 1)
                              }
                              className="p-1 hover:bg-secondary rounded transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.gift.id, item.quantity + 1)
                              }
                              className="p-1 hover:bg-secondary rounded transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(item.gift.id)}
                              className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Envelope option */}
                    <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="envelope"
                          checked={includeEnvelope}
                          onCheckedChange={(checked) =>
                            setIncludeEnvelope(checked === true)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="envelope"
                            className="font-medium text-foreground cursor-pointer flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4 text-gold" />
                            Envelope Personalizado
                          </label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Envie seu presente com um envelope especial
                            personalizado para {config.coupleName}
                          </p>
                          <p className="text-sm font-medium text-gold mt-2">
                            + R$ {envelopePrice.toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === "info" && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="guestName">Seu Nome *</Label>
                  <Input
                    id="guestName"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="guestEmail">Seu E-mail (opcional)</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para enviar o comprovante do presente
                  </p>
                </div>
              </div>
            )}

            {step === "payment" && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-2">
                    Tudo pronto!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique no botão abaixo para ser redirecionado ao Mercado
                    Pago e finalizar seu pagamento.
                  </p>
                </div>

                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="w-5 h-5" />
                    <span>Pix</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="w-5 h-5" />
                    <span>Cartão</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="w-5 h-5" />
                    <span>Boleto</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with totals and actions */}
          <div className="p-6 border-t border-border bg-secondary/30">
            {(step === "cart" || step === "info") && items.length > 0 && (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace(".", ",")}</span>
                </div>
                {includeEnvelope && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Envelope Personalizado
                    </span>
                    <span>R$ {envelopePrice.toFixed(2).replace(".", ",")}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-gold">
                    R$ {getTotalPrice().toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {step !== "cart" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    setStep(step === "payment" ? "info" : "cart")
                  }
                  className="flex-1"
                >
                  Voltar
                </Button>
              )}

              {step === "cart" && (
                <Button
                  onClick={handleProceedToInfo}
                  disabled={items.length === 0}
                  className="flex-1 bg-gold hover:bg-gold-dark text-white"
                >
                  Continuar
                </Button>
              )}

              {step === "info" && (
                <Button
                  onClick={handleProceedToPayment}
                  disabled={loading || !guestName.trim()}
                  className="flex-1 bg-gold hover:bg-gold-dark text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processando...
                    </>
                  ) : (
                    "Ir para Pagamento"
                  )}
                </Button>
              )}

              {step === "payment" && (
                <Button
                  onClick={handleOpenPayment}
                  className="flex-1 bg-gold hover:bg-gold-dark text-white"
                >
                  Pagar com Mercado Pago
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
