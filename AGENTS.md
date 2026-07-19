# reflect-site — repo conventions

Marketing site for the reflect skills package. Cloudflare Worker + static
assets, no build step, no dependencies.

## Deploy protocol

```bash
python3 scripts/stamp_assets.py     # content-hash the css/js references
npx wrangler@latest deploy          # NOT the global wrangler (4.19 is stale
                                    # and mishandles modern assets config)
curl -s https://cdd.dev/reflect/ | grep -o 'app.js?v=[0-9a-z]*'   # confirm
```

Always confirm the served HTML references the new asset hashes via curl
BEFORE debugging anything in a browser — the cdd.dev and madewithmason.com
zones edge-cache aggressively, and chasing a stale page wastes whole
debugging loops. The worker already sends `CDN-Cache-Control: no-store` for
HTML/CSS/JS and week-long immutable caching for `/img/*`.

## Architecture facts (rediscovering these costs an afternoon)

- Served at `cdd.dev/reflect*` and `madewithmason.com/mason-os/reflect*`
  via zone routes; the worker strips those mount prefixes itself
  (`MOUNTS` in `worker/index.ts`). No service bindings involved.
- `workers_dev: true` is deliberate: wrangler silently disables the
  workers.dev subdomain when routes exist, and we keep it as the
  cache-free origin-debugging surface. A 404 on workers.dev right after
  deploy can be subdomain propagation, not missing assets — wait, retry.
- `git push` fails on this machine (github.com transport blocked); push
  with `python3 ~/.reflect/scripts/gh_api_push.py mason-labs/reflect main`.

## Verification bar

- Layout claims need numbers: measure with agent-browser `eval`
  (getBoundingClientRect, scrollWidth) rather than eyeballing screenshots
  when alignment or overflow is in question.
- Audio claims need signal: attach an AnalyserNode and check RMS — state
  flags and node graphs prove wiring, not audible output. This site's
  audio shipped inaudible once because levels were tuned by arithmetic.
- Mobile: the masthead and any nowrap `<code>` are the historical grid
  blow-out culprits; re-measure `document.body.scrollWidth` at 390px after
  touching either.

## Content

- All copy lives in `public/index.html`; art prompts are in git history.
- OG/share image is `public/img/og-card.png` (1200×630, composited with
  real fonts via PIL — never let the image model render the type).
- JSON-LD carries SoftwareApplication + FAQPage; keep the visible "Letters
  to the Editor" section in sync with the FAQPage answers.
