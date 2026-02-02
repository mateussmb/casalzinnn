import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWedding } from "@/contexts/WeddingContext";
import PublicLanding from "@/components/wedding/PublicLanding";
import { supabase } from "@/integrations/supabase/client";

const Preview = () => {
  const navigate = useNavigate();
  const { config } = useWedding();
  const [weddingId, setWeddingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeddingId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: wedding } = await supabase
            .from("weddings")
            .select("id")
            .eq("user_id", user.id)
            .single();
          
          if (wedding) {
            setWeddingId(wedding.id);
          }
        }
      } catch (error) {
        console.error("Error fetching wedding:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeddingId();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

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
              onClick={() => navigate("/dashboard")}
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
          {config.coupleName && (
            <Button
              onClick={() => {
                // Navigate to the public site using the slug pattern
                const slug = config.coupleName.toLowerCase().replace(/\s*&\s*/g, "-").replace(/\s+/g, "-");
                window.open(`/${slug}`, "_blank");
              }}
              className="bg-gold hover:bg-gold-dark text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Abrir Página Pública
            </Button>
          )}
        </div>
      </motion.header>

      {/* Landing Preview */}
      <div className="pt-14">
        <PublicLanding 
          isPreview 
          weddingId={weddingId || undefined}
        />
      </div>
    </div>
  );
};

export default Preview;
