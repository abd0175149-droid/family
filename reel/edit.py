"""Confrontation Reel editor: renders a 1080x1920 vertical edit of the source clip
with reframing, punch-ins, motion graphics, sound design and a synthesized score."""
import os, sys, subprocess, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy import signal

SRC = sys.argv[1]
OUT = sys.argv[2]
WORK = os.path.dirname(os.path.abspath(__file__))
FPS = 30
W, H = 1080, 1920
SW, SH = 576, 1024
SR = 44100
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
rng = np.random.default_rng(7)

# ---------------------------------------------------------------- source
print("decoding source...", flush=True)
grade = ("eq=contrast=1.07:brightness=0.004:saturation=1.07:gamma=0.985,"
         "curves=all='0/0.012 0.22/0.20 0.78/0.80 1/0.975'")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-vf", grade, "-f", "rawvideo",
                      "-pix_fmt", "bgr24", "-"], capture_output=True, check=True).stdout
FR = np.frombuffer(raw, np.uint8).reshape(-1, SH, SW, 3)
NF = len(FR)
aud = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
A = np.frombuffer(aud, np.float32).reshape(-1, 2).copy()

def src_frame(t):
    return FR[min(NF - 1, max(0, int(round(t * FPS))))]

# ---------------------------------------------------------------- edit decision list
# v=(in,out) source video; a=audio start (defaults to v[0]); face=(x,y) normalized
# z=zoom, z1=end zoom (slow push); tin=transition in; punch=[(t,z)]; shake=[(t0,t1,amp)]
# lines/brackets/red/q=[(t0,t1)] graphics windows (segment-local seconds); sfx=[(t,name)]
GUY, MER = "guy", "meran"
EDL = [
    # COLD OPEN: strongest pointing accusation, punched in hard
    dict(v=(59.55, 60.95), face=(0.55, 0.38), z=1.15, z1=1.42, tin="flash",
         shake=[(0.0, 0.5, 9)], lines=[(0.0, 1.4)], red=[(0.0, 1.4)], vig=0.5,
         sfx=[(0.0, "hit"), (0.0, "reverse_end")]),
    dict(kind="vs", dur=0.9, sfx=[(0.0, "whoosh"), (0.22, "hit"), (0.22, "shing")]),
    # SETUP / ACCUSATION — orange hoodie opens
    dict(v=(0.45, 2.7), face=(0.55, 0.40), z=1.05, z1=1.12, tin="zoom", lines=[(0.5, 1.4)],
         sfx=[(0.0, "whoosh_s"), (0.6, "impact")]),
    dict(v=(2.7, 5.2), face=(0.55, 0.40), z=1.32, tin="cut", sfx=[(0.0, "pop")]),
    # MERAN RESPONDS (timer counting down on the screen behind her)
    dict(v=(6.0, 8.3), face=(0.43, 0.40), z=1.08, z1=1.14, tin="whip", sfx=[(0.0, "whoosh")]),
    dict(v=(8.3, 10.55), face=(0.45, 0.42), z=1.36, tin="cut", sfx=[(0.0, "pop")]),
    # ESCALATION — he comes back pointing
    dict(v=(11.05, 13.5), face=(0.48, 0.44), z=1.05, tin="whip", sfx=[(0.0, "whoosh")]),
    dict(v=(13.5, 16.6), face=(0.42, 0.44), z=1.3, tin="cut", brackets=[(1.3, 2.6)],
         shake=[(1.45, 1.75, 6)], sfx=[(0.0, "pop"), (1.45, "impact")]),
    # TIME IS UP (انتهى الوقت on screen) — Meran under pressure
    dict(v=(17.2, 19.3), face=(0.45, 0.37), z=1.1, tin="flash", sfx=[(-0.6, "riser06"), (0.0, "hit")]),
    dict(v=(45.0, 45.65), a=19.3, face=(0.50, 0.42), z=1.38, tin="cut", q=[(0.1, 0.65)],
         sfx=[(0.05, "impact_soft")]),  # his silent reaction while she talks
    dict(v=(19.95, 21.0), face=(0.45, 0.37), z=1.25, tin="cut"),
    dict(v=(21.4, 23.4), face=(0.40, 0.37), z=1.14, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(23.4, 25.4), face=(0.37, 0.37), z=1.42, tin="cut", red=[(0.6, 2.0)], vig=0.45,
         shake=[(1.05, 1.3, 5)], sfx=[(1.05, "impact")]),
    # HIS STRONGEST GESTURE -> freeze frame
    dict(v=(25.5, 29.2), face=(0.55, 0.39), z=1.1, tin="zoom", punch=[(2.4, 1.38)],
         shake=[(2.4, 2.8, 10)], lines=[(2.4, 3.7)], flashes=[2.4],
         sfx=[(0.0, "whoosh_s"), (2.4, "hit")]),
    dict(kind="freeze", t=28.15, dur=0.75, face=(0.55, 0.36), z=1.3,
         sfx=[(0.0, "freeze")]),
    # MERAN'S DEFENSE (seated)
    dict(v=(30.65, 33.5), face=(0.52, 0.53), z=1.08, tin="zoom", sfx=[(0.0, "whoosh")]),
    dict(v=(33.5, 36.9), face=(0.52, 0.52), z=1.36, tin="cut", sfx=[(0.0, "pop")]),
    # HE PUSHES BACK
    dict(v=(37.0, 40.5), face=(0.56, 0.42), z=1.06, z1=1.12, tin="whip", sfx=[(0.0, "whoosh")]),
    dict(v=(40.5, 43.0), face=(0.50, 0.42), z=1.32, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(43.0, 45.0), face=(0.52, 0.42), z=1.16, tin="cut", brackets=[(0.2, 1.9)]),
    # her silent stare (slow motion) before she stands up to answer
    dict(v=(53.0, 53.5), a=45.0, adur=0.7, speed=0.5, face=(0.40, 0.28), z=1.42, tin="cut",
         q=[(0.15, 1.0)], vig=0.4, sfx=[(0.0, "heartbeat")]),
    dict(v=(45.75, 48.5), face=(0.38, 0.27), z=1.1, tin="flash", sfx=[(0.0, "hit")]),
    dict(v=(48.5, 50.8), face=(0.37, 0.26), z=1.32, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(50.8, 53.0), face=(0.38, 0.27), z=1.18, tin="cut", red=[(0.4, 2.2)],
         shake=[(0.9, 1.15, 5)], sfx=[(0.9, "impact")]),
    # TURNING POINT — his final accusation (callback to the cold open)
    dict(v=(54.05, 57.0), face=(0.55, 0.39), z=1.08, tin="zoom", sfx=[(0.0, "whoosh_s")]),
    dict(v=(57.0, 59.55), face=(0.56, 0.38), z=1.3, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(59.55, 60.95), face=(0.55, 0.38), z=1.15, z1=1.42, tin="cut", shake=[(0.0, 0.5, 9)],
         lines=[(0.0, 1.4)], red=[(0.0, 1.4)], vig=0.5, sfx=[(0.0, "hit")]),
    # PAYOFF — Meran's last word
    dict(v=(61.55, 64.5), face=(0.45, 0.42), z=1.06, tin="flash", sfx=[(-0.6, "riser06"), (0.0, "hit")]),
    dict(v=(64.5, 67.0), face=(0.47, 0.42), z=1.3, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(67.0, 69.9), face=(0.48, 0.41), z=1.25, z1=1.42, tin="cut", vig=0.5, red=[(1.6, 2.9)],
         sfx=[(0.0, "heartbeat"), (1.4, "heartbeat")]),
    # host closes it out
    dict(v=(70.45, 75.4), face=(0.45, 0.30), z=1.04, z1=1.14, tin="whip",
         sfx=[(0.0, "whoosh"), (4.9, "hit_end")]),
]

