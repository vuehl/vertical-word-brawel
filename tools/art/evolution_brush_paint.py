"""Smooth tapered ink and ivory filaments, sampled at four times source density."""
import cv2
import numpy as np
from scipy.interpolate import make_splprep


def ease(t):
    t = np.clip(t, 0, 1)
    return t*t*(3-2*t)


def sampled(image, points):
    coords = np.ascontiguousarray(points.reshape(1,-1,2), dtype='float32')
    return cv2.remap(image, coords, None, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)[0]


class BrushFrame:
    def __init__(self, width, height):
        self.body = np.zeros((4*height,4*width),np.uint8)
        self.light = np.zeros_like(self.body)

    @staticmethod
    def ribbon(layer, xy, normal, width, offset=0):
        offset = np.broadcast_to(offset,len(xy))
        hi = xy+normal*(offset+width)[:,None]
        lo = xy+normal*(offset-width)[:,None]
        hull = np.rint(32*np.concatenate((hi,lo[::-1]))).astype(np.int32)
        cv2.fillPoly(layer,[hull],255,lineType=cv2.LINE_AA,shift=3)

    def stroke(self, xy, width, split=False, closed=False):
        xy=np.asarray(xy,dtype='float64')
        width=np.asarray(width,dtype='float64')
        distance=np.r_[0.,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
        keep=np.r_[True,np.diff(distance)>.0001]
        xy,width,distance=xy[keep],width[keep],distance[keep]
        if len(xy)<3 or distance[-1]<.1:return
        along=np.linspace(0.,distance[-1],max(7,int(distance[-1]/.40)+1))
        pts=np.column_stack([np.interp(along,distance,xy[:,j]) for j in (0,1)])
        pressure=np.interp(along,distance,width)
        # Smooth pressure by physical distance, retaining the broad weight
        # changes of the brush and the measured position of each open tip.
        sigma=2.4/(along[1]-along[0])
        if closed:
            pad=int(np.ceil(sigma*4))
            pressure=cv2.GaussianBlur(np.pad(pressure,(pad,pad),mode='wrap')[:,None],(1,0),sigma)[:,0][pad:-pad]
        else:
            pressure=cv2.GaussianBlur(pressure[:,None],(1,0),sigma,borderType=cv2.BORDER_REPLICATE)[:,0]
            tip=np.minimum(ease(along/min(3.3,along[-1]*.20)),ease((along[-1]-along)/min(2.2,along[-1]*.16)))
            pressure*=tip
        xy,width=pts,pressure
        # Do not draw a hairline through the pen-up region of an open arc.
        active = width>.15
        breaks = np.nonzero(np.diff(np.r_[False,active,False]))[0].reshape(-1,2)
        for lo, hi in breaks:
            if hi-lo<3:
                continue
            pts, rad = xy[lo:hi], width[lo:hi]
            direction = np.gradient(pts,axis=0)
            normal = np.column_stack((-direction[:,1],direction[:,0]))
            normal /= np.maximum(.001,np.linalg.norm(normal,axis=1,keepdims=True))
            if not closed and np.mean(normal[:,1])>0:
                normal *= -1
            t = np.linspace(0,1,len(pts))
            # A full loop has no end caps. The inset streak drifts to one
            # side and tapers independently, as a loaded brush turns.
            self.ribbon(self.body,pts,normal,rad)
            pressure = (.25+.05*np.sin(np.pi*t)**2)*rad
            inset = rad*(.22+.10*np.cos(2*np.pi*t))
            self.ribbon(self.light,pts,normal,pressure,inset)
            if split and np.max(rad)>2.5:
                bristle = ease((t-.09)/.14)*ease((.80-t)/.27)*ease((rad-1.55)/1.8)
                active_tip = bristle>.09
                if active_tip.sum()>=3:
                    for start,end in np.nonzero(np.diff(np.r_[False,active_tip,False]))[0].reshape(-1,2):
                        s=slice(start,end)
                        self.ribbon(self.light,pts[s],normal[s],.27*bristle[s],(-rad*.52)[s])

    def spark(self, xy, direction, length, width, cross):
        direction = direction/max(.001,np.linalg.norm(direction))
        normal = np.array([-direction[1],direction[0]])
        u = np.linspace(0,1,21)
        line = xy+(u[:,None]-.5)*length*direction
        # A long fine tail and a short chisel tip, with a narrower ivory cut.
        pressure = np.interp(u,[0,.58,.78,1],[0,.64,1,0])**.85
        self.stroke(line,width*pressure)
        if cross:
            pivot = xy+direction*(length*.21)
            half = min(5.6,max(2.8,width*1.8))
            self.stroke(pivot+(u[:,None]-.50)*2*half*normal, (1-abs(2*u-1))**1.6*min(width*.50,1.1))

    def trace(self, crest):
        mask=np.uint8((cv2.GaussianBlur(crest,(0,0),.78)>.033))
        count,labels,stats,_=cv2.connectedComponentsWithStats(mask)
        long_mask=np.zeros_like(mask)
        for i in range(1,count):
            x,y,w,h,area=stats[i]
            if area<3:
                continue
            region=(slice(y,y+h),slice(x,x+w))
            member=labels[region]==i
            yy,xx=np.nonzero(member)
            pts=np.column_stack((xx+x,yy+y)).astype(float)
            bright=crest[region][member]
            if bright.max()<.060:
                continue
            if max(w,h)>33:
                long_mask[region][member]=255
                continue
            center=pts.mean(axis=0)
            _,axes=np.linalg.eigh(np.cov((pts-center).T))
            axis=axes[:,-1]
            along=(pts-center)@axis
            length=max(3.,float(np.ptp(along))+2.6)
            width=np.clip(area/length*.82,.75,3.4)
            if np.dot(along,bright)<0:
                axis=-axis
            if length<5:
                axis=np.array([.42,-.91])
            self.spark(center,axis,length,width,area>=23 and bright.max()>.135 and width>1.6)
        if not long_mask.any():
            return
        radius=cv2.distanceTransform(long_mask,cv2.DIST_L2,5)
        skeleton=cv2.ximgproc.thinning(long_mask)
        points=set(map(tuple,np.argwhere(skeleton).tolist()))
        neighbors={}
        for y,x in points:
            neighbors[y,x]=[(y+dy,x+dx) for dy in (-1,0,1) for dx in (-1,0,1)
                if (dy or dx) and (y+dy,x+dx) in points
                and not (dy and dx and ((y+dy,x) in points or (y,x+dx) in points))]
        used=set()
        for start in sorted(neighbors,key=lambda p:len(neighbors[p])==2):
            for nxt in neighbors[start]:
                if (start,nxt) in used:
                    continue
                chain=[start]
                a,b=start,nxt
                while (a,b) not in used:
                    used.update(((a,b),(b,a)))
                    chain.append(b)
                    if len(neighbors[b])!=2:
                        break
                    a,b=b,next(p for p in neighbors[b] if p!=a)
                if len(chain)<7:
                    continue
                xy=np.asarray(chain,dtype='float32')[:,::-1].copy()
                width=sampled(radius,xy)
                arc=np.r_[0.,np.cumsum(np.linalg.norm(np.diff(xy,axis=0),axis=1))]
                # Fit away single-pixel steps while staying within the observed
                # light. This regularises curvature as well as the silhouette.
                spline,_=make_splprep(xy.T,u=arc/arc[-1],s=len(xy)*.45)
                xy=spline(arc/arc[-1]).T
                width=cv2.GaussianBlur(width[:,None],(1,0),3.2,borderType=cv2.BORDER_REPLICATE)[:,0]
                taper=np.minimum(ease(arc/min(15.,arc[-1]*.35)),ease((arc[-1]-arc)/min(11.,arc[-1]*.29)))
                self.stroke(xy,np.minimum(5.4,.35+width*1.20)*taper,split=arc[-1]>53)

    def wheel(self, crest, valid, ring_radius):
        # Sample the spoke angles on this frame of the master. Draw each one
        # with a fine root and a pointed end instead of tracing its GIF pixels.
        center=np.array([184.,136.])
        angles=np.arange(720)*np.pi/360
        directions=np.column_stack((np.cos(angles),np.sin(angles)))
        radii=np.arange(26.,239.,2.)
        points=center+directions[:,None,:]*radii[None,:,None]
        coords=points.astype('float32')
        signal=cv2.remap(crest,coords,None,cv2.INTER_LINEAR)
        ok=cv2.remap(valid,coords,None,cv2.INTER_LINEAR)>.65
        if ring_radius:
            ok &= (abs(radii-ring_radius)>9)
        signal*=ok
        score=np.sum(signal,axis=1)/np.maximum(18,ok.sum(axis=1))
        peaks=(score>=np.roll(score,1)) & (score>np.roll(score,-1)) & (score>.010)
        selected=[]
        u=np.linspace(0,1,23)
        for i in np.argsort(-score):
            if not peaks[i] or any(min(abs(i-j),720-abs(i-j))<5 for j in selected):
                continue
            strong=radii[signal[i]>max(.018,score[i]*.55)]
            if len(strong)<5:
                continue
            start,end=np.percentile(strong,[3,98])
            if end-start<12:
                continue
            selected.append(i)
            width=np.clip(.35+8.0*score[i],.48,2.45)
            length=end-start
            shape=np.interp(u,[0,.23,.78,1],[0,1,.62,0])
            self.stroke(center+(start+u[:,None]*length)*directions[i],width*shape)
        if ring_radius:
            t=np.linspace(0,2*np.pi,560)
            points=center+ring_radius*np.column_stack((np.cos(t),np.sin(t)))
            width=2.25+1.05*np.sin(t-.4)+.46*np.cos(3*t+.3)
            self.stroke(points,width,closed=True)
            # A second, partial nib follows the inside edge of the same rim.
            r=ring_radius-4.7
            self.stroke(center+r*np.column_stack((np.cos(t),np.sin(t))),
                        np.maximum(0.,.94*np.sin(t*2-.8)),closed=True)

    def fields(self):
        def distance(layer):
            coverage=layer.astype('float32')/255
            binary=np.uint8(coverage>.50)
            inner=cv2.distanceTransform(binary,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
            outer=cv2.distanceTransform(1-binary,cv2.DIST_L2,cv2.DIST_MASK_PRECISE)
            field=(inner-outer+coverage-.5)*.25
            # Compute distance before reducing resolution. Thresholding after
            # shrinking would reintroduce staircase edges on every curved line.
            return cv2.resize(np.clip(field,-12,12),None,fx=.25,fy=.25,interpolation=cv2.INTER_AREA)
        return distance(self.body),distance(self.light)
