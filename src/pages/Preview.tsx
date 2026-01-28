import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWedding } from "@/contexts/WeddingContext";
import PublicLanding from "@/components/wedding/PublicLanding";

const Preview = () => {
  const navigate = useNavigate();
  const { config } = useWedding();

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 bg-foreground/95 backdrop-blur-sm z-50 border-b border-foreground/10"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-background hover:bg-background/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Editar
            </Button>
            <div className="hidden sm:flex items-center gap-2 text-background/70">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Modo Preview</span>
            </div>
          </div>
          <Button
            onClick={() => navigate("/site")}
            className="bg-gold hover:bg-gold-light text-background"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir Página Pública
          </Button>
        </div>
      </motion.header>

      {/* Landing Preview */}
      <div className="pt-14">
        <PublicLanding isPreview />
      </div>
    </div>
  );
};

export default Preview;
