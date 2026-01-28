import React, { createContext, useContext, useState, ReactNode } from "react";

export interface Gift {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  externalLink: string;
}

export interface WeddingConfig {
  // Couple Info
  coupleName: string;
  weddingDate: string;
  tagline: string;
  
  // Layout
  layout: "classic" | "modern" | "minimalist";
  
  // Sections Toggle
  sections: {
    about: boolean;
    weddingInfo: boolean;
    gifts: boolean;
    rsvp: boolean;
    messageWall: boolean;
    gallery: boolean;
    video: boolean;
    dressCode: boolean;
  };
  
  // Media
  heroImage: string;
  galleryImages: string[];
  videoUrl: string;
  
  // Wedding Info
  ceremonyDate: string;
  ceremonyTime: string;
  ceremonyLocation: string;
  ceremonyAddress: string;
  receptionLocation: string;
  receptionAddress: string;
  receptionTime: string;
  
  // Gift Registry
  gifts: Gift[];
  
  // About Section
  aboutText: string;
  storyPhotos: string[];
  
  // Dress Code
  dressCodeText: string;
  colorsToAvoid: string;
  additionalInfo: string;
}

interface WeddingContextType {
  config: WeddingConfig;
  updateConfig: (updates: Partial<WeddingConfig>) => void;
  addGift: (gift: Omit<Gift, "id">) => void;
  updateGift: (id: string, updates: Partial<Gift>) => void;
  removeGift: (id: string) => void;
  toggleSection: (section: keyof WeddingConfig["sections"]) => void;
}

const defaultConfig: WeddingConfig = {
  coupleName: "Camila & Rafael",
  weddingDate: "2025-08-15",
  tagline: "Estamos ansiosos para celebrar esse dia com você",
  
  layout: "classic",
  
  sections: {
    about: true,
    weddingInfo: true,
    gifts: true,
    rsvp: true,
    messageWall: true,
    gallery: true,
    video: false,
    dressCode: true,
  },
  
  heroImage: "",
  galleryImages: [],
  videoUrl: "",
  
  ceremonyDate: "15 de Agosto de 2025",
  ceremonyTime: "16:00",
  ceremonyLocation: "Igreja Nossa Senhora da Paz",
  ceremonyAddress: "Rua das Flores, 123 - Jardim Botânico, São Paulo - SP",
  receptionLocation: "Villa Garden Eventos",
  receptionAddress: "Av. das Palmeiras, 456 - Alto de Pinheiros, São Paulo - SP",
  receptionTime: "18:30",
  
  gifts: [
    {
      id: "1",
      name: "Jogo de Panelas Tramontina",
      category: "Cozinha",
      price: 599.90,
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
      externalLink: "https://www.amazon.com.br",
    },
    {
      id: "2",
      name: "Jogo de Cama King",
      category: "Quarto",
      price: 450.00,
      image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400",
      externalLink: "https://www.amazon.com.br",
    },
    {
      id: "3",
      name: "Cafeteira Expresso",
      category: "Cozinha",
      price: 899.00,
      image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400",
      externalLink: "https://www.amazon.com.br",
    },
    {
      id: "4",
      name: "Aspirador Robô",
      category: "Casa",
      price: 1299.00,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      externalLink: "https://www.amazon.com.br",
    },
    {
      id: "5",
      name: "Smart TV 55\"",
      category: "Eletrônicos",
      price: 2499.00,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
      externalLink: "https://www.amazon.com.br",
    },
    {
      id: "6",
      name: "Cotas Lua de Mel",
      category: "Experiências",
      price: 200.00,
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
      externalLink: "https://www.picpay.com",
    },
  ],
  
  aboutText: "Nossa história começou de um jeito que nem os melhores roteiristas poderiam imaginar. Era 2019, uma festa de aniversário de um amigo em comum, e nossos olhares se cruzaram do outro lado da sala.\n\nRafael diz que foi amor à primeira vista. Camila confessa que precisou de um pouco mais de convencimento — mas apenas algumas semanas.\n\nDesde então, construímos juntos sonhos, viagens inesquecíveis, e a certeza de que queríamos passar o resto de nossas vidas um ao lado do outro.",
  storyPhotos: [],
  
  dressCodeText: "Esporte fino. Para homens, terno ou blazer com calça social. Para mulheres, vestido longo ou midi elegante.",
  colorsToAvoid: "Branco, off-white e tons muito claros de bege (cores reservadas para a noiva)",
  additionalInfo: "A cerimônia será ao ar livre. Recomendamos calçados confortáveis. Cheguem com 30 minutos de antecedência.",
};

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<WeddingConfig>(defaultConfig);

  const updateConfig = (updates: Partial<WeddingConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const addGift = (gift: Omit<Gift, "id">) => {
    const newGift: Gift = {
      ...gift,
      id: Date.now().toString(),
    };
    setConfig((prev) => ({
      ...prev,
      gifts: [...prev.gifts, newGift],
    }));
  };

  const updateGift = (id: string, updates: Partial<Gift>) => {
    setConfig((prev) => ({
      ...prev,
      gifts: prev.gifts.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  };

  const removeGift = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      gifts: prev.gifts.filter((g) => g.id !== id),
    }));
  };

  const toggleSection = (section: keyof WeddingConfig["sections"]) => {
    setConfig((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: !prev.sections[section],
      },
    }));
  };

  return (
    <WeddingContext.Provider
      value={{
        config,
        updateConfig,
        addGift,
        updateGift,
        removeGift,
        toggleSection,
      }}
    >
      {children}
    </WeddingContext.Provider>
  );
};

export const useWedding = () => {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error("useWedding must be used within WeddingProvider");
  }
  return context;
};
