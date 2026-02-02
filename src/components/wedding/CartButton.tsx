import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

interface CartButtonProps {
  onClick: () => void;
}

const CartButton = ({ onClick }: CartButtonProps) => {
  const { getTotalItems, getTotalPrice } = useCart();
  const totalItems = getTotalItems();

  if (totalItems === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={onClick}
        size="lg"
        className="bg-gold hover:bg-gold-dark text-white rounded-full shadow-elevated px-6 py-6 gap-3"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-white text-gold text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {totalItems}
          </span>
        </div>
        <span className="font-medium">
          R$ {getTotalPrice().toFixed(2).replace(".", ",")}
        </span>
      </Button>
    </motion.div>
  );
};

export default CartButton;
