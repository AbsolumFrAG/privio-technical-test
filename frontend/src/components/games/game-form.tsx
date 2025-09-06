import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CreateGameData, Game, GameStatus } from "@/types/game";
import {
  GAME_STATUS_LABELS,
  GameStatus as GameStatusConstants,
  RATING_OPTIONS,
} from "@/types/game";
import { useState } from "react";

interface GameFormProps {
  game?: Game;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGameData) => Promise<void>;
  isLoading?: boolean;
}

export function GameForm({
  game,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: GameFormProps) {
  const [formData, setFormData] = useState({
    title: game?.title || "",
    rating: game?.rating || 0,
    hoursPlayed: game?.hoursPlayed || 0,
    status: game?.status || GameStatusConstants.BACKLOG,
    imageUrl: game?.imageUrl || "",
    notes: game?.notes || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Le titre est obligatoire";
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = "La note doit être entre 0 et 5";
    }

    if (formData.hoursPlayed < 0) {
      newErrors.hoursPlayed = "Les heures jouées ne peuvent pas être négatives";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      title: formData.title.trim(),
      rating: formData.rating || undefined,
      hoursPlayed: formData.hoursPlayed || undefined,
      status: formData.status as GameStatus,
      imageUrl: formData.imageUrl.trim() || undefined,
      notes: formData.notes.trim() || undefined,
    };

    try {
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleReset = () => {
    if (game) {
      setFormData({
        title: game.title,
        rating: game.rating || 0,
        hoursPlayed: game.hoursPlayed || 0,
        status: game.status || GameStatusConstants.BACKLOG,
        imageUrl: game.imageUrl || "",
        notes: game.notes || "",
      });
    } else {
      setFormData({
        title: "",
        rating: 0,
        hoursPlayed: 0,
        status: GameStatusConstants.BACKLOG,
        imageUrl: "",
        notes: "",
      });
    }
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{game ? "Éditer le Jeu" : "Ajouter un Nouveau Jeu"}</DialogTitle>
          <DialogDescription>
            {game
              ? "Mettez à jour les informations et le statut de votre jeu."
              : "Ajoutez un nouveau jeu à votre bibliothèque."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Saisissez le titre du jeu"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Note</Label>
              <Select
                value={formData.rating.toString()}
                onValueChange={(value) =>
                  handleInputChange("rating", parseFloat(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une note" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucune note</SelectItem>
                  {RATING_OPTIONS.map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      {rating} ⭐
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rating && (
                <p className="text-sm text-destructive">{errors.rating}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursPlayed">Heures Jouées</Label>
              <Input
                id="hoursPlayed"
                type="number"
                min="0"
                step="0.5"
                value={formData.hoursPlayed}
                onChange={(e) =>
                  handleInputChange(
                    "hoursPlayed",
                    parseFloat(e.target.value) || 0
                  )
                }
                placeholder="0"
                aria-invalid={!!errors.hoursPlayed}
              />
              {errors.hoursPlayed && (
                <p className="text-sm text-destructive">{errors.hoursPlayed}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GameStatusConstants).map((status) => (
                  <SelectItem key={status} value={status}>
                    {GAME_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ImageUpload
            value={formData.imageUrl}
            onChange={(url) => handleInputChange("imageUrl", url || "")}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Vos pensées, notes de progrès, etc..."
              rows={3}
            />
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reinitialiser
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sauvegarde..." : game ? "Mettre à jour le Jeu" : "Ajouter le Jeu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
