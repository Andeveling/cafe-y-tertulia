# Manejo de formularios: React Hook Form + zod + Field

## Status: accepted

## Decision

Todos los formularios del club se construyen con **React Hook Form** (`useForm`) validado con **zod v4** a través de `zodResolver` de `@hookform/resolvers`, siguiendo la guía oficial de shadcn ([React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form)). No hay excepción: es obligatorio. Un formulario es cualquier UI que capture datos del usuario (login, reset, perfil, invitación, material, sesión, pregunta).

El patrón es siempre el mismo:

- El formulario es un **Client Component** (`"use client"`): React Hook Form maneja estado y validación en el navegador.
- El esquema se define con **zod v4** (import directo `import { z } from "zod"`), en el mismo archivo del formulario o junto a él; los mensajes de error van en español y describen la regla (ej. "El email no parece válido.").
- `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues })`, con `mode` a elección (default `onSubmit`).
- Cada campo se conecta con `Controller` y se renderiza con los primitivos de formulario del proyecto (`Field`, `FieldLabel`, `FieldError`, `FieldContent`). El estado de error se refleja con `data-invalid` en el `Field` y `aria-invalid` en el control.
- El envío valida en cliente antes de llamar a la Server Action (`createMaterial`, `signIn`, etc.). Los errores de dominio del servidor (RLS, membresía, anti-enumeración) se muestran con `toast` o un mensaje global; la validación de zod cubre la forma, no el negocio.

## Why

Los formularios previos validaban a mano (chequeos inline de `formData`, mensajes hardcodeados en cada página) o dependían solo de atributos HTML (`required`, `minLength`), lo que repartía la lógica de validación entre el cliente y el servidor con criterios inconsistentes (mismos campos validados distinto en login, reset e invite). Un solo esquema zod por formulario centraliza las reglas, da errores inmediatos y accesibles en el cliente, y tipa los datos de entrada de cada Server Action. Es además el patrón oficial que recomienda shadcn para este stack, lo que mantiene el código del formulario consistente con el resto de los componentes del proyecto (misma sintaxis `Field`/`data-invalid`/`aria-invalid` que ya usan los primitivos de UI).

## Rejected alternatives

- **Formularios de Server Component con `action={serverAction}` y validación solo en servidor**: se descarta; el feedback de error demora un round-trip y no hay errores de campo en tiempo real. Se conserva la Server Action como destino final del envío, pero la validación de forma vive en el cliente.
- **Validación solo con atributos HTML nativos (`required`, `pattern`)**: se descarta; los mensajes dependen del navegador (y su idioma), no cubren reglas de negocio, y no tipan los datos que recibe la acción.
- **Formik / otra librería de formularios**: se descarta; React Hook Form es el patrón oficial de shadcn, más liviano y con la misma integración a `Field`.
- **zod v3**: se descarta; el proyecto usa zod v4 (Standard Schema), que es lo que `zodResolver` de `@hookform/resolvers` consume por defecto.

## Consequences

- Las Server Actions no cambian su contrato: siguen recibiendo `FormData` o argumentos tipados; la diferencia es que el cliente garantiza datos ya validados antes de invocarlas. El servidor conserva sus guardas de autorización (RLS, `isActiveMember`, anti-enumeración).
- Los formularios que hoy son Server Components (login, reset, profile, invite) pasan a `"use client"` solo en la parte que es formulario; las páginas siguen siendo Server Components con su carga de datos y `redirect`s.
- Los errores de dominio del servidor no se expresan como errores de campo zod: se muestran como estado global (`toast` o mensaje), porque no son errores de forma sino de negocio.
