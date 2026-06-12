-- Numéro WhatsApp conservé tel quel ; ajout d'un numéro dédié appels & SMS.
UPDATE settings SET value = '+225 07 17 59 30 30' WHERE key = 'contact_phone';
INSERT OR REPLACE INTO settings (key, value) VALUES ('contact_phone_call', '+225 07 47 90 63 90');
