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
      newErrors.title = "Title is required";
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = "Rating must be between 0 and 5";
    }

    if (formData.hoursPlayed < 0) {
      newErrors.hoursPlayed = "Hours played cannot be negative";
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
          <DialogTitle>{game ? "Edit Game" : "Add New Game"}</DialogTitle>
          <DialogDescription>
            {game
              ? "Update your game information and status."
              : "Add a new game to your library."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter game title"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={formData.rating.toString()}
                onValueChange={(value) =>
                  handleInputChange("rating", parseFloat(value))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No rating</SelectItem>
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
              <Label htmlFor="hoursPlayed">Hours Played</Label>
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
            <Label htmlFor="status">Status</Label>
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
              placeholder="Your thoughts, progress notes, etc..."
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
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : game ? "Update Game" : "Add Game"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
