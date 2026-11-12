# Contributing to CoCart Mono

Thanks for helping. Most contributions to a font are reports: a glyph that looks off, a character you need, or a key that masking missed. Those go in [issues](https://github.com/cocart-headless/cocart-mono-font/issues/new/choose). Code contributions are welcome for the specimen site, the installer, the scripts and the docs.

## Reporting

Choose the form that fits:

| Form | Use it when |
| --- | --- |
| **Glyph or rendering bug** | A character is wrong, missing, off the grid, or renders badly in an app |
| **Key masking problem** | `ss02` or CoCart Mono Masked missed a secret, or masked normal text |
| **Glyph, script or feature request** | You need a character, a language or an OpenType feature |
| **Specimen site problem** | Something on the specimen page is broken |
| **Native review** | You read a language every day and filled in its review sheet |

The [languages page](https://cocart-headless.github.io/cocart-mono-font/languages.html) has a fillable PDF review sheet for each of the 40 languages. You can attach the filled-in PDF to the **Native review** form, or email it to hello@cocartheadless.com. Its **Something looks wrong?** and **Ask for it on GitHub** links open a pre-filled blank issue.

What helps most is a screenshot at a large size, the exact text that shows the problem, and the app, platform and font version.

> **Never paste a real key into a masking report.** Keep the prefix and the shape, and swap the rest for fake characters.

New issues are labelled `needs-triage`. If a maintainer asks for more details, the issue is labelled `needs-info`. It goes back to triage when you reply, and closes after three weeks without a reply. You can always reopen it.

## About the font files

The binaries in `fonts/` are built from sources that aren't in this repository. Pull requests that change `.otf`, `.ttf` or `.woff2` files by hand can't be merged. If a glyph, metric or feature is wrong, open an issue and it will be fixed at the source.

## Working on the site, scripts or docs

You need Python 3.10 or newer.

```sh
python -m venv .venv
. .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python scripts/check_fonts.py   # validate fonts and stylesheets
python scripts/build_site.py    # assemble _site/ and check every local link
python scripts/build_npm.py --version 0.0.0   # assemble the npm package in dist/npm/
python scripts/build_site.py --serve   # build, then preview at http://localhost:8000
```

Always preview with `--serve`. Don't open `site/index.html` directly, or point a live-preview extension at `site/`. The pages load fonts from `fonts/…`, which only exists in the build. Without it, the browser quietly falls back to a system monospace font, so nothing is in CoCart Mono and `ss02` masks nothing.

- `site/index.html` is the specimen page. It runs on `support.js` (a bundled runtime: don't edit it) and the glyph renderers `cocart-mono*.js` and `mask-cocart-mono.js`.
- `site/languages.html` is the languages page. It reads `mono-languages.json`. `site/review.html` is the review sheet for one language (`review.html?lang=fr`), built from `cocart-mono-review-data.js` and `cocart-mono-validate.js`, and printed with `doc-page.js` (bundled: don't edit it).
- `site/review-sheets/` holds the fillable PDFs. They're generated with the fonts, so don't edit them by hand. `build_site.py` fails if a language in `mono-languages.json` has no sheet.
- The pages load fonts from `fonts/…` paths. `build_site.py` copies `fonts/` into the site, so don't add copies under `site/`.
- Add a line under **Unreleased** in `CHANGELOG.md` for anything user-facing.

Every pull request runs these checks:

| Check | What it does |
| --- | --- |
| **Validate / Fonts** | Checks the font inventory, names, weight classes and italic bits, the 600-unit cell, `isFixedPitch`, versions, WOFF2/OTF coverage parity, variable axes and stylesheet links. It also does dry-run builds of the release zip and the npm package. |
| **Validate / Site** | Builds the Pages site and checks every local `href`, `src` and CSS `url()` |
| **Validate / Lint** | Runs actionlint on the workflows, and shellcheck and an LF line-ending check on `install.sh` |
| **Validate / Changelog** | Fails if `fonts/` changed and `CHANGELOG.md` didn't. A maintainer can add `skip-changelog` to skip it. |
| **Font Bakery** | An informational report on the variable fonts, attached to the run. It never blocks a merge. |

PRs are labelled by the paths they touch, and first-time contributors get a short welcome comment.

## Accepting a native review (maintainers)

When a review checks out, mark the language as reviewed in `site/mono-languages.json`: add `"<id>": true` under `"reviewed"`, for example `"reviewed": {"fr": true}`. The languages page then shows it as reviewed by a native reader. Any fixes the review asks for go into the font sources, and from there into the next release.

## Releasing (maintainers)

1. Replace the files in `fonts/` with the new build. Keep the file names: `check_fonts.py` fails on missing or unexpected files. Name ID 5 must read `Version X.YYY` and match `head.fontRevision`, name ID 0 must name the same copyright holder as `OFL.txt` (`© 2026 CoCart Headless`), name IDs 8 and 9 (manufacturer, designer) must be `CoCart Headless`, and name ID 3 (unique ID) must not repeat `CoCart:` in front of the font name.
2. Set the `?v=` cache-busting suffix to the new version (`?v=X.Y.Z`) in `fonts/css/*.css` and in the stylesheet links of `site/*.html`.
3. Update the version everywhere it's shown, always as X.Y.Z: the download link `releases/download/vX.Y.Z/CoCart-Mono-X.Y.Z.zip`, the zip size and every "CoCart Mono X.Y.Z" in `site/*.html`, `"version"` and `"history"` in `site/mono-languages.json`, and the review sheets in `site/review-sheets/`. For the first full release (1.0.0), also remove every element marked `data-beta` in `site/*.html`: the hero stamp and the Beta pills.
4. **On release day**, in `CHANGELOG.md`, rename **Unreleased** to `## [X.Y.Z] - YYYY-MM-DD` with that day's date, and add a new empty **Unreleased** section above it. Update the links at the bottom: `[X.Y.Z]` points to `releases/tag/vX.Y.Z`, and `[Unreleased]` to `compare/vX.Y.Z...HEAD`. Set the same date for X.Y.Z in `"history"` in `site/mono-languages.json`. The Release workflow fails if the heading has no date or the two dates differ.
5. Merge to `main`. The Pages workflow redeploys the site.
6. Tag and push:

   ```sh
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

   The Release workflow validates the fonts against the tag, builds `CoCart-Mono-X.Y.Z.zip` and its `.sha256`, and publishes the release with `install.sh` attached. Tags with a suffix, such as `v1.1.0-beta.1`, are published as pre-releases. The installer always uses the latest full release.

   It then publishes `@cocartheadless/mono@X.Y.Z` to npm: full releases get the `latest` tag, pre-releases get `next`. A version that's already on npm is skipped, so you can safely re-run the job. jsDelivr and unpkg serve the package from npm within minutes.
7. The install animation on the page shows the first eight characters of the zip's SHA-256. If the hash in the release summary differs, update it in `site/index.html`.

The zip is reproducible: `python scripts/build_release.py --version X.Y.Z` produces the same bytes as CI. To inspect the npm package, run `python scripts/build_npm.py --version X.Y.Z` and look in `dist/npm/`. Its templates (`package.json`, the npm README and the Next.js loader) are in `scripts/npm/`.

### npm setup (once)

CI publishes with [npm trusted publishing](https://docs.npmjs.com/trusted-publishers), so the repository holds no npm token. npm can only trust a workflow for a package that already exists, so the first version is published by hand:

1. On npmjs.com, make sure the `cocartheadless` organisation exists and you can publish to it.
2. Publish the first version from your machine, after its tag's GitHub release exists. For the first beta:

   ```sh
   python scripts/build_npm.py --version 1.0.0-beta.1
   npm login
   npm publish ./dist/npm --tag next
   ```

   Keep the `./`: without it, npm reads `dist/npm` as a GitHub repository. npm refuses to publish a pre-release without `--tag`. Use `--tag next` for a pre-release and leave it off for a full release, the same as CI.

3. On npmjs.com, open **@cocartheadless/mono › Settings › Trusted publishing** and add GitHub Actions with organisation `cocart-headless`, repository `cocart-mono-font` and workflow `release.yml`. Leave the environment blank.
4. In the same settings, set **Publishing access** to require two-factor authentication and disallow tokens. From then on, only the Release workflow can publish.

If the first tag is pushed before step 2, the **Publish to npm** job fails and the GitHub release is unaffected. Do steps 1–3, then re-run the failed job.
