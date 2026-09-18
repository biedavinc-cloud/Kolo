import React from "react";
import CategoryManager from "@/components/CategoryManager";

export default function Categories() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Catégories</h1>
        <p className="text-sm text-muted-foreground">
          Listez, ajoutez ou modifiez vos catégories de dépenses et de revenus pour mieux segmenter
          vos données. Chaque catégorie possède une couleur et une icône utilisées dans les
          graphiques et le calendrier.
        </p>
      </div>
      <CategoryManager />
    </div>
  );
}