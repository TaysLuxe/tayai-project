# Railway frontend build

## Root Directory (required)

**In Railway Dashboard:** Service → Settings → **Root Directory** must be set to **`frontend`**.

- If Root Directory is empty or wrong, the Docker build context is the **repo root**. Then `COPY . .` in the Dockerfile copies the whole repo into `/app`, and the layout is wrong (e.g. `/app/frontend/app/` instead of `/app/app/`). You end up with only `app/page.tsx` visible and errors like “Cannot find module '../lib/translations'”.
- With **Root Directory = `frontend`**, the build context is this folder. Then `COPY . .` copies `app/`, `components/`, `lib/`, `contexts/`, etc. into `/app`, and the build succeeds.

## Verify

1. Set Root Directory to `frontend` and redeploy.
2. In the build logs you should see the Dockerfile step that lists `app/` (e.g. `ls -R app`). It must show:
   - `app/login/`, `app/register/`, `app/onboarding/`, `app/_contexts/`, `app/_lib/`, `app/layout.tsx`, `app/page.tsx`, etc.
   - Not only `app/page.tsx`.

## Git

All frontend source must be committed. From repo root:

```bash
git ls-files frontend/app
git ls-files frontend/components frontend/contexts frontend/lib
```

If anything is missing:

```bash
git add frontend/app frontend/components frontend/contexts frontend/lib
git commit -m "Add complete frontend source"
git push origin main
```
