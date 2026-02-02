import React, { createContext, useContext, useState, ReactNode } from "react";
import { Gift } from "@/contexts/WeddingContext";

export interface CartItem {
  gift: Gift;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (gift: Gift) => void;
  removeItem: (giftId: string) => void;
  updateQuantity: (giftId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  includeEnvelope: boolean;
  setIncludeEnvelope: (value: boolean) => void;
  envelopePrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const ENVELOPE_PRICE = 4.90;

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [includeEnvelope, setIncludeEnvelope] = useState(true);

  const addItem = (gift: Gift) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.gift.id === gift.id);
      if (existing) {
        return prev.map((item) =>
          item.gift.id === gift.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { gift, quantity: 1 }];
    });
  };

  const removeItem = (giftId: string) => {
    setItems((prev) => prev.filter((item) => item.gift.id !== giftId));
  };

  const updateQuantity = (giftId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(giftId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.gift.id === giftId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setIncludeEnvelope(true);
  };

  const getTotalItems = () => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  };

  const getTotalPrice = () => {
    const giftsTotal = items.reduce(
      (acc, item) => acc + item.gift.price * item.quantity,
      0
    );
    return includeEnvelope ? giftsTotal + ENVELOPE_PRICE : giftsTotal;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        includeEnvelope,
        setIncludeEnvelope,
        envelopePrice: ENVELOPE_PRICE,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
