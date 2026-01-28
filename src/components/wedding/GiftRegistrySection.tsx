import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useMemo } from "react";
import { Search, ExternalLink, Filter, Gift } from "lucide-react";
import { useWedding, Gift as GiftType } from "@/contexts/WeddingContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const priceRanges = [
  { label: "Todos os preços", min: 0, max: Infinity },
  { label: "Até R$ 200", min: 0, max: 200 },
  { label: "R$ 200 - R$ 500", min: 200, max: 500 },
  { label: "R$ 500 - R$ 1.000", min: 500, max: 1000 },
  { label: "Acima de R$ 1.000", min: 1000, max: Infinity },
];

const GiftRegistrySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { config } = useWedding();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  const categories = useMemo(() => {
    const cats = new Set(config.gifts.map((g) => g.category));
    return ["all", ...Array.from(cats)];
  }, [config.gifts]);

  const filteredGifts = useMemo(() => {
    return config.gifts.filter((gift) => {
      const matchesSearch = gift.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || gift.category === selectedCategory;
      const range = priceRanges[selectedPriceRange];
      const matchesPrice = gift.price >= range.min && gift.price <= range.max;
      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [config.gifts, searchTerm, selectedCategory, selectedPriceRange]);

  return (
    <section ref={ref} id="gifts" className="py-24 sm:py-32 bg-secondary/50">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-gold uppercase tracking-[0.2em] text-sm mb-4">Presentes</p>
          <h2 className="section-title">Lista de Presentes</h2>
          <div className="gold-divider mt-6" />
          <p className="section-subtitle max-w-2xl mx-auto">
            Sua presença é nosso maior presente, mas se desejar nos presentear,
            preparamos algumas sugestões especiais
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-8 max-w-4xl mx-auto"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar presente..."
              className="pl-10 bg-card"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "all" ? "Todas as categorias" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedPriceRange.toString()}
            onValueChange={(v) => setSelectedPriceRange(parseInt(v))}
          >
            <SelectTrigger className="w-full sm:w-48 bg-card">
              <SelectValue placeholder="Faixa de preço" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {priceRanges.map((range, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results count */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-muted-foreground text-sm mb-6 text-center"
        >
          {filteredGifts.length} {filteredGifts.length === 1 ? "presente encontrado" : "presentes encontrados"}
        </motion.p>

        {/* Gifts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGifts.map((gift, index) => (
            <motion.a
              key={gift.id}
              href={gift.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
              className="group card-wedding overflow-hidden hover:shadow-elevated transition-all duration-300"
            >
              <div className="aspect-video bg-secondary rounded-lg overflow-hidden mb-4 relative">
                {gift.image ? (
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Gift className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-3 right-3 p-2 bg-card/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4 text-gold" />
                </div>
              </div>
              <span className="text-xs text-gold uppercase tracking-wider">{gift.category}</span>
              <h3 className="font-serif text-lg text-foreground mt-1 group-hover:text-gold transition-colors">
                {gift.name}
              </h3>
              <p className="text-2xl font-serif text-gold mt-3">
                R$ {gift.price.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Clique para ver na loja
              </p>
            </motion.a>
          ))}
        </div>

        {filteredGifts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum presente encontrado com os filtros selecionados</p>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default GiftRegistrySection;
