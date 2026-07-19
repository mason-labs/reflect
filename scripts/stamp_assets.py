#!/usr/bin/env python3
"""Stamp asset references in index.html with content hashes.

Rewrites styles.css?v=... and app.js?v=... to ?v=<8-char content hash> so
every deploy busts the edge cache exactly when content changed — no manual
version bumping. Idempotent. Run before `wrangler deploy` (see AGENTS.md).
"""
import hashlib
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")


def digest(name):
    h = hashlib.sha256(open(os.path.join(PUBLIC, name), "rb").read())
    return h.hexdigest()[:8]


def main():
    index_path = os.path.join(PUBLIC, "index.html")
    html = open(index_path).read()
    changed = []
    for asset in ("styles.css", "app.js"):
        stamp = digest(asset)
        new_html = re.sub(r"%s\?v=[0-9a-z]+" % re.escape(asset),
                          "%s?v=%s" % (asset, stamp), html)
        if new_html != html:
            changed.append("%s -> ?v=%s" % (asset, stamp))
        html = new_html
    open(index_path, "w").write(html)
    print("stamped: %s" % (", ".join(changed) if changed else "no changes"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
