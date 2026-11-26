"""Extract the combat projectile from the supplied 25 fps gameplay recording."""
from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "resources/art/enemy-shot/子弹.gif"
OUTPUT = ROOT / "resources/public/assets/vfx/enemy-shot.png"
TILE = 112
PIVOT = (55.5, 29.5)


def linear(rgb):
    s = rgb / 255.
    return np.where(s <= .04045, s / 12.92, ((s + .055) / 1.055) ** 2.4)


def matte(frame, background, mask):
    # Invert source-over in linear light. Use the minimum in-gamut opacity
    # so the translucent red rings and small blue lights work on any surface.
    c, b = linear(frame), linear(background)
    delta = c - b
    bound = np.where(delta > 0, delta / np.maximum(1-b, .001),
                     -delta / np.maximum(b, .001)).max(axis=2)
    a = np.minimum(1., bound * 1.08) * mask
    rgb = np.clip(b + delta / np.maximum(a[:, :, None], .001), 0, 1)
    rgb = np.where(rgb <= .0031308, rgb * 12.92, 1.055 * rgb ** (1/2.4) - .055)
    return Image.fromarray(np.round(np.dstack((rgb * (a > 0)[:, :, None], a)) * 255).astype('uint8'))


def upright(image, cx, cy):
    # Rotate the measured flight vector to +Y in the game billboard.
    dx, dy = .573, .81955
    x, y = PIVOT
    affine = (-dy, -dx, cx + dy*x + dx*y, dx, -dy, cy - dx*x + dy*y)
    return image.transform((TILE, TILE), Image.Transform.AFFINE, affine, Image.Resampling.BILINEAR)


def main():
    clip = Image.open(SOURCE)
    clean = np.asarray(clip.convert("RGB"), dtype=float)
    atlas = Image.new("RGBA", (6*TILE, 5*TILE))
    cells = []
    for i in range(12, 36):
        clip.seek(i)
        assert clip.info["duration"] == 40
        # Follow the white core. Restrict the search to avoid HUD and glyphs.
        x, y = (204, 571) if i == 12 else (round(216+(i-13)*7.05), round(589+(i-13)*10.12))
        frame = np.asarray(clip.convert("RGB"), dtype=float)
        ys, xs = np.where(frame[y-13:y+14, x-13:x+14].min(axis=2) > 224)
        cx, cy = x-13+xs.mean(), y-13+ys.mean()
        left, top = int(cx)-72, int(cy)-85
        src = frame[top:top+120, left:left+110]
        bg = clean[top:top+120, left:left+110]
        cx, cy = cx-left, cy-top
        yy, xx = np.indices(src.shape[:2])
        radius = np.hypot(xx-cx, yy-cy)
        behind = -(xx-cx)*.573 - (yy-cy)*.81955
        side = abs((xx-cx)*.81955 - (yy-cy)*.573)
        changed = abs(src-bg).max(axis=2) > 4
        # The tail is a narrow line of pink and blue particles. Exclude moving
        # enemies, their shadows and ambient sparkles alongside the flight path.
        tail = (behind > 4) & (behind < min(79, (i-12)*11)) & (side < 6) & (src[:,:,2] > 162) & (src[:,:,2] > src[:,:,0]-30)
        mask = changed & ((radius < 25) | tail)
        cells.append(upright(matte(src, bg, mask), cx, cy))

    # The source and target glyphs overlap the head at either end of the
    # shot. Restore those pixels from the unobstructed front of frame 21.
    yy, xx = np.indices((TILE,TILE))
    radius = np.hypot(xx-PIVOT[0], yy-PIVOT[1])
    head = np.asarray(cells[9]).copy()
    head[30:60] = head[:30][::-1]
    head[radius > 25] = 0
    for i, cell in enumerate(cells):
        if i < 6 or i >= 18:
            pixels = np.asarray(cell).copy()
            # Keep the cool trailing beads wherever they extend over the glow.
            bead = (yy > 34) & (abs(xx-PIVOT[0]) < 6) & (pixels[:,:,2] > 200)
            if i < 2:
                pixels[:] = 0
                bead[:] = False
            replace = (radius < 26) & ~bead
            pixels[replace] = head[replace]
            pixels[(radius >= 25) & (abs(xx-PIVOT[0]) > 6)] = 0
            if i >= 21:
                # In the final three frames the blue hero obscures the beads
                # immediately behind the head. Fill from the preceding flight.
                band = (yy > 34) & (yy < 59) & (abs(xx-PIVOT[0]) < 7)
                pixels[band] = np.asarray(cells[i-6])[band]
            cell = Image.fromarray(pixels)
        atlas.paste(cell, (i%6*TILE, i//6*TILE))

    # The glint splits over the flashing hurt pose. Sample the blue pixels
    # inside its two lobes and remove that frame's local glyph background.
    lobes = [((375,816),(375,816)), ((375,813),(376,818)),
             ((377,808),(380,818)), ((377,806),(381,818)),
             ((377,804),(382,819))]
    for i, (upper, lower) in enumerate(lobes):
        clip.seek(36+i)
        frame = np.asarray(clip.convert('RGB'), dtype=float)
        hit = frame[792:832, 355:398]
        yy, xx = np.indices(hit.shape[:2])
        x, y = xx+355, yy+792
        near = np.minimum(np.hypot(x-upper[0], y-upper[1]),
                          np.hypot(x-lower[0], y-lower[1]))
        # Sample just outside either side of the blue bloom on the same row.
        bg = (hit[:,2:6].mean(axis=1) + hit[:,-6:-2].mean(axis=1))[:,None,:] / 2
        blue = hit[:,:,2]-hit[:,:,0] - (bg[:,:,2]-bg[:,:,0])
        mask = (near < 10) & (blue > 9)
        glint = matte(hit, bg, mask)
        atlas.paste(glint, (i*TILE+TILE//2-20, 4*TILE+TILE//2-24))
    atlas.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