for s in EDL:
    s.setdefault("kind", "clip")
    if s["kind"] == "clip":
        sp = s.get("speed", 1.0)
        s["dur"] = (s["v"][1] - s["v"][0]) / sp
t = 0.0
for s in EDL:
    s["start"] = t
    s["nf"] = int(round(s["dur"] * FPS))
    t += s["nf"] / FPS
TOTAL = t
print(f"edit length {TOTAL:.2f}s, {len(EDL)} segments", flush=True)

# ---------------------------------------------------------------- graphics helpers
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
rad = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = np.clip((rad - 0.55) / 0.85, 0, 1) ** 1.6          # dark vignette mask
REDM = np.clip((rad - 0.72) / 0.5, 0, 1) ** 1.3           # red edge pulse mask

def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3

def render(img, face, z, dx=0.0, dy=0.0, target=(W / 2, H / 2)):
    s = (W / SW) * z
    hw, hh = target[0] / s, target[1] / s
    hw2, hh2 = (W - target[0]) / s, (H - target[1]) / s
    cx = min(max(face[0] * SW, hw), SW - hw2)
    cy = min(max(face[1] * SH, hh), SH - hh2)
    M = np.float32([[s, 0, target[0] - s * cx + dx], [0, s, target[1] - s * cy + dy]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

def sharpen(f):
    b = cv2.GaussianBlur(f, (0, 0), 1.6)
    return cv2.addWeighted(f, 1.35, b, -0.35, 0)

def lines_overlay(seed):
    r = np.random.default_rng(seed)
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    cx, cy = W / 2, H * 0.42
    for _ in range(70):
        a = r.uniform(0, 2 * math.pi)
        w = r.uniform(0.004, 0.014)
        R0 = r.uniform(0.62, 0.8) * 1100
        pts = [(cx + math.cos(a) * R0, cy + math.sin(a) * R0 * 1.25),
               (cx + math.cos(a - w) * 2400, cy + math.sin(a - w) * 3000),
               (cx + math.cos(a + w) * 2400, cy + math.sin(a + w) * 3000)]
        d.polygon(pts, fill=int(r.uniform(90, 170)))
    return np.asarray(im, np.float32)[..., None] / 255.0
LINES = [lines_overlay(i) for i in range(3)]

def text_rgba(txt, size, fill=(255, 255, 255), stroke=0, stroke_fill=(0, 0, 0)):
    f = ImageFont.truetype(FONT, size)
    d0 = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    box = d0.textbbox((0, 0), txt, font=f, stroke_width=stroke)
    w, h = box[2] - box[0] + 40, box[3] - box[1] + 40
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.text((20 - box[0], 20 - box[1]), txt, font=f, fill=fill + (255,), stroke_width=stroke,
           stroke_fill=stroke_fill + (255,))
    return np.asarray(im)

QM = text_rgba("?", 230, fill=(255, 255, 255), stroke=6, stroke_fill=(200, 30, 45))

def paste_rgba(dst, rgba, cx, cy, scale=1.0, alpha=1.0):
    if scale != 1.0:
        rgba = cv2.resize(rgba, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
    h, w = rgba.shape[:2]
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    xa, ya, xb, yb = max(x0, 0), max(y0, 0), min(x0 + w, W), min(y0 + h, H)
    if xa >= xb or ya >= yb:
        return
    sub = rgba[ya - y0:yb - y0, xa - x0:xb - x0].astype(np.float32)
    a = sub[..., 3:4] / 255.0 * alpha
    col = sub[..., :3][..., ::-1]
    roi = dst[ya:yb, xa:xb].astype(np.float32)
    dst[ya:yb, xa:xb] = (roi * (1 - a) + col * a).astype(np.uint8)

def brackets(f, cx, cy, bw, bh, k, color=(50, 40, 235), th=9):
    L = int(min(bw, bh) * 0.22)
    x0, y0, x1, y1 = int(cx - bw / 2), int(cy - bh / 2), int(cx + bw / 2), int(cy + bh / 2)
    for (px, py, sx, sy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        cv2.line(f, (px, py), (px + sx * L, py), color, th, cv2.LINE_AA)
        cv2.line(f, (px, py), (px, py + sy * L), color, th, cv2.LINE_AA)
    # small center target tick
    if k > 0.5:
        cv2.circle(f, (int(cx), int(cy)), 6, color, -1, cv2.LINE_AA)

def face_out(face, z, target=(W / 2, H / 2)):
    s = (W / SW) * z
    cx = min(max(face[0] * SW, target[0] / s), SW - (W - target[0]) / s)
    cy = min(max(face[1] * SH, target[1] / s), SH - (H - target[1]) / s)
    return target[0] + s * (face[0] * SW - cx), target[1] + s * (face[1] * SH - cy)

def in_win(wins, tl):
    for (a, b) in wins or []:
        if a <= tl < b:
            return (tl - a, b - a)
    return None

# ---------------------------------------------------------------- VS card
def vs_frames(n):
    top = render(src_frame(1.3), (0.55, 0.40), 1.55, target=(W / 2, 520))
    bot = render(src_frame(22.6), (0.42, 0.37), 1.5, target=(W / 2, 1430))
    mask = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mask, [np.array([[0, 0], [W, 0], [W, 830], [0, 1090]], np.int32)], 255)
    vs = text_rgba("VS", 250, fill=(255, 255, 255), stroke=10, stroke_fill=(20, 20, 30))
    title = text_rgba("مواجهة", 92, fill=(255, 255, 255), stroke=5, stroke_fill=(20, 20, 30))
    out = []
    for i in range(n):
        tt = i / FPS
        k = ease(tt / 0.22)
        f = np.zeros((H, W, 3), np.uint8)
        offt = int((1 - k) * -W)
        offb = int((1 - k) * W)
        T = np.roll(top, offt, axis=1)
        B = np.roll(bot, offb, axis=1)
        if offt < 0:
            T[:, W + offt:] = 0
        if offb > 0:
            B[:, :offb] = 0
        m = mask[..., None] > 0
        f = np.where(m, T, B)
        # cool/warm split tint
        f = f.astype(np.float32)
        f[..., 0] = np.where(mask > 0, f[..., 0] * 0.9, f[..., 0] * 1.0)
        f[..., 2] = np.where(mask > 0, f[..., 2] * 1.05, f[..., 2] * 0.92)
        f = np.clip(f, 0, 255).astype(np.uint8)
        # split line
        if k > 0.98:
            cv2.line(f, (0, 1090), (W, 830), (255, 255, 255), 12, cv2.LINE_AA)
            cv2.line(f, (0, 1100), (W, 840), (50, 40, 235), 5, cv2.LINE_AA)
        if tt >= 0.2:
            p = (tt - 0.2) / 0.18
            sc = 1.0 + 1.2 * (1 - ease(p))
            paste_rgba(f, vs, W / 2, 960, sc)
            if tt > 0.3:
                paste_rgba(f, title, W / 2, 1150, 1.0, min(1, (tt - 0.3) / 0.12))
        if 0.2 <= tt < 0.3:  # flash frame on impact
            a = 1 - (tt - 0.2) / 0.1
            f = cv2.addWeighted(f, 1 - 0.8 * a, np.full_like(f, 255), 0.8 * a, 0)
        if tt >= 0.22:
            sh = int(8 * max(0, 1 - (tt - 0.22) / 0.3) * math.sin(tt * 90))
            f = np.roll(f, sh, axis=1)
        out.append(f)
    return out

# ---------------------------------------------------------------- render frames
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                        "-crf", "14", "-pix_fmt", "yuv420p", os.path.join(WORK, "video_only.mp4")],
                       stdin=subprocess.PIPE)
prev = None
for si, s in enumerate(EDL):
    print(f"seg {si} {s['kind']} start={s['start']:.2f} dur={s['dur']:.2f}", flush=True)
    if s["kind"] == "vs":
        for f in vs_frames(s["nf"]):
            enc.stdin.write(f.tobytes()); prev = f
        continue
    if s["kind"] == "freeze":
        base = render(src_frame(s["t"]), s["face"], s["z"])
        g = cv2.cvtColor(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
        base = cv2.addWeighted(base, 0.35, g, 0.65, 0)
        base = cv2.convertScaleAbs(base, alpha=1.15, beta=-12)
        fx, fy = face_out(s["face"], s["z"])
        for i in range(s["nf"]):
            tt = i / FPS
            zz = 1 + 0.03 * tt / s["dur"]
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, zz)
            f = cv2.warpAffine(base, M, (W, H), borderMode=cv2.BORDER_REFLECT)
            f = (f.astype(np.float32) * (1 - 0.55 * VIG[..., None])).astype(np.uint8)
            cv2.rectangle(f, (28, 28), (W - 28, H - 28), (255, 255, 255), 6)
            k = ease(tt / 0.15)
            brackets(f, fx, fy, 470 * (1.25 - 0.25 * k), 560 * (1.25 - 0.25 * k), k)
            paste_rgba(f, QM, fx + 300, fy - 260, 0.6 + 0.4 * ease(tt / 0.12))
            if tt < 0.1:
                a = 1 - tt / 0.1
                f = cv2.addWeighted(f, 1 - 0.9 * a, np.full_like(f, 255), 0.9 * a, 0)
            enc.stdin.write(f.tobytes()); prev = f
        continue
    sp = s.get("speed", 1.0)
    z0 = s["z"]; z1 = s.get("z1", z0)
    for i in range(s["nf"]):
        tl = i / FPS
        st = s["v"][0] + tl * sp
        # zoom curve
        z = z0 + (z1 - z0) * (tl / s["dur"])
        for (tp, zp) in s.get("punch", []):
            if tl >= tp:
                z = z + (zp - z) * ease((tl - tp) / 0.1)
        dx = dy = 0.0
        tin = s.get("tin")
        if tin == "zoom":
            z *= 1 + 0.35 * (1 - ease(tl / 0.22))
        if tin == "whip":
            dx = 700 * (1 - ease(tl / 0.18))
        for (a, b, amp) in s.get("shake", []):
            if a <= tl < b:
                d = 1 - (tl - a) / (b - a)
                dx += amp * d * math.sin(tl * 97) * 1.6
                dy += amp * d * math.cos(tl * 83) * 1.6
                z *= 1.01
        img = src_frame(st)
        if sp < 1.0 and prev is not None:  # frame blending for smoother slow motion
            fi = st * FPS
            a = fi - math.floor(fi)
            img = cv2.addWeighted(src_frame(math.floor(fi) / FPS), 1 - a,
                                  src_frame((math.floor(fi) + 1) / FPS), a, 0)
        f = sharpen(render(img, s["face"], z, dx, dy))
        # transition blurs
        if tin == "whip" and tl < 0.18:
            k = int(60 * (1 - tl / 0.18)) * 2 + 1
            f = cv2.blur(f, (k, 1))
        if tin == "zoom" and tl < 0.15 and prev is not None:
            f = cv2.addWeighted(f, 0.6, cv2.GaussianBlur(f, (0, 0), 6 * (1 - tl / 0.15) + 0.1), 0.4, 0)
        ff = f.astype(np.float32)
        if s.get("vig"):
            ff *= 1 - s["vig"] * VIG[..., None]
        r = in_win(s.get("red"), tl)
        if r:
            pulse = 0.5 + 0.5 * math.sin(2 * math.pi * r[0] * 1.6 - math.pi / 2)
            env = min(1, r[0] / 0.1) * min(1, (r[1] - r[0]) / 0.15)
            a = (0.25 + 0.35 * pulse) * env * REDM[..., None]
            ff = ff * (1 - a) + np.array([40, 30, 220], np.float32) * a
        r = in_win(s.get("lines"), tl)
        if r:
            env = min(1, r[0] / 0.06) * min(1, (r[1] - r[0]) / 0.15)
            Lm = LINES[(i // 2) % 3] * 0.55 * env
            ff = ff * (1 - Lm) + 255 * Lm
        # exposure pulses at flash cuts / hits
        flashes = list(s.get("flashes", [])) + ([0.0] if tin == "flash" else [])
        for fl in flashes:
            if fl <= tl < fl + 0.13:
                a = 1 - (tl - fl) / 0.13
                ff = ff * (1 + 0.5 * a) + 120 * a
        f = np.clip(ff, 0, 255).astype(np.uint8)
        r = in_win(s.get("brackets"), tl)
        if r:
            fx, fy = face_out(s["face"], z)
            k = ease(r[0] / 0.15)
            brackets(f, fx + dx, fy + dy, 430 * (1.3 - 0.3 * k), 520 * (1.3 - 0.3 * k), k)
        r = in_win(s.get("q"), tl)
        if r:
            fx, fy = face_out(s["face"], z)
            sc = 0.45 + 0.4 * ease(r[0] / 0.12) + 0.03 * math.sin(r[0] * 12)
            paste_rgba(f, QM, min(fx + 280, W - 140), max(fy - 280, 180), sc,
                       min(1, (r[1] - r[0]) / 0.1))
        enc.stdin.write(f.tobytes()); prev = f
enc.stdin.close(); enc.wait()

# ---------------------------------------------------------------- dialogue track
N = int(round(TOTAL * SR))
dia = np.zeros((N, 2), np.float32)
for s in EDL:
    if s["kind"] != "clip":
        continue
    a0 = s.get("a", s["v"][0])
    dur = s.get("adur", s["nf"] / FPS)
    seg = A[int(a0 * SR): int(a0 * SR) + int(dur * SR)].copy()
    fl = int(0.008 * SR)
    seg[:fl] *= np.linspace(0, 1, fl)[:, None]; seg[-fl:] *= np.linspace(1, 0, fl)[:, None]
    p = int(round(s["start"] * SR))
    seg = seg[:max(0, N - p)]
    dia[p:p + len(seg)] += seg

def wav(path, x):
    x = np.clip(x, -1, 1)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "pcm_s16le", path], input=x.astype(np.float32).tobytes(), check=True)
wav(os.path.join(WORK, "dialogue_raw.wav"), dia)

# ---------------------------------------------------------------- SFX
def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))

