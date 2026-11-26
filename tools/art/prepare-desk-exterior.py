"""Import 背景.png and 背景.psb offline. Requires Pillow, NumPy and psd-tools."""
import argparse
import json
import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from psd_tools import PSDImage

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('painting', type=Path)
parser.add_argument('shelf_master', type=Path, help='Original layered surround, 背景.psb (art import only).')
args = parser.parse_args()
public = Path(__file__).resolve().parents[2] / 'resources/public'
layout = json.loads((public / 'config/desk2d-layout.json').read_text())
width, height = layout['width'], layout['height']
art = Image.open(args.painting).convert('RGBA')
# The artist cropped 861 px off each side and 276 off the top; the
# existing desk stays at its original scale and the bottom stays intact.
origin_x, origin_y = 757, 1152
crop_x, crop_y = 861, 276
if art.size != (6656, 6208) or (width, height) != (5142, 3804):
    raise ValueError('Re-register the surround against the desk before packing.')
psb = PSDImage.open(args.shelf_master)
if psb.size != (8378, 6484):
    raise ValueError('Original shelf canvas must be 8378 × 6484.')
by_name = {layer.name: layer for layer in psb.descendants()}

source = public.parent / 'art/desk-exterior'
source.mkdir(parents=True, exist_ok=True)
inset_path = source / 'desk-inset.webp'
# The authored fade still belongs to the left, right and bottom of the desk.
# Sample those three edges away from the shelf to exclude its old dark overlay.
inset = art.crop((origin_x, origin_y, origin_x+width, origin_y+height))
alpha = np.asarray(inset.getchannel('A'))
sides = alpha[height//2, :]
bottom_fade = alpha[:, width//2].copy()
bottom_fade[:height//2] = 0
rim = json.loads((public/'config/desk2d-shelf.json').read_text())['rim']
def rim_height(xs):
    (x0, y0), (x1, y1) = rim[:2]
    # The curtain meets the desk along the same diagonal left of the map.
    return np.where(xs < x0, y0 + (xs-x0)*(y1-y0)/(x1-x0), np.interp(xs, *zip(*rim)))

def smooth(t):
    t = np.clip(t, 0, 1)
    return t*t*(3-2*t)

def side_shade(xs, ys):
    # Antialias the illustrated desk edge, without lighting the outer wood.
    return smooth((ys-rim_height(xs))/4)

def layer_alpha(name, bounds):
    layer = by_name[name]
    x0, y0, x1, y1 = bounds
    return np.asarray(layer.topil(apply_icc=False).getchannel('A').crop(
        (x0-layer.left, y0-layer.top, x1-layer.left, y1-layer.top)), dtype=float)/255

ys = np.arange(height)[:, None]
border_alpha = np.maximum(sides * side_shade(np.arange(width), ys), bottom_fade[:, None])
# The painted curtain and the collision rim differ by several pixels.
# Preserve the actual silhouette where it crosses the left edge of the map.
left_band = int(np.flatnonzero(sides[:width//2] > 0)[-1])+1
curtain = layer_alpha('黑窗帘', (crop_x+origin_x, crop_y+origin_y,
    crop_x+origin_x+left_band, crop_y+origin_y+height))
border_alpha[:, :left_band] = np.maximum(sides[:left_band]*(1-curtain), bottom_fade[:, None])
inset.putalpha(Image.fromarray(np.minimum(alpha, border_alpha).round().astype('uint8')))
# The frame extends twelve pixels inside the desk crop. Remove its flattened
# copy before applying its original alpha once, above the finished furniture.
frame = by_name['图层 37']
frame_x = frame.left-(crop_x+origin_x)
frame_width = width-frame_x
ground_edge = inset.crop((frame_x-1, 0, frame_x, height)).resize((frame_width, height))
inset.paste(ground_edge, (frame_x, 0))
inset.save(inset_path, 'WEBP', lossless=True, method=4)

frame_image = frame.topil(apply_icc=True)
frame_y = crop_y+origin_y-frame.top
frame_edge = frame_image.crop((0, frame_y, frame_width, frame_y+height))
# Match the approved exterior grade using an opaque column of the same frame.
frame_sample = np.asarray(frame_image.crop((30, frame_y, 31, frame_y+height)), dtype=float)
graded_sample = np.asarray(art.crop((origin_x+frame_x+30, origin_y,
                                    origin_x+frame_x+31, origin_y+height)), dtype=float)
frame_pixels = np.array(frame_edge)
frame_pixels[:, :, :3] = np.rint(np.clip(frame_pixels[:, :, :3] *
    graded_sample[:, :, :3] / np.maximum(1, frame_sample[:, :, :3]), 0, 255)).astype('uint8')
Image.fromarray(frame_pixels).save(source/'frame-edge.webp', 'WEBP', lossless=True, method=4)

# Use the registered full-colour painting for the continuation of the shelf
# and cat outside the desk. Convert the Photoshop Display P3 colours to sRGB.
full = by_name['图层 53'].topil(apply_icc=True)
# The layered master omits furniture from this plate. Only the external strips
# sample it; native desk props retain their own source colours and silhouettes.
xs = np.arange(art.width) - origin_x
upper_height = origin_y + math.ceil(rim_height(xs).max()) + 4
upper = full.crop((crop_x, crop_y, crop_x+art.width, crop_y+upper_height))
ys = np.arange(upper_height)[:, None] - origin_y
amount = smooth((ys+1050)/360) * (1-side_shade(xs, ys))
# The flattened master includes two overlapping tabletop polygons at the join.
# Read their visible edge from the flat curtain colour, preserving that outline.
curtain_pixels = np.asarray(upper.crop((0, 0, origin_x, upper_height)))[:, :, :3]
curtain_cover = np.max(np.abs(curtain_pixels.astype(int)-[47, 47, 54]), axis=2) <= 1
amount[:, :origin_x] = smooth((ys+1050)/360)*curtain_cover
upper.paste((47, 47, 54, 255), (0, 0, origin_x, upper_height))
# The vertical frame at the right is entirely outside the original scene.
# Its continuous finish should not acquire a horizontal light/dark stripe.
amount[:, xs >= width] = 0
# Alpha selects only the newly restored north. The other pixels come from
# the previously approved graded surround, including its distant vignette.
north = Image.new('RGBA', art.size)
upper.putalpha(Image.fromarray((255*amount).round().astype('uint8')))
north.paste(upper, (0, 0))

# The map crop originally extended the beige shelf surface to the very top
# of its canvas. Restore its actual back edge where it passes behind the cat.
# Sample the original wall layers before the shelf, cat and right-hand frame.
back_width, back_height = 1024, 96
bx, by = crop_x+origin_x+width-back_width, crop_y+origin_y
def back_crop(name):
    layer = by_name[name]
    x, y = bx-layer.left, by-layer.top
    return layer.topil(apply_icc=True).crop((x, y, x+back_width, y+back_height))

edge = back_crop('矩形 5 拷贝').getchannel('A')
back = Image.alpha_composite(back_crop('形状 229'), back_crop('图层 40'))
back.putalpha(edge.point(lambda a: 255-a))
back.save(source/'shelf-back.webp', 'WEBP', lossless=True, method=4)
left, top = -origin_x, -origin_y
right, bottom = left + art.width, top + art.height
bleed = 4  # Identical painted pixels over the adjoining floor tile.
gutter = 2
target = public / 'assets/env/desk2d/exterior'
target.mkdir(parents=True, exist_ok=True)
parts = []

def pack(name, bounds, divisor):
    x0, y0, x1, y1 = bounds
    w, h = round((x1-x0)/divisor), round((y1-y0)/divisor)
    filename = name+'.webp'
    parts.append(['exterior/'+filename,*bounds])
    if name == 'south':
        # Already packed from the approved dark painting; the shelf cannot reach it.
        return
    if name == 'east':
        # This strip is the dark foreground frame. Bright wall pixels must
        # not enter its gutter when the adjacent north painting is reduced.
        shutil.copyfile(source/'graded-surround'/filename, target/filename)
        return
    dx, dy = gutter*(x1-x0)/w, gutter*(y1-y0)/h
    # Include neighbouring artwork in the filtering footprint of each tile.
    sx, sy = math.floor(x0-dx)-8, math.floor(y0-dy)-8
    ex, ey = math.ceil(x1+dx)+8, math.ceil(y1+dy)+8
    l, t, r, b = max(sx,left), max(sy,top), min(ex,right), min(ey,bottom)
    raw = np.asarray(north.crop((l-left,t-top,r-left,b-top)))
    # The outside is the opaque backmost surface. Sample the RGB of the
    # original painting throughout the gutter to keep filtered edges aligned.
    pixels = np.pad(raw, ((t-sy,ey-b),(l-sx,ex-r),(0,0)), mode='edge')
    image = Image.fromarray(pixels).resize(
        (w+2*gutter,h+2*gutter), Image.Resampling.LANCZOS,
        box=(x0-dx-sx,y0-dy-sy,x1+dx-sx,y1+dy-sy))
    with Image.open(source/'graded-surround'/filename) as previous:
        base = previous.convert('RGB')
    if base.size != image.size:
        raise ValueError(f'Register the graded surround tile {filename} before packing.')
    base.paste(image.convert('RGB'), (0, 0), image.getchannel('A'))
    base.save(target/filename, 'WEBP', quality=94, method=6)

# Keep the shelf and cat crisp. The low-detail wood and walls can use fewer
# texels; every texture stays below 2048 px and the empty centre is omitted.
mid = (left+right)//2
pack('north-west',(left,top,mid,bleed),2.5)
pack('north-east',(mid,top,right,bleed),2.5)
pack('west',(left,bleed,bleed,height-bleed),3.5)
pack('east',(width-bleed,bleed,right,height-bleed),3.5)
pack('south',(left,height-bleed,right,bottom),4.2)
manifest = dict(bounds=[left,top,right,bottom],gutter=gutter,parts=parts)
(public/'config/desk-exterior.json').write_text(json.dumps(manifest,indent=2)+'\n')
