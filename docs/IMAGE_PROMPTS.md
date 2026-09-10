# Batch image prompts

The app ships with generated inline-SVG artwork and needs no bitmaps. These prompts are
here if you would rather replace that artwork with generated images.

Drop each block into ChatGPT (or any image model) as a single request. Both sets are
designed to match the app's design language: **flat vector, no gradients, no text, no
emoji**, on the warm paper background `#f6f1e7`.

Shared palette to paste alongside either prompt:

```
paper   #f6f1e7    ink     #1c1a17    rule    #c7bba5
teal    #14524a    ochre   #bd8324    brick   #ad3f2c
slate   #2b4a80    sage    #1d6b45    plum    #4a3b7a
```

---

## 1 · Airline logo marks (7 images)

> Produce 7 separate square logo marks for fictional airlines, as flat vector-style
> images on a plain white background. Each is a **geometric symbol only — absolutely no
> text, letters, or emoji**. Solid flat colour, no gradients, no shadows, no 3D, no
> photorealism. Each mark should read clearly at 26×26 pixels, so keep it to one bold
> idea with thick even strokes and generous negative space. Centre each mark with even
> padding. Deliver as 7 images, 512×512 each.
>
> 1. **Skyline** — an upward double chevron, like a stylised mountain or ascending flight
>    path. Colour `#14524a`.
> 2. **Nova Atlantic** — a rising semicircular arc over a solid dot, like a sunrise over a
>    horizon. Colour `#2b4a80`.
> 3. **Zephyr** — two parallel horizontal wave lines suggesting wind. Colour `#a03a63`.
> 4. **Meridian** — a sharp eight-pointed compass star, solid fill. Colour `#bd8324`.
> 5. **Aurora Jet** — a ring with eight short radiating rays, like a schematic sun.
>    Colour `#1f6f86`.
> 6. **Helios Express** — a solid upward triangle with a smaller triangle knocked out of
>    its lower half. Colour `#ad3f2c`.
> 7. **Pacific Crown** — a simple three-peaked crown sitting on a solid horizontal bar.
>    Colour `#4a3b7a`.

Save as `public/airlines/<code>.svg` (`sk`, `nv`, `zp`, `mr`, `au`, `hl`, `pc`) and swap
the `<AirlineLogo>` body for an `<img>`.

## 2 · Property listing artwork (30 images)

> Produce 30 flat vector-style illustrations of travel accommodation, 5:3 landscape,
> 1000×600 each. House style, applied identically to all 30: flat solid colour shapes with
> **no gradients, no shadows, no texture, no people, no text or signage, no emoji**.
> Simple geometric architecture with clean straight edges, a plain single-colour sky, a
> low horizon around two-thirds down, and small square windows — a few picked out in warm
> yellow `#f6d99a` as if lit. Muted, slightly desaturated palette drawn from: `#f6f1e7`,
> `#e9d5be`, `#c7bba5`, `#14524a`, `#bd8324`, `#ad3f2c`, `#2b4a80`, `#1d6b45`, `#4a3b7a`.
> Every image should look like it came from one illustrated set.
>
> Make 6 images for each of these 5 compositions, varying the palette and small details
> between them:
>
> 1. **Coastal** — a low white-walled hotel above a flat sea, one palm tree to the side,
>    a few simple horizontal lines for water.
> 2. **Townhouse** — two adjoining old-town buildings of different heights, one with a
>    pitched roof, a narrow door, and a coloured band across the façade.
> 3. **Tower** — a tall modern hotel block with a regular grid of windows and a flat roof
>    slab, low city shapes behind it.
> 4. **Courtyard** — a long low riad-style wall with a row of five repeated arched
>    openings and a flat roofline.
> 5. **Alpine** — a wide chalet with a steep triangular roof, flanked by two simple
>    conifer triangles, jagged mountains behind.

Save as `public/stays/<composition>-<n>.svg` and have `PropertyArt` pick one by
`artSeed % 30` instead of drawing inline.
