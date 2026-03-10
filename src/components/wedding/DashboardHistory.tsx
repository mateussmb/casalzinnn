import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Users,
  MessageSquare,
  CreditCard,
  Calendar,
  Mail,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Order {
  id: string;
  guest_name: string;
  guest_email: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  mercado_pago_payment_id: string | null;
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  gift_name: string;
  quantity: number;
  unit_price: number;
}

interface RsvpResponse {
  id: string;
  guest_name: string;
  guest_email: string | null;
  attendance: string;
  guests_count: number;
  dietary_restrictions: string | null;
  message: string | null;
  created_at: string;
  companion_names?: string[];
}

interface Message {
  id: string;
  guest_name: string;
  message: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  paid: { label: "Pago", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  approved: { label: "Aprovado", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  processing: { label: "Processando", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  rejected: { label: "Recusado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const DashboardHistory = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "rsvps" | "messages">("orders");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Get wedding ID
        const { data: wedding } = await supabase
          .from("weddings")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!wedding) {
          setLoading(false);
          return;
        }

        setWeddingId(wedding.id);

        // Load all data in parallel
        const [ordersRes, rsvpsRes, messagesRes] = await Promise.all([
          supabase
            .from("orders")
            .select("*")
            .eq("wedding_id", wedding.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("rsvp_responses")
            .select("*")
            .eq("wedding_id", wedding.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("messages")
            .select("*")
            .eq("wedding_id", wedding.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ordersRes.data) {
          // Load order items for each order
          const orderIds = ordersRes.data.map(o => o.id);
          const { data: allItems } = await supabase
            .from("order_items")
            .select("*")
            .in("order_id", orderIds);

          const ordersWithItems = ordersRes.data.map(order => ({
            ...order,
            items: allItems?.filter(item => item.order_id === order.id) || [],
          }));
          setOrders(ordersWithItems);
        }

        if (rsvpsRes.data) setRsvps(rsvpsRes.data);
        if (messagesRes.data) setMessages(messagesRes.data);
      } catch (error) {
        console.error("Error loading history:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orderFilter === "all" 
    ? orders 
    : orders.filter(o => o.status === orderFilter);

  const confirmedGuests = rsvps.filter(r => r.attendance === "yes" || r.attendance === "confirmed");
  const totalGuests = confirmedGuests.reduce((sum, r) => sum + r.guests_count, 0);
  const totalRevenue = orders
    .filter(o => o.status === "paid" || o.status === "approved")
    .reduce((sum, o) => sum + Number(o.total_amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!weddingId) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Salve seu casamento primeiro para ver o histórico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold/10 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-gold" />
            </div>
            <span className="text-sm text-muted-foreground">Pedidos</span>
          </div>
          <p className="text-2xl font-serif text-foreground">{orders.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-muted-foreground">Receita</span>
          </div>
          <p className="text-2xl font-serif text-foreground">
            R$ {totalRevenue.toFixed(2).replace(".", ",")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-muted-foreground">Confirmados</span>
          </div>
          <p className="text-2xl font-serif text-foreground">{totalGuests}</p>
          <p className="text-xs text-muted-foreground">{confirmedGuests.length} respostas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl p-5 border border-border shadow-soft"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-muted-foreground">Mensagens</span>
          </div>
          <p className="text-2xl font-serif text-foreground">{messages.length}</p>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "orders" as const, label: "Pedidos", icon: ShoppingBag, count: orders.length },
          { key: "rsvps" as const, label: "Confirmações", icon: Users, count: rsvps.length },
          { key: "messages" as const, label: "Mensagens", icon: MessageSquare, count: messages.length },
        ].map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-gold text-gold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{count}</span>
          </button>
        ))}
      </div>

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg text-foreground">Histórico de Pedidos</h3>
            <Select value={orderFilter} onValueChange={setOrderFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="approved">Aprovados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="rejected">Recusados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <StatusIcon className="w-5 h-5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">{order.guest_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-serif text-gold">
                        R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                      {order.guest_email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {order.guest_email}
                        </div>
                      )}
                      {order.mercado_pago_payment_id && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          ID: {order.mercado_pago_payment_id}
                        </div>
                      )}
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">Itens:</p>
                          {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm text-muted-foreground pl-4">
                              <span>{item.quantity}x {item.gift_name}</span>
                              <span>R$ {(item.unit_price * item.quantity).toFixed(2).replace(".", ",")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      )}

      {/* RSVPs Tab */}
      {activeTab === "rsvps" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="font-serif text-lg text-foreground">Confirmações de Presença</h3>

          {rsvps.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma confirmação recebida</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-medium text-muted-foreground">Convidado</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Acompanhantes</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Restrições</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="p-3">
                          <p className="font-medium text-foreground">{rsvp.guest_name}</p>
                          {rsvp.guest_email && (
                            <p className="text-xs text-muted-foreground">{rsvp.guest_email}</p>
                          )}
                          {rsvp.companion_names && rsvp.companion_names.length > 0 && (
                            <div className="mt-1">
                              {rsvp.companion_names.map((name, i) => (
                                <p key={i} className="text-xs text-muted-foreground">+ {name}</p>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={rsvp.attendance === "yes" || rsvp.attendance === "confirmed" ? "default" : "secondary"}
                            className={
                              rsvp.attendance === "yes" || rsvp.attendance === "confirmed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }
                          >
                            {rsvp.attendance === "yes" || rsvp.attendance === "confirmed" ? "Confirmado" : "Não irá"}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-foreground">{rsvp.guests_count}</td>
                        <td className="p-3 text-muted-foreground">{rsvp.dietary_restrictions || "—"}</td>
                        <td className="p-3 text-muted-foreground text-xs">{formatDate(rsvp.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Messages Tab */}
      {activeTab === "messages" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <h3 className="font-serif text-lg text-foreground">Mural de Mensagens</h3>

          {messages.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma mensagem recebida</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-card rounded-xl p-5 border border-border shadow-soft"
                >
                  <p className="text-foreground italic mb-3">"{msg.message}"</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gold">{msg.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(msg.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default DashboardHistory;