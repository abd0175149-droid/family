"""Mafia confrontation Reel (Rakan vs Meran) — dialogue-driven edit.

Renders a 1080x1920 Instagram Reel from the source clip: story re-ordered around the
transcribed dialogue, reframed multi-angle look, kinetic Arabic captions on key lines,
VS / CTA motion graphics, synchronized sound design and an original synthesized score.

usage: python3 edit_v3.py SOURCE.mp4 OUT.mp4 ARABIC_FONT.ttf
"""
import os, sys, subprocess, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont
from scipy import signal

SRC, OUT, AFONT = sys.argv[1], sys.argv[2], sys.argv[3]
WORK = os.path.dirname(os.path.abspath(OUT))
FPS, W, H, SW, SH, SR = 30, 1080, 1920, 576, 1024, 44100
LFONT = AFONT
rng = np.random.default_rng(7)
ORANGE = (26, 122, 240)   # BGR
DENIM = (183, 123, 74)
RED = (50, 40, 235)

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

# ---------------------------------------------------------------- transcript (source times)
# Whisper (turbo) transcription, cleaned by hand into Levantine Arabic. Draft — review before publishing.
TRANSCRIPT = [
    (0.30, 2.60, "ميران، من أول اللعبة وإنتِ مركّزة معي"),
    (2.60, 5.50, "وإنتِ أسكت واحدة فينا… وهاد بيعطيني إحساس"),
    (5.85, 9.13, "الغريب إنك من أول اللعبة بتحاول تقنع الكل إني أنا غلطانة"),
    (9.13, 10.80, "قبل حتى ما…"),
    (10.85, 12.82, "هاد دليل إنك…"),
    (12.82, 16.70, "كل جولة بتختاري ضحية جديدة، وبس تطلع بتدوّري على غيرها"),
    (16.80, 21.13, "بس جاوبنا على سؤال واحد: ليش الشخص اللي اخترته بالجولة الماضية…"),
    (21.13, 23.30, "ليش أكتر واحد كان شاكك فيك؟"),
    (23.30, 25.45, "سبحان الله… بعدها طلع! سبحان الله!"),
    (25.50, 29.35, "ملاحظ إنه كلامك كبير… إنتِ مش بس عم بتشكّي فيه"),
    (30.40, 36.20, "على فكرة، أنا ما طلبت من ولا واحد فيهم يصدقني، بس طلبت منك إنت تجاوبني"),
    (37.15, 40.30, "مش معي مواطنين صالحين؟ اسمعوني كلكم"),
    (40.30, 43.50, "هلّأ أنا بس أطلع… لما أطلع مواطن صالح"),
    (43.50, 45.20, "هي المحاسَبة على هالقرار!"),
    (45.70, 49.60, "على فكرة، شفتوا إنه راكان هو الوحيد اللي بدّه يضل قاعد باللعبة"),
    (49.60, 51.60, "وكلنا نطلع؟ هاد لعب مافيا!"),
    (51.60, 52.95, "صدّقوني…"),
    (53.80, 56.70, "ميران، أنا معك… بس فكّري كتير منيح"),
    (56.70, 61.00, "لأنه مش دايمًا الشخص اللي بتوثقي فيه هو اللي بيدلّك عالطريق الصح"),
    (61.20, 64.45, "عفوًا يا راكان، ممكن أكون أنا فعلًا غلطانة"),
    (64.45, 69.65, "بس إنت الوحيد اللي عارف إني أنا الوحيدة بينهم كلهم بقدر أطلّعك"),
    (70.45, 73.96, "بعد ما خلصت المواجهة، احكولي: إنتو مع ميران ولا مع راكان؟"),
    (73.96, 75.30, "أعطونا رأيكم"),
]