def sweep(f0, f1, dur, curve=3.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    fr = f1 + (f0 - f1) * np.exp(-tt * curve / dur * 3)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR)

def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band")
    return signal.lfilter(b, a, x)

def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "low"); return signal.lfilter(b, a, x)

def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high"); return signal.lfilter(b, a, x)

def noise(n): return rng.standard_normal(n)

def sfx_hit():
    n = int(1.1 * SR)
    sub = sweep(110, 42, 1.1) * env_exp(n, 0.35)
    click = lp(noise(n), 2500) * env_exp(n, 0.012) * 0.6
    return (sub * 0.9 + click) * 0.8

def sfx_impact():
    n = int(0.5 * SR)
    return (sweep(140, 60, 0.5) * env_exp(n, 0.12) * 0.7 + lp(noise(n), 1200) * env_exp(n, 0.02) * 0.4) * 0.6

def sfx_impact_soft():
    return sfx_impact() * 0.55

def sfx_pop():
    n = int(0.12 * SR)
    return (sweep(220, 90, 0.12) * env_exp(n, 0.03) * 0.5 + hp(noise(n), 3000) * env_exp(n, 0.006) * 0.15) * 0.45

def sfx_whoosh(dur=0.38, gain=0.5):
    n = int(dur * SR); x = noise(n)
    out = np.zeros(n); seg = 256
    for k in range(0, n, seg):
        c = k / n
        fc = 300 + 3500 * math.sin(math.pi * c) ** 2
        out[k:k + seg] = bp(x[max(0, k - 512):k + seg], fc * 0.6, min(fc * 1.6, 18000))[-len(x[k:k + seg]):]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return out * e * gain * 3

