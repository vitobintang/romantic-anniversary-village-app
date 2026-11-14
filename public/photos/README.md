# 📸 Cardigan photos — drop your pictures here

This month's theme is her **KUKAI cardigan collection**, so each memory house
holds one cardigan. Put the photos in **this directory** (`public/photos/`),
using exactly these file names:

| File name        | Cardigan              | House / doorway      |
| ---------------- | --------------------- | -------------------- |
| `memory-1.jpg`   | Grey Roselle          | northwest cottage    |
| `memory-2.jpg`   | Pink Estelle          | west cottage         |
| `memory-3.jpg`   | White Eloise          | southwest cottage    |
| `memory-4.jpg`   | Emerald Estelle       | northeast cottage    |
| `memory-5.jpg`   | Black Camellia        | east cottage         |
| `memory-6.jpg`   | Butter Yellow Valerie | the big north house  |

## The sixth one — still on its way

The butter yellow Valerie cardigan hasn't arrived, and that's built into the
game: `src/game/config.ts` marks it `status: "on-the-way"`, so its polaroid
shows a **"✈️ Still on its way"** ribbon and a 📦 parcel placeholder instead of
a photo.

`memory-6.jpg` is meant to be your **order screenshot** (the KUKAI checkout /
order page) so the empty frame has something real in it. Until you upload it,
the 📦 placeholder shows — nothing looks broken. When the cardigan actually
lands, just replace `memory-6.jpg` with a real photo and delete the
`status: "on-the-way"` line.

## Format tips

- **Aspect ratio: 4:5 (portrait).** The frame is `aspect-ratio: 4 / 5` with
  `object-fit: cover`, so anything else gets cropped — portrait shots look best.
- **Size:** ~`1000 × 1250 px` is plenty (it renders at most `50dvh` tall).
  Under ~400 KB each keeps the page snappy.
- **Type:** `.jpg` is what the config expects. Using `.png` / `.webp` or
  `.HEIC`? Rename to `.jpg` or edit the `photo:` lines in
  [`src/game/config.ts`](../../src/game/config.ts). Note: iPhones save HEIC by
  default — export/convert to JPG first, browsers won't display HEIC.

## How the URLs work

`public/` is Next.js's static-asset root, so a file at
`public/photos/memory-1.jpg` is served at `/photos/memory-1.jpg` — which is
exactly what `MEMORIES` in `src/game/config.ts` already points to. No code
edits needed to add photos; titles, captions and tags for each cardigan are
all in that same file.

> `public/photos/.gitkeep` exists only so Git keeps this folder around while
> it's empty. You can leave it or delete it once photos are committed.