# ---------------------------------------------------------------- edit decision list
# v=(in,out) source video; a=audio start if different (L-cut / cutaway); face=(x,y) normalized
# z / z1 zoom start/end; tin transition; punch=[(t,z)]; shake=[(t0,t1,amp)]
# lines/brackets/red/q graphics windows (segment-local s); cap=[(t0,t1,text)]; sfx=[(t,name)]; sec=music section
EDL = [
    # ---------------- HOOK: her strongest accusation, out of context
    dict(v=(50.22, 51.62), face=(0.38, 0.27), z=1.22, z1=1.45, tin="flash", sec="hook",
         shake=[(0.55, 0.85, 8)], red=[(0.0, 1.4)], lines=[(0.55, 1.4)], vig=0.45, flashes=[0.55],
         cap=[(0.0, 1.4, "هاد لعب مافيا!")], sfx=[(0.0, "hit"), (0.55, "impact")]),
    # his silent reaction
    dict(v=(29.45, 30.15), face=(0.55, 0.39), z=1.4, tin="cut", q=[(0.1, 0.7)],
         sfx=[(0.05, "impact_soft"), (0.3, "reverse_vs")]),
    dict(kind="vs", dur=1.15, sfx=[(0.0, "whoosh"), (0.22, "hit"), (0.22, "shing")]),
    # ---------------- SETUP: Rakan opens the accusation
    dict(v=(0.40, 2.65), face=(0.55, 0.40), z=1.05, z1=1.12, tin="zoom", sec="setup", lines=[(0.55, 1.4)],
         sfx=[(0.0, "whoosh_s"), (0.6, "impact")]),
    dict(v=(2.65, 5.23), face=(0.55, 0.40), z=1.32, tin="cut", sfx=[(0.0, "pop")]),
    # Meran's response (timer running on the screen behind her)
    dict(v=(5.85, 8.3), face=(0.43, 0.40), z=1.08, z1=1.14, tin="whip", sfx=[(0.0, "whoosh")]),
    dict(v=(8.3, 10.8), face=(0.45, 0.42), z=1.36, tin="cut", sfx=[(0.0, "pop")]),
    # ---------------- ESCALATION
    dict(v=(10.85, 13.5), face=(0.48, 0.44), z=1.05, tin="whip", sec="escalate", sfx=[(0.0, "whoosh")]),
    dict(v=(13.5, 16.7), face=(0.42, 0.44), z=1.3, tin="cut", brackets=[(1.3, 2.6)],
         shake=[(1.45, 1.75, 6)], sfx=[(0.0, "pop"), (1.45, "impact")]),
    dict(v=(16.8, 19.3), face=(0.45, 0.37), z=1.1, tin="flash", sfx=[(-0.6, "riser06"), (0.0, "hit")]),
    dict(v=(29.45, 30.1), a=19.3, face=(0.56, 0.39), z=1.42, tin="cut", sfx=[(0.05, "impact_soft")]),
    dict(v=(19.95, 21.13), face=(0.45, 0.37), z=1.25, tin="cut"),
    dict(v=(21.13, 23.3), face=(0.40, 0.37), z=1.14, tin="cut", sfx=[(0.0, "pop")]),
    # sarcastic "subhan allah" x2 — comedic accent + double punch-in
    dict(v=(23.3, 25.45), face=(0.37, 0.37), z=1.38, tin="cut", punch=[(1.45, 1.62)],
         cap=[(0.05, 1.3, "سبحان الله!"), (1.45, 2.15, "سبحان الله!")],
         sfx=[(0.05, "ding"), (1.45, "ding2")]),
    # his biggest gesture -> freeze frame
    dict(v=(25.5, 29.35), face=(0.55, 0.39), z=1.1, tin="zoom", punch=[(2.4, 1.38)],
         shake=[(2.4, 2.8, 10)], lines=[(2.4, 3.85)], flashes=[2.4],
         sfx=[(0.0, "whoosh_s"), (2.4, "hit")]),
    dict(kind="freeze", t=28.15, dur=0.75, face=(0.55, 0.36), z=1.3, qm=True, sfx=[(0.0, "freeze")]),
    # Meran: "I only asked YOU to answer me"
    dict(v=(30.4, 33.5), face=(0.52, 0.53), z=1.08, tin="zoom", sfx=[(0.0, "whoosh")]),
    dict(v=(33.5, 36.2), face=(0.52, 0.52), z=1.36, tin="cut", sfx=[(0.0, "pop")]),
    # Rakan: "listen to me all of you... she'll be accountable"
    dict(v=(37.15, 40.3), face=(0.56, 0.42), z=1.06, z1=1.12, tin="whip", sec="tension", sfx=[(0.0, "whoosh")]),
    dict(v=(40.3, 43.5), face=(0.50, 0.42), z=1.3, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(43.5, 45.2), face=(0.52, 0.42), z=1.2, tin="cut", brackets=[(0.1, 1.7)], red=[(0.1, 1.7)],
         cap=[(0.05, 1.7, "هي المحاسَبة على هالقرار!")], sfx=[(0.1, "impact")]),
    # her silent stare (slow motion)
    dict(v=(53.0, 53.5), a=53.2, adur=0.7, speed=0.5, face=(0.40, 0.28), z=1.42, tin="cut",
         q=[(0.15, 1.0)], vig=0.4, sfx=[(0.0, "heartbeat")]),
    # Meran's counter-accusation
    dict(v=(45.7, 48.5), face=(0.38, 0.27), z=1.1, tin="flash", sfx=[(0.0, "hit")]),
    dict(v=(48.5, 50.22), face=(0.37, 0.26), z=1.3, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(50.22, 51.62), face=(0.38, 0.27), z=1.42, tin="cut", red=[(0.0, 1.4)], shake=[(0.55, 0.85, 6)],
         flashes=[0.55], cap=[(0.0, 1.4, "هاد لعب مافيا!")], sfx=[(0.55, "hit")]),
    dict(v=(51.62, 52.95), face=(0.38, 0.27), z=1.16, tin="cut"),
    # ---------------- TURNING POINT: Rakan's warning (callback to the pointing shot)
    dict(v=(53.8, 56.7), face=(0.55, 0.39), z=1.08, tin="zoom", sec="climax", sfx=[(0.0, "whoosh_s")]),
    dict(v=(56.7, 59.55), face=(0.56, 0.38), z=1.3, tin="cut", sfx=[(0.0, "pop")],
         cap=[(0.1, 2.85, "مش دايمًا الشخص اللي بتوثقي فيه…")]),
    dict(v=(59.55, 61.0), face=(0.55, 0.38), z=1.15, z1=1.42, tin="cut", shake=[(0.0, 0.5, 9)],
         lines=[(0.0, 1.45)], red=[(0.0, 1.45)], vig=0.5, sfx=[(0.0, "hit")]),
    # ---------------- PAYOFF: Meran's last word
    dict(v=(61.2, 64.45), face=(0.45, 0.42), z=1.06, tin="flash", sfx=[(-0.6, "riser06"), (0.0, "hit")]),
    dict(v=(64.45, 67.0), face=(0.47, 0.42), z=1.3, tin="cut", sfx=[(0.0, "pop")]),
    dict(v=(67.0, 69.68), face=(0.49, 0.47), z=1.25, z1=1.45, tin="cut", vig=0.5, red=[(1.5, 2.68)],
         cap=[(1.55, 2.68, "أنا الوحيدة اللي بقدر أطلّعك", 1530)], sec="drop",
         sfx=[(0.0, "heartbeat"), (0.85, "heartbeat")]),
    dict(kind="freeze", t=69.55, dur=0.6, face=(0.50, 0.50), z=1.45, qm=False,
         cap="أنا الوحيدة اللي بقدر أطلّعك", sfx=[(0.0, "hit"), (0.0, "shing")]),
    # ---------------- CTA: host asks the audience
    dict(v=(70.45, 75.3), face=(0.45, 0.30), z=1.04, z1=1.14, tin="whip", sec="outro", cta=1.2,
         sfx=[(0.0, "whoosh"), (1.2, "pop"), (4.8, "hit_end")]),
]

