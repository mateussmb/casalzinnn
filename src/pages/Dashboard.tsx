import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings, Eye, Heart, Calendar, Image, Gift, 
  MessageSquare, Users, Camera, Video, Shirt, 
  Plus, Trash2, Edit2, Save, ChevronRight, LogOut,
  CreditCard, Link2, Copy, Check, ExternalLink, Info,
  Loader2, CheckCircle2, XCircle, AlertCircle, MapPin,
  History
} from "lucide-react";
import DashboardHistory from "@/components/wedding/DashboardHistory";
import { useWedding, Gift as GiftType } from "@/contexts/WeddingContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";

const layoutOptions = [
  {
    id: "classic" as const,
    name: "Clássico",
    description: "Elegância atemporal com tons dourados e tipografia serifada",
    preview: "bg-gradient-to-br from-amber-50 to-orange-50",
  },
  {
    id: "modern" as const,
    name: "Moderno",
    description: "Design limpo com linhas geométricas e cores neutras",
    preview: "bg-gradient-to-br from-slate-50 to-gray-100",
  },
  {
    id: "minimalist" as const,
    name: "Minimalista",
    description: "Simplicidade sofisticada com muito espaço em branco",
    preview: "bg-gradient-to-br from-stone-50 to-neutral-100",
  },
];

const sectionOptions = [
  { key: "about" as const, label: "Sobre o Casal", icon: Heart },
  { key: "weddingInfo" as const, label: "Informações do Casamento", icon: Calendar },
  { key: "dressCode" as const, label: "Dress Code", icon: Shirt },
  { key: "gifts" as const, label: "Lista de Presentes", icon: Gift },
  { key: "rsvp" as const, label: "Confirmação de Presença", icon: Users },
  { key: "messageWall" as const, label: "Mural de Mensagens", icon: MessageSquare },
  { key: "gallery" as const, label: "Galeria de Fotos", icon: Camera },
  { key: "video" as const, label: "Vídeo", icon: Video },
];