def sfx_riser(dur):
    n = int(dur * SR); tt = np.linspace(0, 1, n)
    tone = np.sin(2 * np.pi * np.cumsum(180 + 700 * tt ** 2) / SR) * 0.25
    nz = hp(noise(n), 1500) * 0.25
    return (tone + nz) * tt ** 2.2 * 0.55

def sfx_reverse(dur=0.7):
    n = int(dur * SR)
    x = hp(noise(n), 2500) * env_exp(n, 0.18) * 0.4 + sweep(300, 120, dur) * env_exp(n, 0.2) * 0.3
    return x[::-1] * 0.7

def sfx_heartbeat():
    n = int(0.9 * SR); out = np.zeros(n)
    for off, g in [(0.0, 1.0), (0.24, 0.7)]:
        m = int(0.18 * SR); p = int(off * SR)
        out[p:p + m] += sweep(70, 38, 0.18) * env_exp(m, 0.05) * g
    return lp(out, 160) * 1.1

def sfx_shing():
    n = int(0.9 * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 2100 * tt) + 0.6 * np.sin(2 * np.pi * 3170 * tt) + 0.3 * np.sin(2 * np.pi * 4410 * tt))
    return x * env_exp(n, 0.18) * 0.08 + hp(noise(n), 6000) * env_exp(n, 0.05) * 0.08

