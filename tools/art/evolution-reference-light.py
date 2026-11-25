"""Paint the recorded light as a distance field; coordinates are master GIF pixels."""
from pathlib import Path
import json
import sys

import cv2
import numpy as np
from PIL import Image
from scipy.interpolate import PchipInterpolator
from evolution_brush_paint import BrushFrame


ART = Path(__file__).resolve().parents[2] / "resources/art/upgrade"
EFFECT = Image.open(ART / "进化光效.gif")
ACTOR = Image.open(ART / "jinhua.gif")
GUIDES = json.loads((ART / "orbit-guides.json").read_text(encoding="utf-8"))
W, H = EFFECT.size
Y, X = np.indices((H, W), dtype=np.float32)
PLATE = np.asarray(EFFECT.convert("RGB"), np.float32)
COLORS, LABELS = np.unique(PLATE.reshape(-1, 3), axis=0, return_inverse=True)
LABELS = LABELS.reshape(H, W)


def ease(t):
    t = np.clip(t, 0., 1.)
    return t*t*(3.-2.*t)


def blur(a, radius):
    return cv2.GaussianBlur(a, (0, 0), radius)


def exposure(image, frame):
    # Same full-field exposure curve and dark hold as the source performance.
    if frame < 124 or frame >= 142:
        gain = min(1., float(np.percentile((image[:70,:,1]+1)/(PLATE[:70,:,1]+1), 15)))
        return [gain, 0., 0., 0.]
    flash = [.29,.52,.68,.66,.55,.46,.34,.26,.18,.13,.10,.07,.05,.038,.023,.012,.006,0][frame-124]
    return [1-flash, flash, flash*234/255, flash*193/255]


