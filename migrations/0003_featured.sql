-- met à jour la sélection de produits vedettes (8, réparties sur les 6 gammes)
UPDATE products SET featured = 0;
UPDATE products SET featured = 1 WHERE id IN (
  'platre-staff-tete-de-lion',
  'platre-plaque-deco-classique',
  'lambris-pvc-deco',
  'filasse-naturelle',
  'tuyau-pex-al-pex-ifan',
  'sdpf-ciment-colle',
  'wc-luxe-monobloc-zotoz',
  'brouette-chantier-coloree'
);
