export const translations = {
  // Game item component
  notRated: "Non noté",
  notTracked: "Non suivi", 
  hour: "heure",
  hours: "heures",
  rating: "Note",
  playTime: "Temps de jeu",
  added: "Ajouté",
  lastPlayed: "Dernière partie",
  notes: "Notes",
  
  // Menu actions
  editGame: "Modifier le jeu",
  deleteGame: "Supprimer le jeu",
  viewOnSteam: "Voir sur Steam",
  openMenu: "Ouvrir le menu",
  
  // Common terms
  steam: "Steam",
  
  // Status labels (already in French in types/game.ts)
  // Form labels (already in French in game-form.tsx)
  // Auth labels (already in French in login/register forms)
} as const;

export type TranslationKey = keyof typeof translations;

// Helper function to get translation
export const t = (key: TranslationKey): string => {
  return translations[key];
};