import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
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
  Copy,
  ExternalLink,
  AlertCircle,
  Users,
} from "lucide-react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useCart } from "@/contexts/CartContext";
import { useWedding } from "@/contexts/WeddingContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type CheckoutStep = "cart" | "info" | "payment" | "success" | "pix" | "boleto";

interface PixData {
  qr_code: string;
  qr_code_base64: string;
  ticket_url?: string;
}

// Translate Mercado Pago error codes to user-friendly Portuguese messages
const translatePaymentError = (errorCode: string | undefined, message?: string): string => {
  if (!errorCode) return message || "Erro desconhecido. Tente novamente.";
  
  const errorMap: Record<string, string> = {
    "cc_rejected_bad_filled_card_number": "Número do cartão incorreto",
    "cc_rejected_bad_filled_date": "Data de validade incorreta",
    "cc_rejected_bad_filled_other": "Dados do cartão incorretos",
    "cc_rejected_bad_filled_security_code": "Código de segurança incorreto",
    "cc_rejected_blacklist": "Cartão não autorizado",
    "cc_rejected_call_for_authorize": "Autorização necessária. Entre em contato com seu banco.",
    "cc_rejected_card_disabled": "Cartão desabilitado. Entre em contato com seu banco.",
    "cc_rejected_card_error": "Erro no cartão. Tente outro cartão.",
    "cc_rejected_duplicated_payment": "Pagamento duplicado detectado",
    "cc_rejected_high_risk": "Pagamento recusado por segurança. Tente outro método.",
    "cc_rejected_insufficient_amount": "Saldo insuficiente",
    "cc_rejected_invalid_installments": "Parcelas não permitidas",
    "cc_rejected_max_attempts": "Limite de tentativas atingido. Tente mais tarde.",
    "cc_rejected_other_reason": "Pagamento recusado pelo banco. Tente outro cartão.",
    "pending_waiting_transfer": "Aguardando transferência Pix",
    "pending_waiting_payment": "Aguardando pagamento",
    "rejected": "Pagamento recusado",
    "cancelled": "Pagamento cancelado",
    "refunded": "Pagamento reembolsado",
    "charged_back": "Pagamento contestado",
    "invalid_escrow_amount": "Valor inválido",
    "payment_type_not_allowed": "Método de pagamento não permitido para esta conta",
    "invalid_users_involved": "Erro de configuração do pagamento",
    "not_result_by_params": "Método de pagamento não encontrado. Verifique suas credenciais do Mercado Pago.",
    "10102": "Método de pagamento não disponível. Verifique a configuração da conta.",
    "invalid_token": "Token de pagamento inválido. Tente novamente.",
    "missing_parameter": "Dados incompletos. Preencha todos os campos.",
    "bad_request": "Requisição inválida. Tente novamente.",
  };

  return errorMap[errorCode] || message || `Erro: ${errorCode.replace(/_/g, " ")}`;
};

