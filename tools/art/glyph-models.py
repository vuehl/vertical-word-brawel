"""Trace the original stroke layers and retarget the registered hero cels to bones."""
import json
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.measure import approximate_polygon, find_contours, points_in_poly
from skimage.registration import optical_flow_tvl1
from scipy.ndimage import map_coordinates


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "resources/art"
PUBLIC = ROOT / "resources/public"
CONFIG = PUBLIC / "config"
GLYPHS = PUBLIC / "assets/glyphs"
RIGS = json.loads((CONFIG / "hero-rigs.json").read_text(encoding="utf-8"))
CATALOG = json.loads((ROOT / "source/src/actors/hero-action-catalog.js").read_text(
    encoding="utf-8").split("export const heroActionCatalog=")[1].strip().rstrip(";"))


def read_art(stem):
    path = next(stem.with_suffix(ext) for ext in (".webp", ".png") if stem.with_suffix(ext).exists())
    return np.asarray(Image.open(path).convert("RGBA"))


def bounds(mask):
    ys, xs = np.nonzero(mask)
    return [int(xs.min()), int(ys.min()), int(np.ptp(xs)) + 1, int(np.ptp(ys)) + 1]


def polygons(mask, x, y):
    # March at half alpha, including transparent padding around tightly packed strokes.
    rings = []
    for contour in find_contours(np.pad(mask, 1), 127.5, fully_connected="high"):
        points = np.rint(approximate_polygon(contour, 1.45)[:-1, ::-1]).astype(int) - 1 + [x, y]
        if len(points) < 3:
            continue
        area = abs(np.dot(points[:, 0], np.roll(points[:, 1], 1)) -
                   np.dot(points[:, 1], np.roll(points[:, 0], 1))) / 2
        if area >= 4:
            rings.append((area, points))
    # Store exterior rings with their immediate holes. Islands inside holes are solids.
    result, parents = [], []
    for _, ring in sorted(rings, key=lambda item: -item[0]):
        parent = next(((depth, polygon) for outer, depth, polygon in reversed(parents)
                       if points_in_poly(ring[:1], outer)[0]), (-1, None))
        depth, polygon = parent[0] + 1, parent[1]
        if depth % 2 == 0:
            polygon = []
            result.append(polygon)
        polygon.append(ring.ravel().tolist())
        parents.append((ring, depth, polygon))
    return result


def fit_clips(species, rig, layers):
    """Fit each rigid stroke to the source pose using its silhouette and local optical flow."""
    catalog = CATALOG[species]
    atlas = read_art(GLYPHS / "hero-actions" / species)
    cell = atlas.shape[1] // catalog["columns"]
    ref = np.zeros((640, 640), np.uint8)
    samples = []
    for alpha, x, y in layers:
        h, w = alpha.shape
        crop = ref[y+64:y+64+h, x+64:x+64+w]
        np.maximum(crop, alpha, out=crop)
        yy, xx = np.nonzero(alpha >= 128)
        take = np.linspace(0, len(xx)-1, min(240, len(xx)), dtype=int)
        samples.append(np.column_stack([xx[take]+x+64, yy[take]+y+64]))
    left, top, width, height = bounds(ref >= 128)
    side, margin = 64, 4

    def normalized(image):
        resized = Image.fromarray(image).resize((side, side), Image.Resampling.BILINEAR)
        return np.pad(np.asarray(resized, dtype=np.float32)/255, margin)

    template = normalized(ref[top:top+height, left:left+width])
    box = rig["frame"]
    unit = (80/96) / max(box["width"], box["height"])
    center = np.array([box["left"]+box["width"]/2+64, box["top"]+box["height"]/2+64])
    source = [(s-center)*[unit, -unit]+[0, .5] for s in samples]
    uv = [(s-[left, top]+.5)/[width, height] for s in samples]
    frames = []
    for tile in range(sum(clip["count"] for clip in catalog["clips"].values())):
        cy, cx = divmod(tile, catalog["columns"])
        rgba = atlas[cy*cell:(cy+1)*cell, cx*cell:(cx+1)*cell]
        # Cel outlines were baked for billboards. Register only the original coloured face.
        alpha = np.where(np.max(rgba[:, :, :3], axis=2)>85, rgba[:, :, 3], 0)
        x, y, w, h = bounds(alpha >= 128)
        flow = optical_flow_tvl1(template, normalized(alpha[y:y+h, x:x+w]), num_warp=4)
        frame = []
        for rest, coords in zip(source, uv):
            at = (coords*side+margin-.5)[:, ::-1].T
            delta = np.column_stack([map_coordinates(axis, at, order=1) for axis in flow[::-1]])
            pixels = [x, y] + (coords+delta/side)*[w, h]
            target = (pixels/cell-[.5, 1])*[catalog["scale"], -catalog["scale"]]
            design = np.column_stack([rest, np.ones(len(rest))])
            matrix = np.linalg.lstsq(design, target, rcond=None)[0].T
            # Occluded or edge-on strokes can produce a reflected 2D fit.
            # Preserve the tracked centre and a positive, invertible 3D basis.
            u, singular, vt = np.linalg.svd(matrix[:, :2])
            if np.linalg.det(u @ vt) < 0:
                u[:, -1] *= -1
                singular[-1] = 0
            matrix[:, :2] = (u * np.clip(singular, .075, 3.5)) @ vt
            matrix[:, 2] = target.mean(axis=0) - matrix[:, :2] @ rest.mean(axis=0)
            frame.extend(np.rint(matrix.ravel()*4096).astype(int).tolist())
        frames.append(frame)
    return frames


def generate():
    models, motion = {}, {}
    for tier in ("一阶", "二阶", "三阶"):
        for folder in sorted((ART / "monsters" / tier).iterdir()):
            if not folder.is_dir():
                continue
            word = folder.name
            whole = read_art(folder.parent / word)
            frame = bounds(whole[:, :, 3] > 0)
            color = np.median(whole[whole[:, :, 3] == 255, :3], axis=0).astype(int).tolist()
            if word == "龘":
                color = [255, 70, 70]
            count = len({p.stem for p in folder.iterdir() if p.suffix in (".png", ".webp")})
            # HP frame zero is the last numbered original layer.
            strokes = [polygons(read_art(folder / f"{word}-{i}")[:, :, 3], 0, 0)
                       for i in range(count, 0, -1)]
            models[word] = dict(frame=frame, color=color, strokes=strokes)
    for species, rig in RIGS.items():
        sheet = read_art(GLYPHS / (rig["sheet"]+"-strokes"))
        layers = []
        for group in rig["groups"]:
            for s in group["strokes"]:
                alpha = sheet[s["sy"]:s["sy"]+s["h"], s["sx"]:s["sx"]+s["w"], 3]
                layers.append((alpha, s["x"], s["y"]))
        box = rig["frame"]
        color = np.median(sheet[sheet[:, :, 3] == 255, :3], axis=0).astype(int).tolist()
        models[rig["word"]] = dict(frame=[box[k] for k in ("left", "top", "width", "height")],
                                   color=color, strokes=[polygons(*layer) for layer in layers])
        if species in CATALOG:
            motion[rig["word"]] = fit_clips(species, rig, layers)
    for name, value in (("glyph-solids", models), ("glyph-motion", motion)):
        (CONFIG / (name+".json")).write_text(json.dumps(value, separators=(",", ":"),
                                                        ensure_ascii=False)+"\n", encoding="utf-8")
    print(f"{len(models)} glyphs, {sum(len(m['strokes']) for m in models.values())} stroke meshes, "
          f"{sum(map(len, motion.values()))} skeletal poses")


if __name__ == "__main__":
    generate()
