-- Material con imagen + fuente (grill Q1-Q10)
-- image_url + source_url opcionales, solo https, max 2048, NULL (nunca '').

alter table public.materials
  add column image_url text null
    check (
      image_url is null
      or (image_url ~ '^https://[^[:space:]]+$' and length(image_url) <= 2048)
    ),
  add column source_url text null
    check (
      source_url is null
      or (source_url ~ '^https://[^[:space:]]+$' and length(source_url) <= 2048)
    );
