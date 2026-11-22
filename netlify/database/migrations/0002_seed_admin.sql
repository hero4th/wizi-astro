-- Seed: crea la credencial de admin (fila única id=1).
-- Contraseña: ProAcademy2026! (cambiar desde el panel → Seguridad tras el primer login).
-- Hash bcrypt con 12 rounds. Si la fila ya existe, no la toca.

INSERT INTO admin_credentials (id, password_hash, sessions_valid_from, password_changed_at, updated_at)
VALUES (
  1,
  '$2b$12$83lVp3cBji2LRw6.om/EOes34VAnhvWDXRgp2RxwrUuoHDd9/Bn4G',
  now() - interval '1 day',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
