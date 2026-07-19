# Applied Improvements

| Date | Lane | Change | Target | Status | Evidence |
| --- | --- | --- | --- | --- | --- |
| 2026-07-19 | script | Content-hash asset stamping replaces manual ?v=N bumping | scripts/stamp_assets.py | applied | version bumped by hand 8 times in the build session; 3 debugging loops chased edge-cached stale pages |
| 2026-07-19 | rule | Deploy protocol + architecture facts + verification bar (curl-before-browser, AnalyserNode RMS for audio, wrangler@latest, workers.dev propagation) | AGENTS.md | applied | stale-cache confusion x3, inaudible-audio ship, wrangler 4.19 config rejection, workers.dev 404 false alarm — all in one session |
