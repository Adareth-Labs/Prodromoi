# Database schema

The partner portal no longer has its own Prisma schema. It shares the API's:

    ../api/prisma/schema.prisma

`package.json` points Prisma at that file (`"prisma": { "schema": ... }`), so
`prisma generate` here builds the portal's client from the same models the API uses.

- Change the schema **in `../api/prisma/schema.prisma`** and run `prisma generate` in both apps.
- Migrations / `db push` are run from `../api` only.
- If this app is deployed on its own (e.g. Vercel with `partner-portal/` as the root),
  the build must also have access to `../api/prisma/schema.prisma`.
