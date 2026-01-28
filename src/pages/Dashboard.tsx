import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Settings, Eye, Heart, Calendar, Image, Gift, 
  MessageSquare, Users, Camera, Video, Shirt, 
  Plus, Trash2, Edit2, Save, X, ExternalLink, ChevronRight
} from "lucide-react";
import { useWedding, Gift as GiftType } from "@/contexts/WeddingContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const { config, updateConfig, addGift, updateGift, removeGift, toggleSection } = useWedding();
  const [editingGift, setEditingGift] = useState<GiftType | null>(null);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [newGift, setNewGift] = useState({
    name: "",
    category: "Cozinha",
    price: 0,
    image: "",
    externalLink: "",
  });

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
            <Button 
              onClick={() => navigate("/preview")}
              className="bg-gold hover:bg-gold-light text-background"
            >
              <Eye className="w-4 h-4 mr-2" />
              Visualizar Site
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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

        {/* Section 4: Media */}
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
              <Label htmlFor="heroImage">URL da Foto Principal</Label>
              <Input
                id="heroImage"
                value={config.heroImage}
                onChange={(e) => updateConfig({ heroImage: e.target.value })}
                placeholder="https://..."
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">Deixe vazio para usar o design padrão</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Link do Vídeo (YouTube/Vimeo)</Label>
              <Input
                id="videoUrl"
                value={config.videoUrl}
                onChange={(e) => updateConfig({ videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                className="bg-background"
              />
            </div>
          </div>
        </motion.section>

        {/* Section 5: Wedding Info */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card rounded-xl p-6 shadow-soft border border-border"
        >
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="w-5 h-5 text-gold" />
            <h2 className="font-serif text-xl text-foreground">Informações do Casamento</h2>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Ceremony */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Cerimônia</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    value={config.ceremonyDate}
                    onChange={(e) => updateConfig({ ceremonyDate: e.target.value })}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    value={config.ceremonyTime}
                    onChange={(e) => updateConfig({ ceremonyTime: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={config.ceremonyLocation}
                  onChange={(e) => updateConfig({ ceremonyLocation: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={config.ceremonyAddress}
                  onChange={(e) => updateConfig({ ceremonyAddress: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>

            {/* Reception */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Recepção</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Horário</Label>
                  <Input
                    value={config.receptionTime}
                    onChange={(e) => updateConfig({ receptionTime: e.target.value })}
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={config.receptionLocation}
                  onChange={(e) => updateConfig({ receptionLocation: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Endereço</Label>
                <Input
                  value={config.receptionAddress}
                  onChange={(e) => updateConfig({ receptionAddress: e.target.value })}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
        </motion.section>

        {/* Section 6: About */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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

        {/* Section 7: Gift Registry */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
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
                    <Label>URL da Imagem</Label>
                    <Input
                      value={newGift.image}
                      onChange={(e) => setNewGift({ ...newGift, image: e.target.value })}
                      placeholder="https://..."
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link Externo (onde comprar)</Label>
                    <Input
                      value={newGift.externalLink}
                      onChange={(e) => setNewGift({ ...newGift, externalLink: e.target.value })}
                      placeholder="https://loja.com/produto"
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
                  <div className="space-y-2">
                    <Label>Link Externo</Label>
                    <Input
                      value={editingGift.externalLink}
                      onChange={(e) => setEditingGift({ ...editingGift, externalLink: e.target.value })}
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

        {/* Preview Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center pt-8"
        >
          <Button 
            size="lg"
            onClick={() => navigate("/preview")}
            className="bg-gold hover:bg-gold-light text-background text-lg px-12 py-6"
          >
            <Eye className="w-5 h-5 mr-3" />
            Visualizar Site como Convidado
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