for s in EDL:
    s.setdefault("kind", "clip")
    if s["kind"] == "clip":
        s["dur"] = (s["v"][1] - s["v"][0]) / s.get("speed", 1.0)
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
VIG = np.clip((rad - 0.55) / 0.85, 0, 1) ** 1.6
REDM = np.clip((rad - 0.72) / 0.5, 0, 1) ** 1.3

def ease(x):
    x = min(max(x, 0.0), 1.0)
    return 1 - (1 - x) ** 3

def back(x):  # overshoot ease for pops
    x = min(max(x, 0.0), 1.0)
    c = 1.9
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2

def render(img, face, z, dx=0.0, dy=0.0, target=(W / 2, H / 2)):
    s = (W / SW) * z
    cx = min(max(face[0] * SW, target[0] / s), SW - (W - target[0]) / s)
    cy = min(max(face[1] * SH, target[1] / s), SH - (H - target[1]) / s)
    M = np.float32([[s, 0, target[0] - s * cx + dx], [0, s, target[1] - s * cy + dy]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)

def face_out(face, z, target=(W / 2, H / 2)):
    s = (W / SW) * z
    cx = min(max(face[0] * SW, target[0] / s), SW - (W - target[0]) / s)
    cy = min(max(face[1] * SH, target[1] / s), SH - (H - target[1]) / s)
    return target[0] + s * (face[0] * SW - cx), target[1] + s * (face[1] * SH - cy)

def sharpen(f):
    b = cv2.GaussianBlur(f, (0, 0), 1.6)
    return cv2.addWeighted(f, 1.35, b, -0.35, 0)

def lines_overlay(seed):
    r = np.random.default_rng(seed)
    im = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(im)
    cx, cy = W / 2, H * 0.42
    for _ in range(70):
        a = r.uniform(0, 2 * math.pi); w = r.uniform(0.004, 0.014); R0 = r.uniform(0.62, 0.8) * 1100
        d.polygon([(cx + math.cos(a) * R0, cy + math.sin(a) * R0 * 1.25),
                   (cx + math.cos(a - w) * 2400, cy + math.sin(a - w) * 3000),
                   (cx + math.cos(a + w) * 2400, cy + math.sin(a + w) * 3000)], fill=int(r.uniform(90, 170)))
    return np.asarray(im, np.float32)[..., None] / 255.0
LINES = [lines_overlay(i) for i in range(3)]

def text_rgba(txt, size, fill=(255, 255, 255), stroke=0, stroke_fill=(0, 0, 0), font=None):
    f = ImageFont.truetype(font or LFONT, size)
    d0 = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    box = d0.textbbox((0, 0), txt, font=f, stroke_width=stroke)
    w, h = box[2] - box[0] + 40, box[3] - box[1] + 40
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((20 - box[0], 20 - box[1]), txt, font=f, fill=fill + (255,),
                            stroke_width=stroke, stroke_fill=stroke_fill + (255,))
    return np.asarray(im)

def pill_rgba(txt, size, bg_rgb, pad=(44, 18)):
    t = text_rgba(txt, size, font=AFONT)
    h, w = t.shape[:2]
    im = Image.new("RGBA", (w + pad[0] * 2, h + pad[1] * 2), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=im.height // 2,
                                         fill=bg_rgb + (240,))
    im.alpha_composite(Image.fromarray(t), (pad[0], pad[1]))
    return np.asarray(im)

_capcache = {}
def caption_rgba(txt):
    """Bold white Arabic caption with dark stroke + soft shadow, wrapped to 2 lines max."""
    if txt in _capcache:
        return _capcache[txt]
    words, lines, cur = txt.split(" "), [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if len(trial) > 17 and cur:
            lines.append(cur); cur = wd
        else:
            cur = trial
    lines.append(cur)
    imgs = [text_rgba(l, 96, fill=(255, 255, 255), stroke=9, stroke_fill=(12, 12, 16), font=AFONT) for l in lines]
    wmax = max(i.shape[1] for i in imgs); htot = sum(i.shape[0] - 14 for i in imgs)
    im = Image.new("RGBA", (wmax + 30, htot + 40), (0, 0, 0, 0))
    y = 10
    for i in imgs:
        im.alpha_composite(Image.fromarray(i), ((wmax - i.shape[1]) // 2 + 15, y)); y += i.shape[0] - 14
    sh = np.asarray(im).copy()
    shadow = cv2.GaussianBlur(sh[..., 3], (0, 0), 10)
    out = np.zeros_like(sh)
    out[..., 3] = (shadow * 0.55).astype(np.uint8)
    o = Image.fromarray(out); o.alpha_composite(im, (0, 0))
    _capcache[txt] = np.asarray(o)
    return _capcache[txt]

QM = text_rgba("?", 230, stroke=6, stroke_fill=(200, 30, 45))

def paste_rgba(dst, rgba, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0.01 or alpha <= 0.01:
        return
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

def brackets(f, cx, cy, bw, bh, k, color=RED, th=9):
    L = int(min(bw, bh) * 0.22)
    x0, y0, x1, y1 = int(cx - bw / 2), int(cy - bh / 2), int(cx + bw / 2), int(cy + bh / 2)
    for (px, py, sx, sy) in [(x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)]:
        cv2.line(f, (px, py), (px + sx * L, py), color, th, cv2.LINE_AA)
        cv2.line(f, (px, py), (px, py + sy * L), color, th, cv2.LINE_AA)
    if k > 0.5:
        cv2.circle(f, (int(cx), int(cy)), 6, color, -1, cv2.LINE_AA)

def draw_caption(f, txt, tl, t0, t1, y=1390):
    r = tl - t0
    sc = 0.6 + 0.4 * back(r / 0.16)
    a = min(1.0, r / 0.06) * min(1.0, (t1 - tl) / 0.08)
    paste_rgba(f, caption_rgba(txt), W / 2, y, sc, a)

def in_win(wins, tl):
    for w in wins or []:
        if w[0] <= tl < w[1]:
            return (tl - w[0], w[1] - w[0])
    return None

# ---------------------------------------------------------------- VS card + CTA
VS_TXT = text_rgba("VS", 250, stroke=10, stroke_fill=(20, 20, 30))
TITLE = text_rgba("مواجهة", 104, stroke=6, stroke_fill=(20, 20, 30), font=AFONT)
P_RAKAN = pill_rgba("راكان", 76, (240, 122, 26))
P_MERAN = pill_rgba("ميران", 76, (74, 123, 183))

def vs_frames(n):
    top = render(src_frame(1.3), (0.55, 0.40), 1.55, target=(W / 2, 520))
    bot = render(src_frame(22.6), (0.42, 0.37), 1.5, target=(W / 2, 1430))
    mask = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mask, [np.array([[0, 0], [W, 0], [W, 830], [0, 1090]], np.int32)], 255)
    m = mask[..., None] > 0
    out = []
    for i in range(n):
        tt = i / FPS
        k = ease(tt / 0.22)
        offt, offb = int((1 - k) * -W), int((1 - k) * W)
        T = np.roll(top, offt, axis=1); B = np.roll(bot, offb, axis=1)
        if offt < 0: T[:, W + offt:] = 0
        if offb > 0: B[:, :offb] = 0
        f = np.where(m, T, B).astype(np.float32)
        f[..., 2] = np.where(mask > 0, f[..., 2] * 1.05, f[..., 2] * 0.92)
        f[..., 0] = np.where(mask > 0, f[..., 0] * 0.9, f[..., 0])
        f = np.clip(f * (1 - 0.35 * VIG[..., None]), 0, 255).astype(np.uint8)
        if k > 0.98:
            cv2.line(f, (0, 1090), (W, 830), (255, 255, 255), 12, cv2.LINE_AA)
            cv2.line(f, (0, 1100), (W, 840), RED, 5, cv2.LINE_AA)
        if tt >= 0.3:
            kk = back((tt - 0.3) / 0.2)
            paste_rgba(f, P_RAKAN, W - 230 + (1 - kk) * 400, 300, 1.0, min(1, (tt - 0.3) / 0.1))
            paste_rgba(f, P_MERAN, 230 - (1 - kk) * 400, 1640, 1.0, min(1, (tt - 0.3) / 0.1))
        if tt >= 0.2:
            paste_rgba(f, VS_TXT, W / 2, 960, 1.0 + 1.2 * (1 - ease((tt - 0.2) / 0.18)))
            if tt > 0.32:
                paste_rgba(f, TITLE, W / 2, 1160, 1.0, min(1, (tt - 0.32) / 0.12))
        if 0.2 <= tt < 0.3:
            a = 1 - (tt - 0.2) / 0.1
            f = cv2.addWeighted(f, 1 - 0.8 * a, np.full_like(f, 255), 0.8 * a, 0)
        if tt >= 0.22:
            f = np.roll(f, int(8 * max(0, 1 - (tt - 0.22) / 0.3) * math.sin(tt * 90)), axis=1)
        out.append(f)
    return out

CTA_Q = caption_rgba("إنتو مع مين؟")
CTA_VS = text_rgba("VS", 64, stroke=5, stroke_fill=(20, 20, 30))
def draw_cta(f, r):
    """Audience poll card: 'who are you with?' Rakan | Meran — slides up from the bottom."""
    k = back(r / 0.3)
    y = 1450 + (1 - k) * 500
    a = min(1, r / 0.12)
    ov = f.copy()
    cv2.rectangle(ov, (0, int(y - 190)), (W, int(y + 170)), (10, 10, 14), -1)
    cv2.addWeighted(ov, 0.45 * a, f, 1 - 0.45 * a, 0, dst=f)
    paste_rgba(f, CTA_Q, W / 2, y - 95, 1.0, a)
    pulse = 1 + 0.04 * math.sin(r * 7)
    paste_rgba(f, P_RAKAN, W / 2 - 230, y + 70, pulse, a)
    paste_rgba(f, P_MERAN, W / 2 + 230, y + 70, 2 - pulse, a)
    paste_rgba(f, CTA_VS, W / 2, y + 70, 1.0, a)

# ---------------------------------------------------------------- render frames
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24",
                        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
                        "-crf", "14", "-pix_fmt", "yuv420p", os.path.join(WORK, "video_only.mp4")],
                       stdin=subprocess.PIPE)
prev = None
for si, s in enumerate(EDL):
    print(f"seg {si:2d} {s['kind']:6s} start={s['start']:6.2f} dur={s['dur']:.2f}", flush=True)
    if s["kind"] == "vs":
        for f in vs_frames(s["nf"]):
            enc.stdin.write(f.tobytes()); prev = f
        continue
    if s["kind"] == "freeze":
        base = render(src_frame(s["t"]), s["face"], s["z"])
        g = cv2.cvtColor(cv2.cvtColor(base, cv2.COLOR_BGR2GRAY), cv2.COLOR_GRAY2BGR)
        base = cv2.convertScaleAbs(cv2.addWeighted(base, 0.35, g, 0.65, 0), alpha=1.15, beta=-12)
        fx, fy = face_out(s["face"], s["z"])
        for i in range(s["nf"]):
            tt = i / FPS
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 + 0.03 * tt / s["dur"])
            f = cv2.warpAffine(base, M, (W, H), borderMode=cv2.BORDER_REFLECT)
            f = (f.astype(np.float32) * (1 - 0.55 * VIG[..., None])).astype(np.uint8)
            cv2.rectangle(f, (28, 28), (W - 28, H - 28), (255, 255, 255), 6)
            k = ease(tt / 0.15)
            brackets(f, fx, fy, 470 * (1.25 - 0.25 * k), 560 * (1.25 - 0.25 * k), k)
            if s.get("qm"):
                paste_rgba(f, QM, fx + 300, fy - 260, 0.6 + 0.4 * ease(tt / 0.12))
            if s.get("cap"):
                paste_rgba(f, caption_rgba(s["cap"]), W / 2, 1530)
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
        if sp < 1.0:
            fi = st * FPS; a = fi - math.floor(fi)
            img = cv2.addWeighted(src_frame(math.floor(fi) / FPS), 1 - a, src_frame((math.floor(fi) + 1) / FPS), a, 0)
        else:
            img = src_frame(st)
        f = sharpen(render(img, s["face"], z, dx, dy))
        if tin == "whip" and tl < 0.18:
            k = int(60 * (1 - tl / 0.18)) * 2 + 1
            f = cv2.blur(f, (k, 1))
        if tin == "zoom" and tl < 0.15:
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
        for fl in list(s.get("flashes", [])) + ([0.0] if tin == "flash" else []):
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
            paste_rgba(f, QM, min(fx + 280, W - 140), max(fy - 280, 180), sc, min(1, (r[1] - r[0]) / 0.1))
        for c in s.get("cap", []):
            if c[0] <= tl < c[1]:
                draw_caption(f, c[2], tl, c[0], c[1], *(c[3:]))
        if "cta" in s and tl >= s["cta"]:
            draw_cta(f, tl - s["cta"])
        enc.stdin.write(f.tobytes()); prev = f
enc.stdin.close(); enc.wait()

# ---------------------------------------------------------------- dialogue track
N = int(round(TOTAL * SR))
dia = np.zeros((N, 2), np.float32)
amap = []  # (src_a0, src_a1, out_t0) for subtitle mapping
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
    amap.append((a0, a0 + dur, s["start"]))

def wav(path, x):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    "-c:a", "pcm_s16le", path], input=np.clip(x, -1, 1).astype(np.float32).tobytes(), check=True)
wav(os.path.join(WORK, "dialogue_raw.wav"), dia)