def sfx_freeze():
    a = sfx_impact(); b = sfx_shing()
    out = np.zeros(max(len(a), len(b))); out[:len(a)] += a; out[:len(b)] += b * 1.3
    return out

SFX = {
    "hit": sfx_hit, "hit_end": lambda: sfx_hit() * 1.1, "impact": sfx_impact, "impact_soft": sfx_impact_soft,
    "pop": sfx_pop, "whoosh": sfx_whoosh, "whoosh_s": lambda: sfx_whoosh(0.3, 0.45),
    "riser06": lambda: sfx_riser(0.6), "reverse_end": None, "heartbeat": sfx_heartbeat,
    "shing": sfx_shing, "freeze": sfx_freeze,
}
fx = np.zeros(N + 2 * SR)
events = []
for s in EDL:
    for (tl, name) in s.get("sfx", []):
        T = s["start"] + tl
        if name == "whoosh" or name == "whoosh_s":
            T -= 0.15  # whoosh peaks on the cut
        events.append((T, name))
for (T, name) in events:
    if SFX.get(name) is None:
        continue
    x = SFX[name]()
    if name.startswith("riser"):
        T = T  # riser already offset to end at the cut
    p = int(max(0, T) * SR)
    x = x[: len(fx) - p]
    fx[p:p + len(x)] += x
