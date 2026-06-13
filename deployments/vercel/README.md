# Vercel Deployment

Deploy the frontend from the `frontend/` directory.

Recommended settings:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Environment variables:
  - `NEXT_PUBLIC_API_BASE_URL`

For the first smoke test, point `NEXT_PUBLIC_API_BASE_URL` to the Railway backend URL and verify that the page reports backend status `ok`.
