-- El seed del admin ya no debe existir como migración: la credencial se
-- siembra en runtime desde ADMIN_PASSWORD_HASH (ver src/lib/auth.ts).
--
-- Netlify Database no permite modificar ni eliminar una migración ya aplicada,
-- así que este paso borra su registro para poder retirar el archivo 0002 en el
-- siguiente deploy. Se ejecuta una sola vez y no afecta la fila existente de
-- admin_credentials.
DELETE FROM netlify.migrations WHERE name = '0002_seed_admin';
