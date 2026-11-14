# 📸 Memory photos — drop your pictures here

This is the folder the game reads from. Put your six anniversary photos in
**this directory** (`public/photos/`), using exactly these file names:

| File name            | House                    | Where it appears in game |
| -------------------- | ------------------------ | ------------------------ |
| `memory-1.jpg`       | Memory I  · The Day We Met        | northwest house |
| `memory-2.jpg`       | Memory II · Sweet Little Moments  | west house      |
| `memory-3.jpg`       | Memory III · Our Adventures       | southwest house |
| `memory-4.jpg`       | Memory IV · Under The Stars       | northeast house |
| `memory-5.jpg`       | Memory V  · Picnic Days           | east house      |
| `memory-6.jpg`       | Memory VI · Forever Starts Here   | north house     |

If a file is missing the frame shows a 💞 placeholder instead of breaking, so
you can add them one at a time and refresh the page.

## Format tips

- **Aspect ratio: 4:5 (portrait).** The frame is `aspect-ratio: 4 / 5` with
  `object-fit: cover`, so anything else gets cropped — portrait shots look best,
  and keep faces away from the very edges.
- **Size:** ~`1000 × 1250 px` is plenty (it renders at most `50dvh` tall).
  Under ~400 KB each keeps the page snappy.
- **Type:** `.jpg` is what the config expects. Using `.png` / `.webp`? Either
  rename to `.jpg` or edit the `photo:` lines in `src/game/config.ts`.

## Where this maps in code

`public/` is Next.js's static-asset root, so a file at
`public/photos/memory-1.jpg` is served at the URL `/photos/memory-1.jpg`.
Those URLs live in `MEMORIES` in [`src/game/config.ts`](../../src/game/config.ts):

```ts
{ id: "nw", title: "The Day We Met", photo: "/photos/memory-1.jpg", ... }
```

Change the captions, titles and love-notes for each memory in that same file —
everything personal is in `config.ts`, nothing else needs touching.

> Note: `public/photos/.gitkeep` exists only so Git keeps this empty folder
> around. You can leave it or delete it once your photos are committed.