const categories = ["Cozinha", "Quarto", "Sala", "Banheiro", "Casa", "Eletrônicos", "Experiências", "Outros"];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const { config, updateConfig, addGift, updateGift, removeGift, toggleSection } = useWedding();
  
  const [editingGift, setEditingGift] = useState<GiftType | null>(null);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [weddingSlug, setWeddingSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newGift, setNewGift] = useState({
    name: "",
    category: "Cozinha",
    price: 0,
    image: "",
    externalLink: "",
  });
  const [dashboardTab, setDashboardTab] = useState<"settings" | "history">("settings");
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  // Mercado Pago credentials
  const [mercadoPagoPublicKey, setMercadoPagoPublicKey] = useState("");
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState("");
  const [mpValidating, setMpValidating] = useState(false);
  const [mpValidation, setMpValidation] = useState<{
    valid: boolean;
    message?: string;
    error?: string;
    isTestMode?: boolean;
  } | null>(null);

  // Payment method toggles
  const [paymentCreditCard, setPaymentCreditCard] = useState(true);
  const [paymentPix, setPaymentPix] = useState(true);
  const [paymentBoleto, setPaymentBoleto] = useState(true);
  const [maxInstallments, setMaxInstallments] = useState(12);

  // Story photos
  const [storyPhoto1, setStoryPhoto1] = useState("");
  const [storyPhoto2, setStoryPhoto2] = useState("");
  const [storyPhoto3, setStoryPhoto3] = useState("");

  // Load existing wedding data - only once on mount
  useEffect(() => {
    const loadWeddingData = async () => {
      if (!user || initialLoaded) return;

      const { data: wedding } = await supabase
        .from("weddings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (wedding) {
        setWeddingSlug(wedding.slug);
        setMercadoPagoPublicKey(wedding.mercado_pago_public_key || "");
        setMercadoPagoAccessToken(wedding.mercado_pago_access_token || "");
        setPaymentCreditCard((wedding as Record<string, unknown>).payment_credit_card as boolean ?? true);
        setPaymentPix((wedding as Record<string, unknown>).payment_pix as boolean ?? true);
        setPaymentBoleto((wedding as Record<string, unknown>).payment_boleto as boolean ?? true);
        setMaxInstallments((wedding as Record<string, unknown>).max_installments as number ?? 12);
        setStoryPhoto1((wedding as Record<string, unknown>).story_photo_1 as string || "");
        setStoryPhoto2((wedding as Record<string, unknown>).story_photo_2 as string || "");
        setStoryPhoto3((wedding as Record<string, unknown>).story_photo_3 as string || "");
        
        // Update context with saved data
        updateConfig({
          coupleName: wedding.couple_name,
          weddingDate: wedding.wedding_date || "",
          tagline: wedding.tagline || "",
          layout: wedding.layout as "classic" | "modern" | "minimalist",
          sections: {
            about: wedding.section_about,
            weddingInfo: wedding.section_wedding_info,
            gifts: wedding.section_gifts,
            rsvp: wedding.section_rsvp,
            messageWall: wedding.section_message_wall,
            gallery: wedding.section_gallery,
            video: wedding.section_video,
            dressCode: wedding.section_dress_code,
          },
          heroImage: wedding.hero_image_url || "",
          videoUrl: wedding.video_url || "",
          ceremonyDate: wedding.ceremony_date || "",
          ceremonyTime: wedding.ceremony_time || "",
          ceremonyLocation: wedding.ceremony_location || "",
          ceremonyAddress: wedding.ceremony_address || "",
          receptionLocation: wedding.reception_location || "",
          receptionAddress: wedding.reception_address || "",
          receptionTime: wedding.reception_time || "",
          sameLocation: (wedding as Record<string, unknown>).same_location as boolean || false,
          aboutText: wedding.about_text || "",
          dressCodeText: wedding.dress_code_text || "",
          colorsToAvoid: wedding.colors_to_avoid || "",
          additionalInfo: wedding.additional_info || "",
          storyPhotos: [
            (wedding as Record<string, unknown>).story_photo_1 as string,
            (wedding as Record<string, unknown>).story_photo_2 as string,
            (wedding as Record<string, unknown>).story_photo_3 as string,
          ].filter(Boolean) as string[],
        });

        // Load gifts
        const { data: gifts } = await supabase
          .from("gifts")
          .select("*")
          .eq("wedding_id", wedding.id);

        if (gifts && gifts.length > 0) {
          const formattedGifts = gifts.map(g => ({
            id: g.id,
            name: g.name,
            category: g.category,
            price: Number(g.price),
            image: g.image_url || "",
            externalLink: g.external_link || "",
          }));
          updateConfig({ gifts: formattedGifts });
        }

        setInitialLoaded(true);
      }
    };

    loadWeddingData();
  }, [user, initialLoaded]);

  const generateSlug = (coupleName: string): string => {
    return coupleName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/\s*&\s*/g, "-e-") // replace & with -e-
      .replace(/[^a-z0-9\s-]/g, "") // remove special chars
      .replace(/\s+/g, "-") // replace spaces with hyphens
      .replace(/-+/g, "-") // collapse multiple hyphens
      .replace(/^-|-$/g, "") // remove leading/trailing hyphens
      .trim();
  };

  const validateMercadoPago = async () => {
    if (!mercadoPagoPublicKey || !mercadoPagoAccessToken) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a Public Key e o Access Token para validar",
        variant: "destructive",
      });
      return false;
    }

    setMpValidating(true);
    setMpValidation(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-mercadopago", {
        body: {
          accessToken: mercadoPagoAccessToken,
          publicKey: mercadoPagoPublicKey,
        },
      });

      if (error) {
        setMpValidation({ valid: false, error: error.message });
        return false;
      }

      setMpValidation(data);
      
      if (data.valid) {
        toast({
          title: "Credenciais válidas!",
          description: data.message,
        });
        return true;
      } else {
        toast({
          title: "Credenciais inválidas",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setMpValidation({ valid: false, error: message });
      return false;
    } finally {
      setMpValidating(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate Mercado Pago if credentials are provided
    if (mercadoPagoPublicKey && mercadoPagoAccessToken) {
      const isValid = await validateMercadoPago();
      if (!isValid) {
        toast({
          title: "Credenciais do Mercado Pago inválidas",
          description: "Corrija as credenciais antes de salvar",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      // Check if wedding exists
      const { data: existingWedding } = await supabase
        .from("weddings")
        .select("id, slug")
        .eq("user_id", user.id)
        .single();

      // Always regenerate slug based on couple name
      const newSlug = generateSlug(config.coupleName);
      let slug = newSlug;

      // Check for uniqueness only if it's different from current
      if (!existingWedding?.slug || existingWedding.slug !== newSlug) {
        const { data: slugCheck } = await supabase
          .from("weddings")
          .select("slug, id")
          .eq("slug", newSlug)
          .single();

        if (slugCheck && slugCheck.id !== existingWedding?.id) {
          slug = `${newSlug}-${Date.now().toString(36)}`;
        }
      }

      const weddingData = {
        user_id: user.id,
        couple_name: config.coupleName,
        wedding_date: config.weddingDate || null,
        tagline: config.tagline || null,
        slug,
        layout: config.layout,
        section_about: config.sections.about,
        section_wedding_info: config.sections.weddingInfo,
        section_gifts: config.sections.gifts,
        section_rsvp: config.sections.rsvp,
        section_message_wall: config.sections.messageWall,
        section_gallery: config.sections.gallery,
        section_video: config.sections.video,
        section_dress_code: config.sections.dressCode,
        hero_image_url: config.heroImage || null,
        video_url: config.videoUrl || null,
        ceremony_date: config.ceremonyDate || null,
        ceremony_time: config.ceremonyTime || null,
        ceremony_location: config.ceremonyLocation || null,
        ceremony_address: config.ceremonyAddress || null,
        reception_location: config.sameLocation ? config.ceremonyLocation : (config.receptionLocation || null),
        reception_address: config.sameLocation ? config.ceremonyAddress : (config.receptionAddress || null),
        reception_time: config.receptionTime || null,
        same_location: config.sameLocation,
        about_text: config.aboutText || null,
        dress_code_text: config.dressCodeText || null,
        colors_to_avoid: config.colorsToAvoid || null,
        additional_info: config.additionalInfo || null,
        mercado_pago_public_key: mercadoPagoPublicKey || null,
        mercado_pago_access_token: mercadoPagoAccessToken || null,
        payment_credit_card: paymentCreditCard,
        payment_pix: paymentPix,
        payment_boleto: paymentBoleto,
        max_installments: maxInstallments,
        story_photo_1: storyPhoto1 || null,
        story_photo_2: storyPhoto2 || null,
        story_photo_3: storyPhoto3 || null,
      };

      let weddingId: string;

      if (existingWedding) {
        // Update
        const { error } = await supabase
          .from("weddings")
          .update(weddingData)
          .eq("id", existingWedding.id);

        if (error) throw error;
        weddingId = existingWedding.id;
      } else {
        // Insert
        const { data: newWedding, error } = await supabase
          .from("weddings")
          .insert(weddingData)
          .select("id")
          .single();

        if (error) throw error;
        weddingId = newWedding.id;
      }

      // Save gifts - delete existing first then insert new ones
      const { error: deleteGiftsError } = await supabase.from("gifts").delete().eq("wedding_id", weddingId);
      
      if (deleteGiftsError) {
        console.error("Error deleting gifts:", deleteGiftsError);
        throw new Error("Erro ao atualizar presentes. Tente novamente.");
      }

      // Insert new gifts only after successful delete
      if (config.gifts.length > 0) {
        const giftsToInsert = config.gifts.map(g => ({
          wedding_id: weddingId,
          name: g.name,
          category: g.category,
          price: g.price,
          image_url: g.image || null,
          external_link: g.externalLink || null,
        }));

        const { error: insertGiftsError } = await supabase.from("gifts").insert(giftsToInsert);
        
        if (insertGiftsError) {
          console.error("Error inserting gifts:", insertGiftsError);
          throw new Error("Erro ao salvar presentes. Tente novamente.");
        }

        // Reload gifts from DB to get proper UUIDs
        const { data: savedGifts } = await supabase
          .from("gifts")
          .select("*")
          .eq("wedding_id", weddingId);

        if (savedGifts) {
          const formattedGifts = savedGifts.map(g => ({
            id: g.id,
            name: g.name,
            category: g.category,
            price: Number(g.price),
            image: g.image_url || "",
            externalLink: g.external_link || "",
          }));
          updateConfig({ gifts: formattedGifts });
        }
      }

      setWeddingSlug(slug);
      
      // Update story photos in context
      updateConfig({
        storyPhotos: [storyPhoto1, storyPhoto2, storyPhoto3].filter(Boolean),
      });
      
      toast({
        title: "Salvo com sucesso!",
        description: `Seu site está disponível em: ${window.location.origin}/${slug}`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao salvar",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewGift = () => {
    if (newGift.name && newGift.price > 0) {
      addGift(newGift);
      setNewGift({ name: "", category: "Cozinha", price: 0, image: "", externalLink: "" });
      setIsAddingGift(false);
    }
  };

  const handleUpdateGift = () => {
    if (editingGift) {
      updateGift(editingGift.id, editingGift);
      setEditingGift(null);
    }
  };

  const copyLink = () => {
    if (weddingSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/${weddingSlug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleSameLocationChange = (checked: boolean) => {
    updateConfig({ sameLocation: checked });
    if (checked) {
      updateConfig({
        receptionLocation: config.ceremonyLocation,
        receptionAddress: config.ceremonyAddress,
      });
    }
  };

  const publicUrl = weddingSlug ? `${window.location.origin}/${weddingSlug}` : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold/10 rounded-lg">
                <Settings className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-foreground">Painel do Casal</h1>
                <p className="text-sm text-muted-foreground">Configure seu site de casamento</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/preview")}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gold hover:bg-gold-light text-background"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar e Publicar
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setDashboardTab("settings")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                dashboardTab === "settings"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="w-4 h-4" />
              Configurações
            </button>
            <button
              onClick={() => setDashboardTab("history")}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                dashboardTab === "history"
                  ? "border-gold text-gold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {dashboardTab === "history" ? (
          <DashboardHistory />
        ) : (
        <>
        {/* Published URL */}
        {publicUrl && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gold/10 rounded-xl p-6 border border-gold/20"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Link2 className="w-5 h-5 text-gold" />
                <div>
                  <p className="text-sm text-muted-foreground">Seu site está publicado em:</p>
                  <p className="font-medium text-foreground">{publicUrl}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? "Copiado!" : "Copiar Link"}
                </Button>
                <Button size="sm" className="bg-gold hover:bg-gold-light text-background" asChild>
                  <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Abrir Site
                  </a>
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {/* Section 1: Couple Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Informações do Casal</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="coupleName">Nome do Casal *</Label>
              <Input
                id="coupleName"
                value={config.coupleName}
                onChange={(e) => updateConfig({ coupleName: e.target.value })}
                placeholder="Ex: Maria & João"
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Será usado na URL: /{generateSlug(config.coupleName) || "nome-do-casal"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weddingDate">Data do Casamento</Label>
              <Input
                id="weddingDate"
                type="date"
                value={config.weddingDate}
                onChange={(e) => updateConfig({ weddingDate: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="tagline">Frase de Destaque</Label>
              <Input
                id="tagline"
                value={config.tagline}
                onChange={(e) => updateConfig({ tagline: e.target.value })}
                placeholder="Uma frase especial..."
                className="bg-background"
              />
            </div>
          </div>
        </motion.section>

        {/* Section 2: Layout Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Image className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Escolha do Layout</h2>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {layoutOptions.map((layout) => (
              <button
                key={layout.id}
                onClick={() => updateConfig({ layout: layout.id })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  config.layout === layout.id
                    ? "border-gold bg-gold/5"
                    : "border-border hover:border-gold/50"
                }`}
              >
                <div className={`h-24 rounded-lg mb-3 ${layout.preview}`} />
                <h3 className="font-medium text-foreground">{layout.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{layout.description}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Section 3: Toggle Sections */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Seções do Site</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sectionOptions.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
                <Switch
                  checked={config.sections[key]}
                  onCheckedChange={() => toggleSection(key)}
                />
              </div>
            ))}
          </div>
        </motion.section>

        {/* Section 4: Media with dimensions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Camera className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Mídia (Opcional)</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="heroImage">URL da Foto Principal (Hero)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Dimensões recomendadas:</p>
                    <p className="text-sm">1920 x 1080 pixels (16:9)</p>
                    <p className="text-sm">ou 1920 x 1280 pixels (3:2)</p>
                    <p className="text-sm text-muted-foreground mt-1">Formato: JPG ou PNG</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="heroImage"
                value={config.heroImage}
                onChange={(e) => updateConfig({ heroImage: e.target.value })}
                placeholder="https://..."
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                📐 Recomendado: 1920x1080px (16:9) ou 1920x1280px (3:2)
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="videoUrl">Link do Vídeo (YouTube/Vimeo)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium mb-1">Formatos aceitos:</p>
                    <p className="text-sm">youtube.com/watch?v=...</p>
                    <p className="text-sm">vimeo.com/...</p>
                    <p className="text-sm text-muted-foreground mt-1">Proporção 16:9 recomendada</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="videoUrl"
                value={config.videoUrl}
                onChange={(e) => updateConfig({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                🎬 Proporção recomendada: 16:9
              </p>
            </div>
          </div>

          {/* Gallery dimensions note */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
              <Camera className="w-4 h-4 text-gold" />
              Dimensões para Galeria de Fotos
            </h4>
            <div className="grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Fotos da História</p>
                <p>800 x 600px (4:3)</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Galeria Geral</p>
                <p>800 x 800px (1:1) ou 800 x 600px</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Imagem de Presente</p>
                <p>400 x 400px (1:1)</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 5: Story Photos */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Fotos da Nossa História</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Adicione até 3 fotos do casal para a seção "Nossa História". Essas fotos aparecerão na página pública do seu casamento.
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Foto Principal (grande)</Label>
              <Input
                value={storyPhoto1}
                onChange={(e) => setStoryPhoto1(e.target.value)}
                placeholder="URL da foto 1"
                className="bg-background"
              />
              {storyPhoto1 && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={storyPhoto1} alt="Preview 1" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Foto 2</Label>
              <Input
                value={storyPhoto2}
                onChange={(e) => setStoryPhoto2(e.target.value)}
                placeholder="URL da foto 2"
                className="bg-background"
              />
              {storyPhoto2 && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={storyPhoto2} alt="Preview 2" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Foto 3</Label>
              <Input
                value={storyPhoto3}
                onChange={(e) => setStoryPhoto3(e.target.value)}
                placeholder="URL da foto 3"
                className="bg-background"
              />
              {storyPhoto3 && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img src={storyPhoto3} alt="Preview 3" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            📐 Dimensão recomendada: 800x600px (4:3) para melhor visualização
          </p>
        </motion.section>

        {/* Section 6: Mercado Pago Integration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Integração Mercado Pago</h2>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
            <p className="text-sm text-muted-foreground">
              Configure sua conta do Mercado Pago para receber pagamentos diretamente na sua conta.
              Os convidados poderão pagar via Pix, cartão ou boleto.
            </p>
            <a 
              href="https://www.mercadopago.com.br/developers/panel/credentials" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gold hover:underline inline-flex items-center gap-1 mt-2"
            >
              Obter credenciais no Mercado Pago
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {mpValidation && (
            <Alert className={`mb-4 ${mpValidation.valid ? 'border-green-500 bg-green-500/10' : 'border-destructive bg-destructive/10'}`}>
              <AlertDescription className="flex items-center gap-2">
                {mpValidation.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-700">{mpValidation.message}</span>
                    {mpValidation.isTestMode && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Modo Teste</span>
                    )}
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-destructive" />
                    <span className="text-destructive">{mpValidation.error}</span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="mpPublicKey">Public Key</Label>
              <Input
                id="mpPublicKey"
                value={mercadoPagoPublicKey}
                onChange={(e) => {
                  setMercadoPagoPublicKey(e.target.value);
                  setMpValidation(null);
                }}
                placeholder="APP_USR-... ou TEST-..."
                className="bg-background font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mpAccessToken">Access Token</Label>
              <Input
                id="mpAccessToken"
                type="password"
                value={mercadoPagoAccessToken}
                onChange={(e) => {
                  setMercadoPagoAccessToken(e.target.value);
                  setMpValidation(null);
                }}
                placeholder="APP_USR-... ou TEST-..."
                className="bg-background font-mono text-sm"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <Button
              variant="outline"
              onClick={validateMercadoPago}
              disabled={mpValidating || !mercadoPagoPublicKey || !mercadoPagoAccessToken}
            >
              {mpValidating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <p className="text-xs text-muted-foreground">
              ⚠️ As credenciais serão validadas antes de salvar
            </p>
          </div>

          {/* Payment Method Toggles */}
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="font-medium text-foreground mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold" />
              Métodos de Pagamento
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha quais métodos de pagamento estarão disponíveis para os convidados.
            </p>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">Cartão de Crédito</span>
                </div>
                <Switch
                  checked={paymentCreditCard}
                  onCheckedChange={setPaymentCreditCard}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <QrCode className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">Pix</span>
                </div>
                <Switch
                  checked={paymentPix}
                  onCheckedChange={setPaymentPix}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-foreground">Boleto</span>
                </div>
                <Switch
                  checked={paymentBoleto}
                  onCheckedChange={setPaymentBoleto}
                />
              </div>
            </div>

            {/* Installment Configuration */}
            {paymentCreditCard && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <Label htmlFor="maxInstallments" className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-gold" />
                  Máximo de Parcelas
                </Label>
                <Select
                  value={maxInstallments.toString()}
                  onValueChange={(val) => setMaxInstallments(parseInt(val))}
                >
                  <SelectTrigger className="w-full sm:w-48 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 9, 10, 12].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n === 1 ? "À vista (sem parcelamento)" : `Até ${n}x`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Define o número máximo de parcelas disponíveis no cartão de crédito.
                </p>
              </div>
            )}

            {!paymentCreditCard && !paymentPix && !paymentBoleto && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertDescription className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-destructive">Pelo menos um método de pagamento deve estar ativado.</span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </motion.section>

        {/* Section 7: Wedding Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Informações do Casamento</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ceremony */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Cerimônia
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    value={config.ceremonyDate}
                    onChange={(e) => updateConfig({ ceremonyDate: e.target.value })}
                    placeholder="15 de Agosto de 2025"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    value={config.ceremonyTime}
                    onChange={(e) => updateConfig({ ceremonyTime: e.target.value })}
                    placeholder="16:00"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={config.ceremonyLocation}
                  onChange={(e) => updateConfig({ ceremonyLocation: e.target.value })}
                  placeholder="Nome do local"
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={config.ceremonyAddress}
                  onChange={(e) => updateConfig({ ceremonyAddress: e.target.value })}
                  placeholder="Endereço completo"
                  className="bg-background"
                />
              </div>
            </div>

            {/* Reception */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" />
                  Recepção
                </h3>
              </div>

              {/* Same location toggle */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
                <Checkbox
                  id="sameLocation"
                  checked={config.sameLocation}
                  onCheckedChange={(checked) => handleSameLocationChange(checked === true)}
                />
                <label htmlFor="sameLocation" className="text-sm cursor-pointer">
                  Cerimônia e recepção no mesmo local
                </label>
              </div>

              {!config.sameLocation && (
                <>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input
                      value={config.receptionTime}
                      onChange={(e) => updateConfig({ receptionTime: e.target.value })}
                      placeholder="18:30"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Local</Label>
                    <Input
                      value={config.receptionLocation}
                      onChange={(e) => updateConfig({ receptionLocation: e.target.value })}
                      placeholder="Nome do local"
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={config.receptionAddress}
                      onChange={(e) => updateConfig({ receptionAddress: e.target.value })}
                      placeholder="Endereço completo"
                      className="bg-background"
                    />
                  </div>
                </>
              )}

              {config.sameLocation && (
                <div className="space-y-2">
                  <Label>Horário da Recepção</Label>
                  <Input
                    value={config.receptionTime}
                    onChange={(e) => updateConfig({ receptionTime: e.target.value })}
                    placeholder="18:30"
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Local será o mesmo da cerimônia
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Section 8: About */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Sobre o Casal</h2>
          </div>
          
          <div className="space-y-2">
            <Label>Sua História</Label>
            <Textarea
              value={config.aboutText}
              onChange={(e) => updateConfig({ aboutText: e.target.value })}
              placeholder="Conte a história de vocês..."
              className="bg-background min-h-[150px]"
            />
          </div>
        </motion.section>

        {/* Section 9: Dress Code */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.47 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Shirt className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Dress Code</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição do Traje</Label>
              <Textarea
                value={config.dressCodeText}
                onChange={(e) => updateConfig({ dressCodeText: e.target.value })}
                placeholder="Esporte fino, traje social, etc."
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Cores a Evitar</Label>
              <Input
                value={config.colorsToAvoid}
                onChange={(e) => updateConfig({ colorsToAvoid: e.target.value })}
                placeholder="Branco, off-white..."
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Informações Adicionais</Label>
              <Textarea
                value={config.additionalInfo}
                onChange={(e) => updateConfig({ additionalInfo: e.target.value })}
                placeholder="Dicas extras, como calçados confortáveis..."
                className="bg-background"
              />
            </div>
          </div>
        </motion.section>

        {/* Section 10: Gift Registry */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-gold" />
              <h2 className="font-serif text-xl text-foreground">Lista de Presentes</h2>
            </div>
            <Dialog open={isAddingGift} onOpenChange={setIsAddingGift}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold-light text-background">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Presente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-serif">Adicionar Novo Presente</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome do Presente *</Label>
                    <Input
                      value={newGift.name}
                      onChange={(e) => setNewGift({ ...newGift, name: e.target.value })}
                      placeholder="Ex: Jogo de Panelas"
                      className="bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={newGift.category}
                        onValueChange={(value) => setNewGift({ ...newGift, category: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$) *</Label>
                      <Input
                        type="number"
                        value={newGift.price || ""}
                        onChange={(e) => setNewGift({ ...newGift, price: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>URL da Imagem</Label>
                      <span className="text-xs text-muted-foreground">(400x400px)</span>
                    </div>
                    <Input
                      value={newGift.image}
                      onChange={(e) => setNewGift({ ...newGift, image: e.target.value })}
                      placeholder="https://..."
                      className="bg-background"
                    />
                  </div>
                  <Button onClick={handleSaveNewGift} className="w-full bg-gold hover:bg-gold-light text-background">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Presente
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Gifts Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.gifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-muted/50 rounded-lg border border-border overflow-hidden group"
              >
                <div className="aspect-video bg-secondary relative">
                  {gift.image ? (
                    <img src={gift.image} alt={gift.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingGift(gift)}
                      className="p-2 bg-card rounded-lg shadow hover:bg-muted"
                    >
                      <Edit2 className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                      onClick={() => removeGift(gift.id)}
                      className="p-2 bg-card rounded-lg shadow hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <span className="text-xs text-gold uppercase tracking-wider">{gift.category}</span>
                  <h3 className="font-medium text-foreground mt-1">{gift.name}</h3>
                  <p className="text-lg font-serif text-gold mt-2">
                    R$ {gift.price.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Gift Dialog */}
          <Dialog open={!!editingGift} onOpenChange={(open) => !open && setEditingGift(null)}>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle className="font-serif">Editar Presente</DialogTitle>
              </DialogHeader>
              {editingGift && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Nome do Presente</Label>
                    <Input
                      value={editingGift.name}
                      onChange={(e) => setEditingGift({ ...editingGift, name: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={editingGift.category}
                        onValueChange={(value) => setEditingGift({ ...editingGift, category: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        value={editingGift.price}
                        onChange={(e) => setEditingGift({ ...editingGift, price: parseFloat(e.target.value) || 0 })}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>URL da Imagem</Label>
                    <Input
                      value={editingGift.image}
                      onChange={(e) => setEditingGift({ ...editingGift, image: e.target.value })}
                      className="bg-background"
                    />
                  </div>
                  <Button onClick={handleUpdateGift} className="w-full bg-gold hover:bg-gold-light text-background">
                    <Save className="w-4 h-4 mr-2" />
                    Atualizar Presente
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.section>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="flex justify-center pt-8 gap-4"
        >
          <Button 
            variant="outline"
            size="lg"
            onClick={() => navigate("/preview")}
          >
            <Eye className="w-5 h-5 mr-3" />
            Visualizar Preview
          </Button>
          <Button 
            size="lg"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gold hover:bg-gold-light text-background text-lg px-12 py-6"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <Save className="w-5 h-5 mr-3" />
            )}
            Salvar e Publicar Site
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
        </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