interface BoletoData {
  ticket_url: string;
  barcode?: string;
}

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
    giftMessage,
    setGiftMessage,
  } = useCart();

  const [step, setStep] = useState<CheckoutStep>("cart");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mpInitialized, setMpInitialized] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  
  // RSVP confirmation in checkout
  const [confirmAttendance, setConfirmAttendance] = useState(false);
  const [attendanceGuests, setAttendanceGuests] = useState(1);

  // Initialize Mercado Pago SDK
  useEffect(() => {
    if (mercadoPagoPublicKey && !mpInitialized) {
      try {
        initMercadoPago(mercadoPagoPublicKey, { locale: "pt-BR" });
        setMpInitialized(true);
      } catch (error) {
        console.error("Error initializing Mercado Pago:", error);
      }
    }
  }, [mercadoPagoPublicKey, mpInitialized]);

  const handleClose = () => {
    if (step !== "pix" && step !== "boleto") {
      setStep("cart");
      setGuestName("");
      setGuestEmail("");
      setOrderId(null);
      setPixData(null);
      setBoletoData(null);
      setConfirmAttendance(false);
      setAttendanceGuests(1);
    }
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

    if (!weddingId) {
      toast.error("Configuração do casamento não encontrada. Contate os noivos.");
      return;
    }

    if (!mercadoPagoPublicKey) {
      toast.error("Pagamento não configurado. Contate os noivos.");
      return;
    }

    setLoading(true);

    try {
      // Save RSVP if confirmed
      if (confirmAttendance && weddingId) {
        try {
          const sanitizedName = guestName.trim().replace(/[<>]/g, '').substring(0, 200);
          const sanitizedEmail = guestEmail.trim().replace(/[<>]/g, '').substring(0, 255) || null;
          const clampedGuests = Math.max(1, Math.min(20, attendanceGuests));
          await supabase.from("rsvp_responses").insert({
            wedding_id: weddingId,
            guest_name: sanitizedName,
            guests_count: clampedGuests,
            attendance: "confirmed",
            guest_email: sanitizedEmail,
          });
        } catch (rsvpErr) {
          console.error("RSVP save error:", rsvpErr);
          // Don't block payment for RSVP error
        }
      }

      // Create order in database first
      const paymentItems = items.map((item) => ({
        id: item.gift.id,
        name: item.gift.name,
        quantity: item.quantity,
        unit_price: item.gift.price,
      }));

      if (includeEnvelope) {
        paymentItems.push({
          id: "envelope-personalizado",
          name: `Envelope Personalizado para ${config.coupleName}`,
          quantity: 1,
          unit_price: envelopePrice,
        });
      }

      // Create order via edge function
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: {
          weddingId,
          items: paymentItems,
          guestName: guestName.trim(),
          guestEmail: guestEmail.trim() || undefined,
        },
      });

      if (error) {
        console.error("Create payment error:", error);
        let errorMessage = "Erro ao criar pedido";
        if (error.message?.includes("FunctionsFetchError")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        } else if (error.message?.includes("not configured")) {
          errorMessage = "Pagamento não configurado. Entre em contato com os noivos.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (!data?.orderId) {
        throw new Error(data?.error || "Erro ao criar pedido. Tente novamente.");
      }

      setOrderId(data.orderId);
      setStep("payment");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pedido";
      toast.error(message);
      console.error("Order creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePaymentSubmit = async (formData: any) => {
    if (!orderId || !weddingId) {
      toast.error("Erro no pedido. Tente novamente.");
      return;
    }

    if (loading) return; // Prevent double submit
    setLoading(true);

    try {
      const paymentMethod = formData.selectedPaymentMethod || formData.payment_method_id;
      const paymentFormData = formData.formData || formData;

      // Extract payer identification safely
      const payer = paymentFormData?.payer || {};
      const identification = payer?.identification || {};

      // Split name into first and last
      const nameParts = guestName.trim().split(' ').filter(Boolean);
      const firstName = nameParts[0] || 'Convidado';
      const lastName = nameParts.slice(1).join(' ') || 'Anônimo';

      // Use the email from step 2 (guestEmail) consistently
      const payerEmail = guestEmail.trim() || `guest-${Date.now()}@wedding.local`;

      // Process payment via edge function
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          weddingId,
          orderId,
          paymentMethodId: paymentMethod,
          token: paymentFormData?.token,
          issuerId: paymentFormData?.issuer_id,
          installments: paymentFormData?.installments || 1,
          payerEmail,
          payerName: guestName.trim(),
          payerFirstName: firstName,
          payerLastName: lastName,
          identificationType: identification?.type || 'CPF',
          identificationNumber: identification?.number || '12345678909',
          transactionAmount: getTotalPrice(),
        },
      });

      if (error) {
        console.error("Process payment error:", error);
        let errorMessage = "Erro ao processar pagamento";
        if (error.message?.includes("FunctionsFetchError")) {
          errorMessage = "Erro de conexão com o servidor de pagamento. Tente novamente.";
        } else if (error.message?.includes("NOT_FOUND") || error.message?.includes("404")) {
          errorMessage = "Serviço de pagamento temporariamente indisponível. Tente novamente em alguns minutos.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // Check for error in response data
      if (data?.error) {
        const errorDetail = data.details || data.error;
        const errorMessage = data.message || data.error;
        throw new Error(translatePaymentError(errorDetail, errorMessage));
      }

      // Handle response based on payment type
      if (data.status === "approved") {
        clearCart();
        setStep("success");
        toast.success("Pagamento aprovado!");
      } else if (data.pix) {
        setPixData(data.pix);
        setStep("pix");
        toast.info("Escaneie o QR Code para pagar");
      } else if (data.boleto) {
        setBoletoData(data.boleto);
        setStep("boleto");
        toast.info("Boleto gerado! Clique para visualizar");
      } else if (data.status === "in_process" || data.status === "pending") {
        toast.info("Pagamento em processamento");
        clearCart();
        setStep("success");
      } else if (data.status === "rejected") {
        const rejectionReason = translatePaymentError(data.status_detail);
        toast.error(`Pagamento recusado: ${rejectionReason}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao processar pagamento";
      toast.error(message);
      console.error("Payment error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: unknown) => {
    console.error("Payment form error:", error);
    toast.error("Erro no formulário de pagamento");
  };

  const copyPixCode = () => {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code);
      setPixCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handleFinishPix = () => {
    clearCart();
    setStep("cart");
    setGuestName("");
    setGuestEmail("");
    setOrderId(null);
    setPixData(null);
    onClose();
    toast.success("Obrigado! Após o pagamento, os noivos serão notificados.");
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
        onClick={step !== "payment" ? handleClose : undefined}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-card rounded-2xl shadow-elevated max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
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
                  {step === "success" && "Pagamento Confirmado"}
                  {step === "pix" && "Pague com Pix"}
                  {step === "boleto" && "Boleto Gerado"}
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
          {!["success", "pix", "boleto"].includes(step) && (
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
          )}

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
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

                    {/* Gift message */}
                    <div className="p-4 bg-secondary/50 border border-border rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-gold" />
                        <Label className="font-medium text-foreground cursor-pointer">
                          Mensagem para o casal (opcional)
                        </Label>
                      </div>
                      <Textarea
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Escreva uma mensagem carinhosa..."
                        className="mb-3 bg-card"
                        rows={3}
                        maxLength={300}
                      />
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Felicidades ao casal! 💕",
                          "Que Deus abençoe essa união! 🙏",
                          "Muita felicidade nessa nova jornada! 🎉",
                          "Com muito carinho e amor! ❤️",
                        ].map((msg) => (
                          <button
                            key={msg}
                            type="button"
                            onClick={() => setGiftMessage(msg)}
                            className="text-xs px-3 py-1.5 rounded-full bg-card border border-border hover:border-gold hover:text-gold transition-colors"
                          >
                            {msg}
                          </button>
                        ))}
                      </div>
                      {giftMessage && (
                        <p className="text-xs text-muted-foreground mt-2 text-right">
                          {giftMessage.length}/300
                        </p>
                      )}
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
                  <Label htmlFor="guestEmail">Seu E-mail (recomendado)</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para enviar o comprovante do presente e no pagamento
                  </p>
                </div>

                {/* RSVP Confirmation */}
                <div className="p-4 bg-gold/5 border border-gold/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="confirmAttendance"
                      checked={confirmAttendance}
                      onCheckedChange={(checked) =>
                        setConfirmAttendance(checked === true)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="confirmAttendance"
                        className="font-medium text-foreground cursor-pointer flex items-center gap-2"
                      >
                        <Users className="w-4 h-4 text-gold" />
                        Confirmar presença no casamento
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Aproveite para confirmar sua presença junto com o presente
                      </p>
                    </div>
                  </div>
                  {confirmAttendance && (
                    <div className="mt-3 ml-7">
                      <Label htmlFor="attendanceGuests" className="text-sm">
                        Quantidade de pessoas (incluindo você)
                      </Label>
                      <select
                        id="attendanceGuests"
                        value={attendanceGuests}
                        onChange={(e) => setAttendanceGuests(parseInt(e.target.value))}
                        className="mt-1 w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={num}>
                            {num} {num === 1 ? "pessoa" : "pessoas"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === "payment" && mpInitialized && (
              <div className="space-y-4 relative">
                {loading && (
                  <div className="absolute inset-0 bg-card/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
                    <Loader2 className="w-10 h-10 animate-spin text-gold mb-3" />
                    <p className="text-sm font-medium text-foreground">Processando pagamento...</p>
                    <p className="text-xs text-muted-foreground mt-1">Aguarde, não feche esta tela</p>
                  </div>
                )}
                {!mercadoPagoPublicKey ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Pagamento não configurado pelos noivos
                    </p>
                  </div>
                ) : (
                  <div className="mercadopago-container">
                    <Payment
                      initialization={{
                        amount: getTotalPrice(),
                        payer: {
                          email: guestEmail || undefined,
                        },
                      }}
                      customization={{
                        paymentMethods: {
                          creditCard: "all",
                          ticket: "all",
                          bankTransfer: "all",
                        },
                        visual: {
                          style: {
                            theme: "default",
                          },
                        },
                      }}
                      onSubmit={handlePaymentSubmit}
                      onError={handlePaymentError}
                    />
                  </div>
                )}
              </div>
            )}

            {step === "success" && (
              <div className="space-y-4 text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-serif text-2xl text-foreground">
                  Obrigado pelo presente!
                </h3>
                <p className="text-muted-foreground">
                  Seu presente para {config.coupleName} foi registrado com sucesso.
                </p>
                {confirmAttendance && (
                  <p className="text-sm text-gold">
                    ✓ Sua presença foi confirmada para {attendanceGuests} {attendanceGuests === 1 ? "pessoa" : "pessoas"}
                  </p>
                )}
              </div>
            )}

            {step === "pix" && pixData && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <QrCode className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Escaneie o QR Code ou copie o código Pix
                  </p>
                  
                  {pixData.qr_code_base64 && (
                    <img
                      src={`data:image/png;base64,${pixData.qr_code_base64}`}
                      alt="QR Code Pix"
                      className="w-48 h-48 mx-auto mb-4 rounded-lg"
                    />
                  )}

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={copyPixCode}
                      variant="outline"
                      className="w-full"
                    >
                      {pixCopied ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {pixCopied ? "Copiado!" : "Copiar código Pix"}
                    </Button>
                    
                    {pixData.ticket_url && (
                      <Button
                        onClick={() => window.open(pixData.ticket_url, "_blank")}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver no Mercado Pago
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Valor: <span className="font-medium text-foreground">R$ {getTotalPrice().toFixed(2).replace(".", ",")}</span></p>
                  <p className="mt-2">Após o pagamento, os noivos serão notificados automaticamente.</p>
                </div>
              </div>
            )}

            {step === "boleto" && boletoData && (
              <div className="space-y-4 text-center">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <FileText className="w-8 h-8 text-gold mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Seu boleto foi gerado com sucesso!
                  </p>
                  
                  <Button
                    onClick={() => window.open(boletoData.ticket_url, "_blank")}
                    className="w-full bg-gold hover:bg-gold-dark text-white"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visualizar Boleto
                  </Button>

                  {boletoData.barcode && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Código de barras:</p>
                      <p className="font-mono text-xs bg-background p-2 rounded break-all">
                        {boletoData.barcode}
                      </p>
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Valor: <span className="font-medium text-foreground">R$ {getTotalPrice().toFixed(2).replace(".", ",")}</span></p>
                  <p className="mt-2">O boleto vence em 3 dias úteis.</p>
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
                <>
                  <Button
                    variant="outline"
                    onClick={() => setStep("cart")}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
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
                </>
              )}

              {step === "payment" && (
                <Button
                  variant="outline"
                  onClick={() => setStep("info")}
                  className="flex-1"
                  disabled={loading}
                >
                  Voltar
                </Button>
              )}

              {step === "success" && (
                <Button
                  onClick={() => {
                    setStep("cart");
                    onClose();
                  }}
                  className="flex-1 bg-gold hover:bg-gold-dark text-white"
                >
                  Fechar
                </Button>
              )}

              {(step === "pix" || step === "boleto") && (
                <Button
                  onClick={handleFinishPix}
                  className="flex-1 bg-gold hover:bg-gold-dark text-white"
                >
                  Concluir
                </Button>
              )}
            </div>

            {step === "payment" && (
              <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="w-4 h-4" />
                  <span>Pix</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Cartão</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>Boleto</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CheckoutModal;