fx = fx[:N]
wav(os.path.join(WORK, "sfx.wav"), np.stack([fx, fx], 1) * 0.9)

# ---------------------------------------------------------------- music (tension bed, D minor, 100 BPM)
BPM = 100; beat = 60 / BPM; e8 = beat / 2
mus = np.zeros((N + SR, 2))
tt_all = np.arange(len(mus)) / SR
seg_times = [(s["start"], s["start"] + s["dur"]) for s in EDL]
freeze_t = [(s["start"], s["start"] + s["dur"]) for s in EDL if s["kind"] == "freeze"]
# intensity curve: builds through the edit
def intensity(T):
    return 0.35 + 0.65 * min(1, max(0, T / TOTAL)) ** 1.3
I = np.array([intensity(x) for x in np.linspace(0, TOTAL + 1, 400)])
Ic = np.interp(tt_all, np.linspace(0, TOTAL + 1, 400), I)
# drone
d = (np.sin(2 * np.pi * 73.42 * tt_all) + 0.5 * np.sin(2 * np.pi * 110.0 * tt_all) +
     0.3 * np.sin(2 * np.pi * 146.83 * tt_all + 0.5 * np.sin(2 * np.pi * 0.2 * tt_all)))
d *= 0.12 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.25 * tt_all))
mus[:, 0] += d; mus[:, 1] += np.roll(d, 400)
# pulsing bass 8ths, pattern follows Dm-Bb-Gm-A
roots = [73.42, 58.27, 49.0, 55.0]
t0 = 0.0; k = 0
while t0 < TOTAL + 1:
    bar = int(t0 / (beat * 4)) % 4
    f0 = roots[bar] * (2 if k % 8 in (3, 6) else 1)
    n = int(e8 * SR * 0.95); p = int(t0 * SR)
    tt = np.arange(n) / SR
    note = (np.sign(np.sin(2 * np.pi * f0 * tt)) * 0.4 + np.sin(2 * np.pi * f0 * tt)) * np.exp(-tt / 0.12)
    note = lp(note, 500) * 0.22 * (1.0 if k % 2 == 0 else 0.7)
    seg = note[: len(mus) - p]
    mus[p:p + len(seg)] += seg[:, None] * Ic[p:p + len(seg), None]
    k += 1; t0 += e8