# subtitles (SRT) on the output timeline
def ts(x):
    ms = int(round(x * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
subs = []
for (p0, p1, txt) in TRANSCRIPT:
    for (a0, a1, o0) in amap:
        lo, hi = max(p0, a0), min(p1, a1)
        if hi - lo > 0.25:
            o_lo, o_hi = o0 + lo - a0, o0 + hi - a0
            if subs and subs[-1][2] == txt and o_lo - subs[-1][1] < 0.05:
                subs[-1][1] = o_hi
            else:
                subs.append([o_lo, o_hi, txt])
subs.sort(key=lambda x: x[0])
with open(os.path.splitext(OUT)[0] + ".srt", "w", encoding="utf-8") as fh:
    for i, (a, b, txt) in enumerate(subs, 1):
        fh.write(f"{i}\n{ts(a)} --> {ts(b)}\n{txt}\n\n")

# ---------------------------------------------------------------- SFX
def env_exp(n, tau): return np.exp(-np.arange(n) / (tau * SR))
def sweep(f0, f1, dur):
    n = int(dur * SR); tt = np.arange(n) / SR
    fr = f1 + (f0 - f1) * np.exp(-tt * 9 / dur)
    return np.sin(2 * np.pi * np.cumsum(fr) / SR)
def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band"); return signal.lfilter(b, a, x)
def lp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "low"); return signal.lfilter(b, a, x)
def hp(x, f, order=2):
    b, a = signal.butter(order, f / (SR / 2), "high"); return signal.lfilter(b, a, x)
def noise(n): return rng.standard_normal(n)

def sfx_hit():
    n = int(1.1 * SR)
    return (sweep(110, 42, 1.1) * env_exp(n, 0.35) * 0.9 + lp(noise(n), 2500) * env_exp(n, 0.012) * 0.6) * 0.8
def sfx_impact():
    n = int(0.5 * SR)
    return (sweep(140, 60, 0.5) * env_exp(n, 0.12) * 0.7 + lp(noise(n), 1200) * env_exp(n, 0.02) * 0.4) * 0.6
def sfx_pop():
    n = int(0.12 * SR)
    return (sweep(220, 90, 0.12) * env_exp(n, 0.03) * 0.5 + hp(noise(n), 3000) * env_exp(n, 0.006) * 0.15) * 0.45
def sfx_whoosh(dur=0.38, gain=0.5):
    n = int(dur * SR); x = noise(n); out = np.zeros(n); seg = 256
    for k in range(0, n, seg):
        fc = 300 + 3500 * math.sin(math.pi * k / n) ** 2
        out[k:k + seg] = bp(x[max(0, k - 512):k + seg], fc * 0.6, min(fc * 1.6, 18000))[-len(x[k:k + seg]):]
    return out * np.sin(np.pi * np.linspace(0, 1, n)) ** 2 * gain * 3
def sfx_riser(dur):
    n = int(dur * SR); tt = np.linspace(0, 1, n)
    return (np.sin(2 * np.pi * np.cumsum(180 + 700 * tt ** 2) / SR) * 0.25 + hp(noise(n), 1500) * 0.25) * tt ** 2.2 * 0.55
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
    x = np.sin(2 * np.pi * 2100 * tt) + 0.6 * np.sin(2 * np.pi * 3170 * tt) + 0.3 * np.sin(2 * np.pi * 4410 * tt)
    return x * env_exp(n, 0.18) * 0.08 + hp(noise(n), 6000) * env_exp(n, 0.05) * 0.08
def sfx_freeze():
    a, b = sfx_impact(), sfx_shing(); out = np.zeros(max(len(a), len(b)))
    out[:len(a)] += a; out[:len(b)] += b * 1.3; return out
def sfx_ding(f0=1568.0):
    """light comedic 'ding' (glockenspiel-like) for the sarcastic beat"""
    n = int(0.6 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f0 * tt) + 0.35 * np.sin(2 * np.pi * f0 * 2.76 * tt) + 0.15 * np.sin(2 * np.pi * f0 * 5.4 * tt)
    return x * env_exp(n, 0.16) * 0.16
SFX = {
    "hit": sfx_hit, "hit_end": lambda: sfx_hit() * 1.1, "impact": sfx_impact, "impact_soft": lambda: sfx_impact() * 0.55,
    "pop": sfx_pop, "whoosh": sfx_whoosh, "whoosh_s": lambda: sfx_whoosh(0.3, 0.45),
    "riser06": lambda: sfx_riser(0.6), "heartbeat": sfx_heartbeat, "shing": sfx_shing, "freeze": sfx_freeze,
    "ding": sfx_ding, "ding2": lambda: sfx_ding(2093.0), "reverse_vs": sfx_reverse,
}
fx = np.zeros(N + 2 * SR)
for s in EDL:
    for (tl, name) in s.get("sfx", []):
        T = s["start"] + tl
        if name.startswith("whoosh"):
            T -= 0.15
        if name == "reverse_vs":
            T = s["start"] + s["dur"] - 0.7 + 0.22  # reverse swell lands on the VS impact
        x = SFX[name]()
        p = int(max(0, T) * SR); x = x[: len(fx) - p]
        fx[p:p + len(x)] += x
fx = fx[:N]
wav(os.path.join(WORK, "sfx.wav"), np.stack([fx, fx], 1) * 0.9)

# ---------------------------------------------------------------- score: "mafia" tension cue, C minor, 96 BPM
# pizzicato motif (Karplus-Strong), ticking clock, pulse bass, kick, string pad + 16th ostinato in the climax.
BPM = 96; beat = 60 / BPM; e8 = beat / 2; bar = beat * 4
LEN = N + 3 * SR
L = np.zeros(LEN); R = np.zeros(LEN)
sec_t = {s["sec"]: s["start"] for s in EDL if "sec" in s}
vs_end = [s["start"] + s["dur"] for s in EDL if s["kind"] == "vs"][0]

def level(T):
    if T < vs_end: return 0
    if T < sec_t["escalate"]: return 1
    if T < sec_t["climax"]: return 2
    if T < sec_t["drop"]: return 3
    if T < sec_t["outro"]: return -1     # payoff line: music drops out
    return 1

def hz(semi, base=261.63): return base * 2 ** (semi / 12)

def pluck(f, dur=0.45, g=0.993):
    n = int(dur * SR); P = max(2, int(SR / f))
    exc = np.zeros(n); exc[:P] = lp(noise(P), min(6000, f * 8))
    a = np.zeros(P + 2); a[0] = 1; a[P] = -g / 2; a[P + 1] = -g / 2
    y = signal.lfilter([1.0], a, exc)
    y *= np.minimum(1, np.arange(n)[::-1] / (0.03 * SR))
    return y / (np.abs(y).max() + 1e-9)

def add(x, T, gl=1.0, gr=1.0):
    p = int(T * SR)
    if p >= LEN: return
    x = x[: LEN - p]; L[p:p + len(x)] += x * gl; R[p:p + len(x)] += x * gr

MOTIF = [[0, None, 3, None, -5, None, -4, -5], [0, None, 3, None, 7, None, 6, 5],
         [-4, None, 0, None, 3, None, 0, -4], [-1, None, 2, None, -5, None, -1, None]]
ROOTS = [0, 0, -4, -5]                      # Cm Cm Ab G
CHORDS = [[0, 3, 7], [0, 3, 7], [-4, 0, 3], [-5, -1, 2]]
start_music = vs_end - bar / 2              # pickup bar under the VS card
T = start_music; k = 0
while T < TOTAL + 0.5:
    b_i = int((T - start_music) / bar) % 4; e_i = k % 8
    lv = level(T)
    if lv >= 1:
        sem = MOTIF[b_i][e_i]
        if sem is not None:
            pz = pluck(hz(sem), 0.5, 0.992) * 0.20
            add(pz, T, 0.9 if e_i % 4 == 0 else 0.55, 0.55 if e_i % 4 == 0 else 0.9)
            if lv >= 3:
                add(pluck(hz(sem + 12), 0.35, 0.99) * 0.10, T, 0.6, 0.8)
        if e_i % 2 == 0:  # clock tick on every beat
            n = int(0.03 * SR); tk = hp(noise(n), 4000) * env_exp(n, 0.004) * 0.10
            tk += np.sin(2 * np.pi * (2800 if e_i % 4 == 0 else 2300) * np.arange(n) / SR) * env_exp(n, 0.006) * 0.05
            add(tk, T, 0.5, 0.9)
    if lv >= 2:  # pulse bass 8ths
        f0 = hz(ROOTS[b_i] - 24)
        n = int(e8 * SR * 0.9); tt = np.arange(n) / SR
        bs = (np.sin(2 * np.pi * f0 * tt) + 0.3 * np.sign(np.sin(2 * np.pi * f0 * tt))) * np.exp(-tt / 0.14)
        add(lp(bs, 400) * (0.22 if e_i % 2 == 0 else 0.14), T)
        if e_i in (0, 4) or (lv >= 3 and e_i % 2 == 0):  # kick
            n = int(0.3 * SR)
            kick = sweep(150, 45, 0.3) * env_exp(n, 0.08) * 0.42
            add(kick, T)
    if lv >= 3:  # 16th string ostinato
        for h in range(2):
            n = int(e8 / 2 * SR * 0.8); tt = np.arange(n) / SR
            f0 = hz(ROOTS[b_i] - 12)
            saw = signal.sawtooth(2 * np.pi * f0 * tt) + signal.sawtooth(2 * np.pi * f0 * 1.004 * tt)
            add(lp(saw, 1400) * np.exp(-tt / 0.05) * 0.05, T + h * e8 / 2, 0.8, 1.0)
    k += 1; T += e8
# sustained string pad per bar (enters at escalation, swells into climax)
T = start_music; bi = 0
while T < TOTAL + 0.5:
    lv = level(T)
    if lv >= 2 or (lv == 1 and T > sec_t["setup"] + bar):
        n = int(bar * SR); tt = np.arange(n) / SR
        pad = np.zeros(n)
        for semi in CHORDS[bi % 4]:
            for det in (-0.006, 0.0, 0.006):
                pad += signal.sawtooth(2 * np.pi * hz(semi - 12) * (1 + det) * tt + rng.uniform(0, 6))
        pad = lp(pad, 900 if lv < 3 else 1600) * np.minimum(1, tt / 0.8) * np.minimum(1, (bar - tt) / 0.5)
        g = {1: 0.012, 2: 0.02, 3: 0.03}.get(lv, 0.0)
        add(pad * g, T, 1.0, 0.0); add(np.roll(pad, 600) * g, T, 0.0, 1.0)
    bi += 1; T += bar
# deep sub boom on section changes
for name in ("setup", "escalate", "climax"):
    n = int(1.6 * SR); add(sweep(60, 32, 1.6) * env_exp(n, 0.5) * 0.35, sec_t[name])
# reverb (stereo noise IR)
ir_n = int(1.8 * SR)
irL = noise(ir_n) * env_exp(ir_n, 0.45); irR = noise(ir_n) * env_exp(ir_n, 0.45)
irL, irR = lp(irL, 5000) / 60, lp(irR, 5000) / 60
L = L + signal.fftconvolve(L, irL)[:LEN] * 0.5
R = R + signal.fftconvolve(R, irR)[:LEN] * 0.5
mus = np.stack([L, R], 1)[:N]
# gain automation: dips on freeze frames, drop before payoff line, hard stop on the final hit
gain = np.ones(N)
for s in EDL:
    if s["kind"] == "freeze":
        gain[int(s["start"] * SR):int((s["start"] + s["dur"]) * SR)] = 0.12
gain[int(sec_t["drop"] * SR):int(sec_t["outro"] * SR)] *= 0.25
gain[int((TOTAL - 0.02) * SR):] = 0
gain = np.convolve(gain, np.ones(600) / 600, mode="same")
mus *= gain[:, None]
mus = mus / (np.abs(mus).max() + 1e-9) * 0.75
wav(os.path.join(WORK, "music.wav"), mus)

json.dump(dict(total=TOTAL, sections=sec_t, segments=[dict(start=s["start"], dur=s["dur"], kind=s["kind"],
          v=s.get("v")) for s in EDL]), open(os.path.join(WORK, "timeline.json"), "w"), indent=1)

# ---------------------------------------------------------------- mix + final encode
fc = (
    "[1:a]highpass=f=85,afftdn=nf=-28,equalizer=f=3000:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2,"
    "acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,"
    "dynaudnorm=f=150:g=9:p=0.9,asplit=2[dia][key];"
    "[3:a]volume=0.55[mraw];"
    "[mraw][key]sidechaincompress=threshold=0.025:ratio=6:attack=20:release=300:makeup=1[mduck];"
    "[2:a]volume=0.85[sfx];"
    "[dia][mduck][sfx]amix=inputs=3:normalize=0,"
    "alimiter=limit=0.89:attack=3:release=60,loudnorm=I=-14:TP=-1.2:LRA=9[aout]"
)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(WORK, "video_only.mp4"),
                "-i", os.path.join(WORK, "dialogue_raw.wav"), "-i", os.path.join(WORK, "sfx.wav"),
                "-i", os.path.join(WORK, "music.wav"), "-filter_complex", fc,
                "-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
                "-maxrate", "14M", "-bufsize", "28M", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", "30",
                "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", "-shortest", OUT], check=True)
print("done", OUT, flush=True)
