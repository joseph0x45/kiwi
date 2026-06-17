# Someday — a local-first "want to do" tracker (PWA)

## What this is

A personal PWA for tracking things I want to do, taste, see, or experience — like a bucket list, but organized into custom sections and with more detail per item than a flat checklist. Example: a "Champagnes" section and a "Steaks" section, each holding a list of things to try, with notes/date/rating once crossed off.

No backend, no accounts. Everything lives on the device. It should install like a real app (Add to Home Screen) and keep working with no network connection.

## Tech constraints

- Plain HTML/CSS/JS. No build step, no framework, no bundler — should run by just opening `index.html` or serving the folder statically.
- Local-first persistence: store the whole app state as one JSON blob in `localStorage`. Since there's no backend and no sync, this is the only copy of the data, so include an explicit **export** (download a `.json` backup) and **import** (load a `.json` backup) so data isn't trapped on one device/browser.
- Must be installable: valid `manifest.json`, icons (192px + 512px, plus a maskable variant), `apple-touch-icon`, `theme-color` meta tag.
- Must work offline after first load: a service worker that caches the app shell (HTML/CSS/JS/icons) and serves from cache first, falling back to network for anything not cached. Bump the cache name/version on every deploy so updates actually take effect.

## Data model

```
state = {
  sections: [
    {
      id: string,
      name: string,           // e.g. "Champagnes"
      createdAt: ISO string,
      items: [
        {
          id: string,
          text: string,          // e.g. "Try a Dom Pérignon"
          done: boolean,
          notes: string,         // optional, free text
          dateCompleted: string | null,  // ISO date, auto-filled to today when checked off, editable, never auto-cleared
          rating: number,        // 0–5, optional, only meaningful once done
          createdAt: ISO string
        }
      ]
    }
  ]
}
```

## Features

**Sections**
- Add a new section (just a name).
- Rename a section.
- Delete a section — confirm first, since it deletes all items inside it.
- Each section gets a cycling accent color from the palette below (purely decorative, assigned by index, not user-configurable in v1).

**Items**
- Add an item to a section via a plain text input (press Enter or tap add).
- Checkbox to mark done. Checking it auto-fills `dateCompleted` to today if empty; unchecking does *not* clear the date (the date is just a fact about when it happened, in case they re-check it later).
- Inline edit of the item text.
- Delete an item.
- Expand/collapse an item to reveal: notes (textarea), date completed (date input), star rating (1–5, only worth showing once relevant).
- A "hide completed" toggle per section. When showing completed items, they're visually distinct (struck-through, slightly faded) and sink to the bottom of the list.

**Overview**
- A small running tally somewhere visible, e.g. "14 of 32 crossed off" across all sections.
- Friendly empty states: no sections yet → invite to create the first one; a section with no items yet → invite to add the first thing.

## Design direction

This should feel like a handwritten paper journal, not a generic productivity app. Treat this as the one place to take a real aesthetic swing — everything else should be quiet and disciplined around it.

**Palette** (named, so it's reused consistently rather than re-derived per component):
- `--paper: #F4EEDE` — warm cream paper background
- `--paper-edge: #E7DEC4` — for the torn/aged edge of cards, subtle shadows
- `--line: #D9CDAB` — faint ruled-notebook-line color
- `--ink: #2B2924` — primary text, near-black warm ink
- `--ink-soft: #756F5C` — secondary/meta text, faded ink
- `--blue: #2F4D7A` — ballpoint-pen accent: links, checked state, primary actions
- `--gold: #C08A32` — washi-tape / star-rating accent

**Type**
- A cursive handwriting display face (e.g. "Caveat") for the app title only — this is the one big flourish.
- A neater, more legible handwriting face (e.g. "Kalam") for actual content: section names, item text, notes. This is "the user's handwriting."
- A plain system sans stack (`-apple-system, "Segoe UI", sans-serif`) for UI chrome: buttons, toggles, dates, labels, the stats line. This is "the system talking," and it's what keeps the app usable instead of twee. Don't use the handwriting fonts for anything interactive that needs to be quickly scannable (dates, counts, buttons).
- Self-host or runtime-cache whatever web font is used — it has to survive being offline.

**Layout / signature element**
- Sections render as slightly tilted index cards on the paper background (small alternating rotation, a couple of degrees at most — not cartoonish), each "pinned" with a washi-tape strip in its accent color.
- Items inside a section sit on faint ruled lines (like a notebook page), not in boxed rows.
- The checkbox itself is the signature touch: a hand-drawn-looking square (slightly irregular border-radius) that gets an ink scribble checkmark animation when ticked. This is the single most memorable detail in the app — spend the polish budget here, not on extra chrome elsewhere.
- Star ratings drawn as simple ink stars (outline → filled), not generic icon-font stars.
- Keep everything else — buttons, inputs, layout grid — calm, minimal, generously spaced. The paper-and-ink idea only works if it isn't fighting other decoration for attention.

**What to avoid:** this should not read as a generic "AI-made" page. Specifically avoid: a serif display + terracotta accent on cream (close to this palette's cousin, easy to drift into — the cream here is justified because the *subject is literally paper*, not because it's a safe default, so lean into the paper/ink/handwriting logic specifically rather than generic warm-minimal styling); numbered step markers where there's no real sequence; decorative gradients or glow effects that don't belong on paper.

## Suggested file structure

```
index.html
style.css
app.js
manifest.json
service-worker.js
icons/
  icon.svg
  icon-192.png
  icon-512.png
  icon-maskable-512.png
```

## Acceptance checklist

- [ ] Reload the page (or fully close and reopen the installed app) and all data is still there.
- [ ] Works with the network disabled after the first successful load.
- [ ] Lighthouse (or equivalent) recognizes it as installable.
- [ ] Usable at phone width (~360px) and desktop width.
- [ ] Every interactive element is reachable by keyboard with a visible focus state.
- [ ] Checking an item off auto-stamps today's date; unchecking never silently deletes that date.
- [ ] Deleting a section asks for confirmation first.
- [ ] Export produces a JSON file; importing that same file restores the exact state.
- [ ] Animations respect `prefers-reduced-motion`.

## Open / nice-to-have (not required for v1)

- Drag-to-reorder sections or items.
- Per-section custom accent color instead of auto-cycled.
- Search/filter across all sections at once.
