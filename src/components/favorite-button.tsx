"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FavoriteButton({
  recipeId,
  initialFavoriteId,
  compact = false,
}: {
  recipeId: string;
  initialFavoriteId?: string | null;
  compact?: boolean;
}) {
  const [favoriteId, setFavoriteId] = useState(initialFavoriteId ?? null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggleFavorite() {
    setPending(true);
    setError("");
    const response = favoriteId
      ? await fetch(`/api/favorites/${favoriteId}`, { method: "DELETE" })
      : await fetch("/api/favorites", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ recipeId }),
        });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error ?? "Could not update favorites.");
    } else {
      setFavoriteId(favoriteId ? null : result.favorite.id);
    }
    setPending(false);
  }

  return (
    <div>
      <Button
        type="button"
        variant={favoriteId ? "peach" : "outline"}
        size={compact ? "sm" : "default"}
        onClick={toggleFavorite}
        disabled={pending}
        aria-pressed={Boolean(favoriteId)}
      >
        <Heart className="size-4" fill={favoriteId ? "currentColor" : "none"} />
        {pending ? "Saving..." : favoriteId ? "Saved" : "Save to favorites"}
      </Button>
      {error && <p className="mt-2 text-xs font-bold text-red-700" role="alert">{error}</p>}
    </div>
  );
}