def paper_samples():
    neutral = np.hypot((X-184)*1.1, Y-141) > 80
    result = []
    for i, color in enumerate(COLORS):
        delta = np.max(np.abs(COLORS-color), axis=1)[LABELS]
        ids = np.flatnonzero(neutral & (delta < 6))
        if len(ids) < 40:
            ids = np.flatnonzero(neutral & (delta < 15))
        if len(ids) < 20:
            ids = np.flatnonzero(LABELS == i)
        result.append(ids[::max(1, len(ids)//700)])
    return result


SAMPLES = paper_samples()
SUBJECT = (abs(X-184)<58) & (Y>20) & (Y<177)


def ink(image):
    r, g, _ = image.transpose(2, 0, 1)
    return SUBJECT & ((r-g>55) | (g<98))


EDGES = cv2.Canny(blur(PLATE.astype('uint8'), .95), 24, 42) > 0
FOOT = abs(np.hypot((X-184)/43, (Y-177)/35)-1) < .13
STATIONARY = EDGES | ink(PLATE) | FOOT


def sample(image, x, y):
    return cv2.remap(image, x.astype('float32')[None,:], y.astype('float32')[None,:],
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[0]


def orbit_paint(canvas, frame, plain, valid):
    # Restore the fine arc where the desk/actor masks intersect its path. Each
    # guide was fitted on this source frame. Measure its pressure along the
    # actual light, so the open ends, crossings and strong side keep moving.
    claimed = np.zeros_like(plain)
    t = np.linspace(0, 2*np.pi, 300, endpoint=False)
    for j, (cx, cy, a, b, angle) in enumerate(GUIDES[frame]):
        phi = np.deg2rad(angle)
        co, si = np.cos(phi), np.sin(phi)
        u = (X-cx)*co+(Y-cy)*si
        v = (Y-cy)*co-(X-cx)*si
        xp = cx+a*np.cos(t)*co-b*np.sin(t)*si
        yp = cy+a*np.cos(t)*si+b*np.sin(t)*co
        nx = np.cos(t)*co/a-np.sin(t)*si/b
        ny = np.cos(t)*si/a+np.sin(t)*co/b
        length = np.hypot(nx, ny)
        nx, ny = nx/length, ny/length
        # A normal scan accommodates subpixel hand-tracing error. The paired
        # recording contains the two revolving rings without the outer stars.
        ridge = np.maximum.reduce([sample(plain, xp+nx*k, yp+ny*k) for k in (-4,-2,0,2,4)])
        trusted = sample(valid, xp, yp) > .72
        if trusted.sum() < 10:
            # During the final contraction the real ring fits inside the ink.
            # Its photographed pressure is still visible in the paired plate.
            trusted = np.ones_like(trusted)
        pressure = np.interp(t, t[trusted], ridge[trusted], period=2*np.pi)
        pressure = np.convolve(np.pad(pressure, 9, mode='wrap'), np.hanning(19)/9., mode='valid')
        pressure = ease((pressure-.008)/.235)
        phase = np.arctan2(v/b, u/a)
        distance = (u*u/(a*a)+v*v/(b*b)-1.) / np.maximum(.002, 2*np.hypot(u/(a*a),v/(b*b)))
        p = np.interp(phase, t, pressure, period=2*np.pi)
        claimed = np.maximum(claimed, (1-ease((abs(distance)-4)/5))*ease((p-.015)/.23))
        swell = .82+.28*np.cos(t*2.0-.65)
        width = (5.0 if j==0 else 3.35)*pressure*swell
        # Begin in the thinnest sector so pen-up/pen-down meet at the tip.
        tip = -int(np.argmin(width))
        xy = np.roll(np.column_stack((xp,yp)),tip,axis=0)
        width = np.roll(width,tip)
        canvas.stroke(np.vstack((xy,xy[0])),np.r_[width,width[0]],split=j==0,closed=True)
    return claimed


def rise_paint(canvas, frame):
    # Rejoin the two rising sweeps visible in the reference. Skeletonising
    # their intersections with the glyph made each gap a separate fat seed.
    # These centre lines follow the same enclosing silhouette, with thin,
    # continuous pressure and long pointed ends instead of individual heads.
    keys = [130, 134, 138, 142]
    guides = [
        [
            [[145,157],[129,127],[231,89],[225,29]],
            [[143,144],[137,104],[229,83],[223,16]],
            [[147,107],[147,77],[226,65],[225,-3]],
            [[151,69],[156,39],[218,37],[220,-27]],
        ],
        [
            [[225,151],[232,121],[144,75],[141,9]],
            [[226,132],[234,99],[146,70],[144,-3]],
            [[225,97],[232,66],[151,42],[150,-28]],
            [[220,63],[222,35],[157,11],[153,-51]],
        ],
    ]
    u = np.linspace(0.,1.,160)
    basis = np.column_stack(((1-u)**3,3*(1-u)**2*u,3*(1-u)*u*u,u**3))
    gain = float(PchipInterpolator([130,132,134,136,138,140,142],
                                  [.82,1.,.88,.69,.47,.27,.09])(frame))
    taper = ease(u/.21)*ease((1-u)/.17)
    for points, width in zip(guides,[1.28,.96]):
        controls = PchipInterpolator(keys,np.asarray(points,float),axis=0)(frame)
        xy = basis@controls
        pressure = width*gain*taper*(.84+.16*np.sin(np.pi*u))
        canvas.stroke(xy,pressure)
    # A pair of restrained lift strokes supports the vertical motion. Their
    # travelling tips share the source cels and fade before the landing.
    for x, bottom, length, width in [(146.,145.,88.,.60),(224.,136.,71.,.49)]:
        shift = 6.2*(frame-130)
        xy = np.column_stack((x+1.6*np.sin(np.pi*u),bottom-shift-length*u))
        canvas.stroke(xy,width*gain*taper)


def paint(frame):
    EFFECT.seek(frame)
    ACTOR.seek(frame)
    image = np.asarray(EFFECT.convert('RGB'), np.float32)
    plain = np.asarray(ACTOR.convert('RGB'), np.float32)
    exp = exposure(image, frame)
    flat = image.reshape(-1, 3)
    back = np.array([np.percentile(flat[ids], 18, axis=0) for ids in SAMPLES], np.float32)[LABELS]
    room = np.maximum(20, 255-back)
    light = np.clip(np.sum((image-back-2)*room, axis=2)/np.sum(room*room, axis=2), 0, 1)
    invalid = np.uint8(STATIONARY | ink(plain))
    valid = (cv2.dilate(invalid, np.ones((7,7),np.uint8)) == 0).astype(np.float32)
    def filtered(sigma):
        return blur(light*valid, sigma)/np.maximum(.025, blur(valid, sigma))
    # Extract the narrow moving crests separately from their soft wash.
    # Filtering only reliable pixels keeps the photographed glyphs, foot ring
    # and desk props out of all six playable evolutions.
    measured = (filtered(1.05)-filtered(4.8))*valid
    bridge = blur(measured, 2.25)/np.maximum(.07, blur(valid, 2.25))
    crest = np.maximum(0, measured+bridge*(1-valid))*ease((blur(valid, 4)-.10)/.44)
    lift = 0 if frame<126 else min(47, max(0, (frame-126)*7))
    center = np.hypot((X-184)/48, (Y-134+lift)/48)
    if frame>=114:
        crest *= ease((center-.67)/.52)
    if 130<=frame<=142:
        added = np.maximum(0, image[:,:,2]-plain[:,:,2]-9)/np.maximum(50, 255-plain[:,:,2])
        crest = np.maximum(crest, (blur(added,.8)-blur(added,4))*ease((1.16-center)/.5))

    canvas = BrushFrame(W,H)
    if GUIDES[frame]:
        room = np.maximum(18, 255-PLATE)
        main = np.clip(np.sum((plain-PLATE-2)*room, axis=2)/np.sum(room*room, axis=2),0,1)
        main = np.maximum(main, np.clip((plain.min(axis=2)-175)/78, 0, 1))
        paired_ridge = blur(main,.95)-blur(main,4.3)
        crest *= 1-orbit_paint(canvas,frame,paired_ridge,valid)

    halo = filtered(8)
    # Fill areas with no background samples from a wider neighborhood.
    support = ease(blur(valid,8)/.54)
    halo = halo*support+filtered(24)*(1-support)
    if 115<=frame<=133:
        peak = np.percentile(image[(X-184)**2+(Y-134)**2<21**2,2],65)/255
        falloff = np.exp(-((X-184)**2+(Y-134)**2)/(2*(24 if frame<124 else 41)**2))
        halo = np.maximum(halo, falloff*ease((peak-.38)/.6))
    if 124<=frame<=140:
        # The saturated nucleus follows the rising character. Average the
        # measured wash radially so even the white silhouette never prints
        # the reference character onto another playable form.
        radius=np.hypot(X-184,Y-136+lift*ease((frame-127)/5))
        bins=np.minimum(radius.astype(int),250)
        sums=np.bincount(bins.ravel(),weights=halo.ravel(),minlength=251)
        counts=np.bincount(bins.ravel(),minlength=251)
        profile=blur((sums/np.maximum(1,counts)).astype('float32')[:,None],3)[:,0]
        halo=np.interp(radius,np.arange(251),profile)
        if frame==124:
            u=np.linspace(-1.,1.,110)
            xy=np.column_stack((184+u*184,135-u*7))
            canvas.stroke(xy,2.8*(1-abs(u)**.68))
        else:
            ring=None
            radial=np.hypot(X-184,Y-136)
            if frame<=129:
                gradient=blur(light,1)-blur(light,5)
                bins=radial.astype(int)
                ok=(valid>.5)&((X-184)<.8*radial)
                counts=np.bincount(bins[ok],minlength=251)
                sums=np.bincount(bins[ok],weights=gradient[ok],minlength=251)
                score=sums/np.maximum(1,counts)
                score[(counts<12)|(np.arange(len(score))<52)]=0
                if score.max()>.045:
                    ring=np.argmax(score)
            if frame>=130:
                canvas.wheel(crest*ease((center-1.26)/.30),valid,ring)
                rise_paint(canvas,frame)
            else:
                canvas.wheel(crest,valid,ring)
    elif 141<=frame<=142:
        canvas.trace(crest*ease((center-1.26)/.30))
        rise_paint(canvas,frame)
    elif frame>0:
        canvas.trace(crest)
    else:
        halo.fill(0)
    body,filament=canvas.fields()
    return body,filament,np.clip(halo,0,1),exp


def local_color(distance, filament, halo, frame):
    # Compact, independent local sprite for an unavailable full-screen pass.
    body = ease(distance+.55)
    charge = ease((frame-18)/102)
    hit = float(frame>=124)
    edge = np.array([139,87,41])*(1-charge)+np.array([154,58,20])*charge
    base = np.array([245,199,110])*(1-charge)+np.array([255,139,34])*charge
    base = base*(1-hit)+np.array([255,206,65])*hit
    fill = ease((distance-.12)/1.2)[:,:,None]
    color = edge*(1-fill)+base*fill
    hot = ease((filament+.65)/1.35)[:,:,None]
    color = color*(1-hot)+np.array([255,245,196])*hot
    wash = np.clip((halo-.045)*(1.20 if hit else .59), 0, 1)
    alpha = body+(1-body)*wash
    rgb = (color*body[:,:,None]+np.array([255,221,151])*(wash*(1-body))[:,:,None])/np.maximum(.001,alpha[:,:,None])
    return Image.fromarray(np.uint8(np.dstack([np.clip(rgb,0,255), np.round(alpha*63)*255/63])))


def exterior_seeds():
    # Identical tracks to the original full-field particle painter. The GPU
    # now lays a tapered brush strip along those paths at device resolution.
    rng = np.random.default_rng(149)
    trails = []
    for _ in range(157):
        trails.append([rng.uniform(0,6.2832),rng.uniform(0,1),rng.uniform(.80,1.72),rng.uniform(410,750),
                       rng.choice([-1,1],p=[.18,.82])*rng.uniform(.45,1.28),rng.uniform(.55,1.15),rng.uniform(.8,2.4)])
    rays = np.column_stack((rng.uniform(0,2*np.pi,115),rng.uniform(0,.23,115),rng.uniform(34,165,115)))
    return np.round(trails,5).tolist(), np.round(rays,5).tolist()


def build(output):
    tile_width, tile_height = 272, 204
    columns, rows = 12, 12
    nib_w, nib_h, nib_columns = 204, 153, 16
    wash_w, wash_h, wash_columns = 68, 51, 48
    nib_y = tile_height * rows
    wash_y = nib_y + 9*nib_h
    atlas = Image.new('L',(columns*tile_width,wash_y+3*wash_h),124)
    local_size = 112
    local = Image.new('RGBA',(8*local_size,9*local_size))
    exposures = []
    for frame in range(143):
        distance, filament, halo, exp = paint(frame)
        exposures.append(exp)
        # Retain subpixel distance until the final sample. Restrict the stored
        # range to the edge and pigment transitions used by the shader, making
        # high-quality grayscale compression practical within the game bundle.
        for field, size, cols, top in [
            (distance,(tile_width,tile_height),columns,0),
            (filament,(nib_w,nib_h),nib_columns,nib_y),
        ]:
            resized = cv2.resize(field,size,interpolation=cv2.INTER_AREA)
            encoded = np.uint8(np.clip(160+13*resized,124,188)+.5)
            atlas.paste(Image.fromarray(encoded),((frame%cols)*size[0],top+(frame//cols)*size[1]))
        gray = np.uint8(np.clip(255*np.sqrt(halo),0,255))
        wash = Image.fromarray(gray).resize((wash_w,wash_h),Image.Resampling.LANCZOS)
        atlas.paste(wash,((frame%wash_columns)*wash_w,wash_y+(frame//wash_columns)*wash_h))
        if frame%2==0:
            i = frame//2
            sprite = local_color(distance,filament,halo,frame).resize((local_size,3*local_size//4),Image.Resampling.LANCZOS)
            local.paste(sprite,((i%8)*local_size,(i//8)*local_size+local_size//8))
    atlas.save(output,format='WEBP',quality=96,method=6)
    local.save(output.with_name('evolution-light.webp'),format='WEBP',quality=85,alpha_quality=85,method=6)
    trails,rays = exterior_seeds()
    return dict(columns=columns,rows=rows,tileWidth=tile_width,tileHeight=tile_height,exposures=exposures,
                nibTile=[nib_w,nib_h],nibColumns=nib_columns,nibY=nib_y,
                washTile=[wash_w,wash_h],washColumns=wash_columns,washY=wash_y,
                textureSize=list(atlas.size),
                crop=[11,230,W,H],trails=trails,rays=rays)


if __name__ == '__main__':
    print(json.dumps(build(Path(sys.argv[1])),separators=(',',':')))