# ticking hats (enter after first third)
t0 = 0.0; k = 0
while t0 < TOTAL + 1:
    if t0 > TOTAL * 0.3:
        n = int(0.05 * SR); p = int(t0 * SR)
        h = hp(noise(n), 7000) * np.exp(-np.arange(n) / (0.01 * SR)) * (0.05 if k % 2 else 0.03)
        seg = h[: len(mus) - p]
        mus[p:p + len(seg), 0] += seg * 0.9; mus[p:p + len(seg), 1] += seg
    k += 1; t0 += e8
# pad chords every bar
chords = [[146.83, 174.61, 220.0], [116.54, 146.83, 174.61], [98.0, 116.54, 146.83], [110.0, 138.59, 164.81]]
for bi in range(int((TOTAL + 1) / (beat * 4)) + 1):
    p = int(bi * beat * 4 * SR); n = int(beat * 4 * SR)
    tt = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * f * tt + j) + 0.3 * np.sin(4 * np.pi * f * tt) for j, f in enumerate(chords[bi % 4]))
    pad *= np.minimum(1, tt / 0.6) * np.minimum(1, (n / SR - tt) / 0.4) * 0.035
    seg = pad[: len(mus) - p]
    mus[p:p + len(seg), 0] += seg * Ic[p:p + len(seg)]; mus[p:p + len(seg), 1] += np.roll(seg, 300) * Ic[p:p + len(seg)]
