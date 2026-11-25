"""Extract the clockwise cast's solid ink contours and soft light separately."""
import json
import struct
import sys
import zlib
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


def write_contours(buffer, mask):
    # OpenCV returns opposite windings for holes and their enclosing paths.
    contours, _ = cv2.findContours(mask.astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        points = cv2.approxPolyDP(contour, 1.0, True)[:, 0]
        if len(points) < 3:
            continue
        buffer.extend(struct.pack("<hhh", len(points), *points[0]))
        buffer.extend(np.diff(points, axis=0).astype("<i2").tobytes())
    buffer.extend(struct.pack("<h", 0))


def build(source):
    target = Path(__file__).resolve().parents[2] / "platform"
    # Source frame numbers are one-based. The lower wisp is gone in frame 19.
    first_frame, sweep_frame = 19, 24
    tile_width, columns, pad = 96, 5, 2
    ends, frames, offsets, lights, guides = [], [], [], [], []
    paths = bytearray()
    with Image.open(source) as gif:
        width, height = gif.height, gif.width
        tile_height = round(tile_width * height / width)
        background = np.asarray(gif.convert("RGB").transpose(Image.Transpose.ROTATE_270), dtype=np.float32)
        previous = None
        skipped_ms = 0
        for index in range(gif.n_frames):
            gif.seek(index)
            duration = gif.info["duration"]
            if index < first_frame - 1:
                skipped_ms += duration
                continue
            ends.append((ends[-1] if ends else 0) + duration)
            rgb = np.asarray(gif.convert("RGB").transpose(Image.Transpose.ROTATE_270))
            if previous is None or not np.array_equal(rgb, previous):
                offsets.append(len(paths) // 2)
                # This GIF's cel colors have a dark red rim (green 85), an
                # orange fill (green 106+), and yellow highlights. Keep the
                # rim solid, even though it is darker than the flame's center.
                write_contours(paths, rgb[:, :, 1] >= 77)
                write_contours(paths, rgb[:, :, 1] >= 100)
                delta = np.maximum(0, (rgb - background) / np.maximum(1, 255 - background))
                energy = np.clip(.5 * delta[:, :, 0] + .5 * delta[:, :, 1], 0, 1)
                light = Image.fromarray(np.uint8(energy * 255 + .5))
                guides.append(np.asarray(light.resize((width // 2, height // 2), Image.Resampling.BOX)))
                lights.append(light.resize((tile_width, tile_height), Image.Resampling.LANCZOS))
                previous = rgb
            frames.append(len(lights) - 1)

    # Spread the retained motion over the full GIF duration, including its UI cue.
    retained_ms = ends[-1]
    full_ms = skipped_ms + retained_ms
    ends = [end * full_ms / retained_ms for end in ends]
    stride_x, stride_y = tile_width + 2 * pad, tile_height + 2 * pad
    light_height = ((len(lights) + columns - 1) // columns) * stride_y
    flow_w, flow_h = 24, 43
    pair_w, pair_h = 4 * (flow_w + 2 * pad), flow_h + 2 * pad
    pair_cols = columns * stride_x // pair_w
    atlas = Image.new("L", (columns * stride_x, light_height + ((len(guides)-1+pair_cols-1)//pair_cols)*pair_h))
    for i, light in enumerate(lights):
        # Extend edge texels so filtering at a screen edge stays within its own frame.
        tile = Image.fromarray(np.pad(np.asarray(light), pad, mode="edge"))
        atlas.paste(tile, (i % columns * stride_x, i // columns * stride_y))
    # Bidirectional displacement in original GIF pixels. Each pair has four
    # scalar maps: outgoing x/y then incoming x/y. The GPU warps solid ink.
    solver = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    ranges = []
    for i, (a, b) in enumerate(zip(guides, guides[1:])):
        fields = [cv2.resize(solver.calc(src, dst, None), (flow_w, flow_h),
                             interpolation=cv2.INTER_AREA) * 2 for src, dst in [(a, b), (b, a)]]
        reach = max(1, int(np.ceil(np.max(np.abs(fields)))))
        ranges.append(reach)
        for plane, channel in enumerate([fields[0][:,:,0], fields[0][:,:,1], fields[1][:,:,0], fields[1][:,:,1]]):
            values = np.uint8(np.clip(np.round(channel * 127 / reach) + 128, 0, 255))
            tile = Image.fromarray(np.pad(values, pad, mode="edge"))
            atlas.paste(tile, (i % pair_cols * pair_w + plane * (flow_w + 2*pad), light_height + i // pair_cols * pair_h))
    atlas.save(target / "ultimate-cast.webp", quality=42, method=6)
    # Most contour steps are a few pixels. Store signed words as variable-length
    # integers to leave room for the motion fields without simplifying the ink.
    packed = bytearray()
    for (word,) in struct.iter_unpack("<h", paths):
        value = (word << 1) ^ (word >> 15)
        while value >= 128:
            packed.append(128 | (value & 127))
            value >>= 7
        packed.append(value)
    (target / "ultimate-cast-ink.bin").write_bytes(zlib.compress(packed, 9))
    data = dict(width=width, height=height, tileWidth=tile_width, tileHeight=tile_height,
                columns=columns, pad=pad, offsets=offsets, duration=ends[-1],
                keyTimes=[0]+[ends[i-1] for i in range(1,len(frames)) if frames[i]!=frames[i-1]],
                flowWidth=flow_w, flowHeight=flow_h, flowTop=light_height, flowColumns=pair_cols, ranges=ranges,
                hideAt=ends[sweep_frame - first_frame - 1])
    (target / "ultimate-cast-frames.json").write_text(json.dumps(data, separators=(",", ":"))+"\n", encoding="utf-8")


def build_blade(source):
    """Retain the initial blade's luminance, timing and full-GIF registration."""
    target = Path(__file__).resolve().parents[2] / "platform"
    width, columns, pad = 480, 4, 2
    frames, ends, tiles, seen = [], [], [], {}
    with Image.open(source) as gif:
        height = round(width * gif.height / gif.width)
        base = np.asarray(gif.convert("RGB"), dtype=np.float32)
        for i in range(gif.n_frames):
            gif.seek(i)
            rgb = np.asarray(gif.convert("RGB"), dtype=np.float32)
            light = np.maximum(0, (rgb-base)/np.maximum(1,255-base))
            energy = .68*light.max(axis=2) + .32*(light @ np.array([.299,.587,.114], np.float32))
            mono = Image.fromarray(energy).resize((width,height),Image.Resampling.BOX)
            values = np.uint8(np.clip((np.asarray(mono)-.006)/.994,0,1)*255+.5)
            key = values.tobytes()
            if key not in seen:
                seen[key] = len(tiles) if values.max()>2 else -1
                if seen[key]>=0:
                    tiles.append(Image.fromarray(values))
            frames.append(seen[key])
            ends.append((ends[-1] if ends else 0)+gif.info["duration"])
    dx, dy = width+2*pad,height+2*pad
    # Reserve one black tile for interpolating the first/last transparent frames.
    atlas = Image.new("L",(columns*dx,((len(tiles)+columns)//columns)*dy))
    for i,tile in enumerate(tiles):
        atlas.paste(tile,(i%columns*dx+pad,i//columns*dy+pad))
    atlas.save(target/"nameplate-blade.webp",quality=32,method=6)
    data = dict(width=width,height=height,columns=columns,pad=pad,frames=frames,ends=ends)
    (target/"nameplate-blade.json").write_text(json.dumps(data,separators=(",",":"))+"\n",encoding="utf-8")


if __name__ == "__main__":
    build(sys.argv[1])
    if len(sys.argv)>2:
        build_blade(sys.argv[2])