mus = mus[:N]
# dips: music drops out on the freeze frame (silence = tension), then slams back
gain = np.ones(N)
for (a, b) in freeze_t:
    ia, ib = int(a * SR), int(b * SR)
    gain[ia:ib] = 0.15
# sharp ending: cut on the final hit
end_cut = int((TOTAL - 0.02) * SR)
gain[end_cut:] = 0
gain = np.convolve(gain, np.ones(400) / 400, mode="same")
mus *= gain[:, None]
mus = mus / (np.abs(mus).max() + 1e-9) * 0.7
wav(os.path.join(WORK, "music.wav"), mus)

json.dump(dict(total=TOTAL, segments=[dict(start=s["start"], dur=s["dur"], kind=s["kind"],
          v=s.get("v")) for s in EDL]), open(os.path.join(WORK, "timeline.json"), "w"), indent=1)

# ---------------------------------------------------------------- mix + final encode
fc = (
    "[1:a]highpass=f=85,afftdn=nf=-28,equalizer=f=3000:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2,"
    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,"
    "dynaudnorm=f=150:g=9:p=0.9,asplit=2[dia][key];"
    "[3:a]volume=0.32[mraw];"
    "[mraw][key]sidechaincompress=threshold=0.02:ratio=9:attack=25:release=350:makeup=1[mduck];"
    "[2:a]volume=0.85[sfx];"
    "[dia][mduck][sfx]amix=inputs=3:normalize=0:weights='1 1 1',"
    "alimiter=limit=0.89:attack=3:release=60,loudnorm=I=-14:TP=-1.2:LRA=9[aout]"
)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(WORK, "video_only.mp4"),
                "-i", os.path.join(WORK, "dialogue_raw.wav"), "-i", os.path.join(WORK, "sfx.wav"),
                "-i", os.path.join(WORK, "music.wav"), "-filter_complex", fc,
                "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
                "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "256k",
                "-ar", "48000", "-movflags", "+faststart", "-shortest", OUT], check=True)
print("done", OUT, flush=True)
