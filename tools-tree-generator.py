"""生成"整株植物"级别的 SVG 树资产（非 canvas、非圆点拼贴）。

设计要点：
- 枝干是「锥形填充轮廓」，不是 stroke 线条：每段采样贝塞尔曲线，沿法线偏移出左右两侧再闭合。
- 树冠是「带凹口的有机闭合路径」：半径函数叠加多阶谐波并允许负瓣，产生真实的缺口和团块，
  再分三层色（暗/中/亮）错位叠加做出体积，不是同心半透明圆。
- 外缘散布真实叶片形状，让轮廓读起来是叶子不是色块。
- 根系是镜像向下的同一套锥形轮廓，级数更少、收得更快。
"""
import math, random, json, sys

# ---------- 基础几何 ----------
def qbez(p0, p1, p2, t):
    u = 1 - t
    return (u*u*p0[0] + 2*u*t*p1[0] + t*t*p2[0],
            u*u*p0[1] + 2*u*t*p1[1] + t*t*p2[1])

def qbez_tan(p0, p1, p2, t):
    u = 1 - t
    return (2*u*(p1[0]-p0[0]) + 2*t*(p2[0]-p1[0]),
            2*u*(p1[1]-p0[1]) + 2*t*(p2[1]-p1[1]))

def norm(v):
    m = math.hypot(*v) or 1e-6
    return (v[0]/m, v[1]/m)

def fmt(pts):
    return " ".join(f"{x:.0f},{y:.0f}" for x, y in pts)


def taper_outline(p0, p2, ctrl, w0, w1, samples=16, flare=1.28):
    """把一段曲线变成锥形填充轮廓的多边形点列。"""
    left, right = [], []
    for i in range(samples + 1):
        t = i / samples
        p = qbez(p0, ctrl, p2, t)
        tx, ty = norm(qbez_tan(p0, ctrl, p2, t))
        nx, ny = -ty, tx
        # 宽度：整体线性收，基部 18% 做一个外扩喇叭口，让分叉处长得自然
        w = w0 + (w1 - w0) * (t ** 0.85)
        if t < 0.18:
            w *= 1 + (flare - 1) * (1 - t / 0.18) ** 2
        left.append((p[0] + nx * w / 2, p[1] + ny * w / 2))
        right.append((p[0] - nx * w / 2, p[1] - ny * w / 2))
    return left + right[::-1]


# ---------- 骨架 ----------
class Tree:
    def __init__(self, cfg, seed):
        self.c = cfg
        self.rng = random.Random(seed)
        self.branches = []   # (points, level)
        self.roots = []
        self.tips = []       # (x, y, level, width)

    def grow(self, p, ang, L, w, level, is_root=False):
        c, rng = self.c, self.rng
        maxlv = c["root_levels"] if is_root else c["levels"]
        if level > maxlv or w < 0.9 or L < 4:
            return
        end = (p[0] + math.sin(ang) * L, p[1] - math.cos(ang) * L)
        # 弯曲：枝条向光微微上翘，根系向下外张
        curl = c["curl"] * (1 if not is_root else -0.5)
        mid = ((p[0] + end[0]) / 2, (p[1] + end[1]) / 2)
        px, py = math.cos(ang), math.sin(ang)
        bend = L * curl * rng.uniform(0.6, 1.4) * (1 if rng.random() < .55 else -1)
        ctrl = (mid[0] + px * bend, mid[1] + py * bend)

        w_end = w * rng.uniform(0.58, 0.70)
        poly = taper_outline(p, end, ctrl, w, w_end)
        (self.roots if is_root else self.branches).append((poly, level))

        if level >= maxlv - 1 or w_end < 1.4:
            if not is_root:
                self.tips.append((end[0], end[1], level, w_end))
            return

        n = rng.choice(c["split"])
        # 达芬奇规则：子枝截面积之和 ≈ 母枝，避免上粗下细的塑料感
        w_child = w_end / math.sqrt(n) * rng.uniform(0.95, 1.06)
        spread = c["spread"][min(level, len(c["spread"]) - 1)]
        offs = [(-0.5 + i / (n - 1)) if n > 1 else 0 for i in range(n)]
        rng.shuffle(offs)
        for i, o in enumerate(offs):
            a = ang + o * spread * rng.uniform(0.75, 1.3)
            if is_root:
                a = ang + o * spread * 1.5
            a += rng.uniform(-0.09, 0.09)
            ln = L * c["shrink"] * rng.uniform(0.86, 1.12)
            self.grow(end, a, ln, w_child * rng.uniform(0.9, 1.08), level + 1, is_root)
        # 侧生小枝：打散二分叉的规整感
        if not is_root and level >= 1 and rng.random() < c["twig_p"]:
            t = rng.uniform(0.35, 0.8)
            bp = qbez(p, ctrl, end, t)
            a = ang + rng.choice([-1, 1]) * rng.uniform(0.7, 1.15)
            self.grow(bp, a, L * 0.42, w * 0.34, level + 2, is_root)


# ---------- 树冠 ----------
def blob(cx, cy, r, rng, lobes=(2, 3, 5, 7), squash=1.0, notch=0.40):
    """带凹口的有机闭合路径。允许负瓣 -> 出现真实缺口，不是圆。
    高阶瓣压得很低，否则边缘会出现尖角星形，读起来像枫叶剪纸。"""
    amps = []
    for k in lobes:
        amps.append((k, rng.uniform(0.12, notch) / (k ** 0.9), rng.uniform(0, math.tau)))
    pts = []
    N = 40
    for i in range(N):
        th = i / N * math.tau
        m = 1.0
        for k, a, ph in amps:
            m += a * math.sin(k * th + ph)
        m = max(0.34, m)
        pts.append((cx + math.cos(th) * r * m, cy + math.sin(th) * r * m * squash))
    # 用 Catmull-Rom 转三次贝塞尔，边缘才是软的
    d = f"M{pts[0][0]:.0f},{pts[0][1]:.0f}"
    for i in range(N):
        p0 = pts[(i - 1) % N]; p1 = pts[i]; p2 = pts[(i + 1) % N]; p3 = pts[(i + 2) % N]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]:.0f},{p2[1]:.0f}"
    return d + "Z"


def leaf(x, y, ang, L, W):
    """单片叶：两段对称曲线的柳叶形。"""
    dx, dy = math.sin(ang), -math.cos(ang)
    nx, ny = -dy, dx
    tipx, tipy = x + dx * L, y + dy * L
    return (f"M{x:.0f},{y:.0f}"
            f"Q{x+dx*L*.45+nx*W:.0f},{y+dy*L*.45+ny*W:.0f} {tipx:.0f},{tipy:.0f}"
            f"Q{x+dx*L*.45-nx*W:.0f},{y+dy*L*.45-ny*W:.0f} {x:.0f},{y:.0f}Z")


# ---------- 组装 ----------
def build(variant):
    if variant == "full":
        cfg = dict(levels=7, root_levels=5, split=[2, 2, 3], shrink=0.78, curl=0.16,
                   spread=[0.58, 0.64, 0.72, 0.80, 0.86, 0.92, 0.98], twig_p=0.55)
        VB = (1000, 1400); base = (500, 1000); trunkL, trunkW = 380, 92
        rootN, rootL, rootW = 7, 250, 36
        crown = (500, 460, 340, 285)   # cx, cy, rx, ry 冠层包络
    else:  # up = 仰视
        cfg = dict(levels=7, root_levels=2, split=[2, 3], shrink=0.79, curl=0.20,
                   spread=[0.66, 0.74, 0.82, 0.90, 0.96, 1.02, 1.06], twig_p=0.6)
        VB = (1200, 1060); base = (560, 1080); trunkL, trunkW = 420, 128
        rootN, rootL, rootW = 5, 74, 40
        crown = (580, 400, 470, 320)

    seed = 20260810 if variant == "full" else 771
    T = Tree(cfg, seed)
    rng = T.rng
    T.grow(base, rng.uniform(-.05, .05), trunkL, trunkW, 0)
    for i in range(rootN):
        a = math.pi + (-0.62 + 1.24 * i / (rootN - 1)) * 2.02 + rng.uniform(-.12, .12)
        T.grow(base, a, rootL * rng.uniform(.7, 1.25), rootW * rng.uniform(.6, 1.05), 1, True)

    # 冠层包络：按实际枝梢反算，保证覆盖整个骨架，不会出现半边裸枝
    tips = list(T.tips)
    xs = sorted(t[0] for t in tips); ys = sorted(t[1] for t in tips)
    q = lambda a, p: a[max(0, min(len(a)-1, int(len(a)*p)))]
    cx = (q(xs, .5)); cy = (q(ys, .5))
    rx = max(q(xs, .97) - cx, cx - q(xs, .03)) * 1.02
    ry = max(q(ys, .97) - cy, cy - q(ys, .03)) * 1.06
    crown = (cx, cy, rx, ry)

    # ---- 树冠剪影：由枝梢点云反算的单一有机轮廓，不是团块拼贴 ----
    NB = 108
    rad = [0.0] * NB
    for x, y, lv, w in tips:
        dx, dy = x - cx, y - cy
        th = math.atan2(dy, dx) % math.tau
        d = math.hypot(dx, dy)
        b = int(th / math.tau * NB) % NB
        # 枝梢外再留一圈叶子，冠幅才不会紧贴枝头
        rad[b] = max(rad[b], d + rng.uniform(46, 76))
    # 空角度用邻居补，再做两轮环形平滑 -> 轮廓连续但不规则
    for i in range(NB):
        if rad[i] == 0:
            nb = [rad[(i + k) % NB] for k in range(-6, 7) if rad[(i + k) % NB] > 0]
            rad[i] = (sum(nb) / len(nb)) * rng.uniform(.80, .96) if nb else 60
    for _ in range(5):
        rad = [(rad[(i-1) % NB] + 2*rad[i] + rad[(i+1) % NB]) / 4 for i in range(NB)]
    # 和一个饱满的椭圆包络混合：纯枝梢半径会出现尖峰，读起来像一片大叶子而不是树冠
    R = max(rad)
    ell = [R * (0.80 + 0.20 * abs(math.sin(i / NB * math.tau))) for i in range(NB)]
    rad = [0.55 * rad[i] + 0.45 * ell[i] for i in range(NB)]
    rad = [max(r, R * 0.62) for r in rad]
    # 冠底向下压，盖住上段枝干 —— 否则树冠会悬空，跟树干断开
    for i in range(NB):
        th = i / NB * math.tau
        if math.sin(th) > 0:
            rad[i] *= 1 + 0.20 * math.sin(th)

    def silhouette(scale, dx, dy, serr=1.0, seed_off=0):
        """把半径表转成闭合路径。serr 控制叶状细齿的幅度。"""
        r2 = random.Random(seed ^ (seed_off * 7919))
        pts = []
        for i in range(NB):
            th = i / NB * math.tau
            # 叶状细齿：高频、低幅 —— 幅度大了就变成星形剪纸
            n = 1 + serr * 0.35 * (0.055 * math.sin(i * 5 + seed_off) +
                                   0.042 * math.sin(i * 9 + seed_off * 2) +
                                   r2.uniform(-.035, .035))
            rr = rad[i] * scale * n
            pts.append((cx + dx + math.cos(th) * rr, cy + dy + math.sin(th) * rr))
        d = f"M{pts[0][0]:.0f},{pts[0][1]:.0f}"
        for i in range(NB):
            p0 = pts[(i-1) % NB]; p1 = pts[i]; p2 = pts[(i+1) % NB]; p3 = pts[(i+2) % NB]
            c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
            c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
            d += f"C{c1[0]:.0f},{c1[1]:.0f} {c2[0]:.0f},{c2[1]:.0f} {p2[0]:.0f},{p2[1]:.0f}"
        return d + "Z"

    def holes(n, rmin, rmax, band=(.28, .82)):
        """叶隙：evenodd 挖空，枝条从缝里透出来"""
        out = []
        for _ in range(n):
            th = rng.uniform(0, math.tau)
            f = rng.uniform(*band)
            b = int(th / math.tau * NB) % NB
            hx = cx + math.cos(th) * rad[b] * f
            hy = cy + math.sin(th) * rad[b] * f
            out.append(blob(hx, hy, rng.uniform(rmin, rmax), rng,
                            lobes=(2, 3, 5), squash=rng.uniform(.5, .9), notch=.46))
        return " ".join(out)

    layers = [
        silhouette(1.00,  4,  6, 1.0, 1) + " " + holes(3, 26, 46, (.55, .88)),
        silhouette(0.90, -6, -8, 1.1, 2) + " " + holes(6, 30, 58),
        silhouette(0.74, -16, -22, 1.2, 3) + " " + holes(7, 26, 52),
        silhouette(0.52, -26, -34, 1.3, 4) + " " + holes(5, 22, 44),
    ]
    masses = [(cx, cy, max(rad))]

    # 叶片：沿剪影外缘散布，让边缘读起来是叶子而不是色块边
    leaves = []
    for i in range(0, NB, 2):
        th = i / NB * math.tau
        for _ in range(rng.randint(1, 3)):
            rr = rad[i] * rng.uniform(.90, 1.06)
            x = cx + math.cos(th) * rr + rng.uniform(-10, 10)
            y = cy + math.sin(th) * rr + rng.uniform(-10, 10)
            leaves.append(leaf(x, y, th + rng.uniform(-.7, .7),
                               rng.uniform(18, 30), rng.uniform(5, 8.5)))

    # 包围盒：树是递归长出来的，长多高事先不知道，viewBox 必须反算，否则会被切平
    X = [p[0] for poly, _ in T.branches + T.roots for p in poly]
    Y = [p[1] for poly, _ in T.branches + T.roots for p in poly]
    X += [cx + s * max(rad) * 1.08 for s in (-1, 1)]
    Y += [cy + s * max(rad) * 1.08 for s in (-1, 1)]
    x0, x1, y0, y1 = min(X), max(X), min(Y), max(Y)
    pad = 40
    # 顶部不在 SVG 里切 —— 硬直边很丑。仰视要溢出交给 HTML 容器 overflow 裁。
    vb = (x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad)

    # 四个项目要挂在真实的枝条/根须上，所以把锚点也导出去
    def pct(px, py):
        return [round((px - vb[0]) / vb[2] * 100, 2), round((py - vb[1]) / vb[3] * 100, 2)]

    # 枝梢锚点：按绕冠心的角度扇区取，四个项目在树冠上左右和上下都拉得开。
    # full 取整圈（标本页要往两侧引线），up 是仰视，只取下半圈 —— 果实长在冠的下缘才看得见。
    a_lo, a_hi = (math.pi * 0.62, math.pi * 2.38) if variant == "full" else (0.10, math.pi - 0.10)
    picks = []
    for i in range(4):
        s0 = a_lo + (a_hi - a_lo) * i / 4
        s1 = a_lo + (a_hi - a_lo) * (i + 1) / 4
        grp = []
        for t in T.tips:
            th = math.atan2(t[1] - cy, t[0] - cx) % math.tau
            if s0 % math.tau <= th <= s1 % math.tau or (s0 % math.tau > s1 % math.tau and
                                                        (th >= s0 % math.tau or th <= s1 % math.tau)):
                grp.append(t)
        grp = grp or T.tips
        picks.append(max(grp, key=lambda t: math.hypot(t[0] - cx, t[1] - cy)))
    branch_anchors = [pct(p[0], p[1]) for p in picks]

    # 根须锚点：取最深的 4 个根端
    # 按横向分四段，每段取最深的一条根须末端 —— 保证四个项目左右拉开、深浅错落，
    # 否则标签会挤在同一条水平线上互相压字
    rend = [(poly[len(poly)//2][0], poly[len(poly)//2][1]) for poly, lv in T.roots if lv >= 3]
    root_anchors = []
    if rend:
        xs2 = sorted(p[0] for p in rend)
        lo, hi = xs2[0], xs2[-1]
        for i in range(4):
            a0 = lo + (hi - lo) * i / 4
            a1 = lo + (hi - lo) * (i + 1) / 4
            grp = sorted([p for p in rend if a0 <= p[0] <= a1] or rend, key=lambda p: p[1])
            # 每段取不同深度分位，四个块茎才会深浅错落，标签不会挤在同一条水平线上
            k = int(len(grp) * (0.97 - 0.22 * (i % 3)))
            root_anchors.append(pct(*grp[max(0, min(len(grp) - 1, k))]))

    return dict(vb=vb, branches=T.branches, roots=T.roots, masses=masses,
                layers=layers, leaves=leaves, tips=tips, base=base, crown=crown,
                anchors=dict(branch=branch_anchors, root=root_anchors,
                             trunk=pct(base[0], base[1])))


PAL = dict(bark_d="#5C4B3A", bark_m="#7C6A55", bark_l="#9A8770",
           g_dark="#5F8250", g_mid="#8CAC69", g_lite="#B5CE8C", g_glow="#D8E5BA")


def svg(D, variant):
    VX, VY, W, H = [round(v) for v in D["vb"]]
    P = PAL
    # 粗枝垫在叶子后面，细枝（level>=3）再画一遍压在暗叶层上 —— 枝条穿插进叶团
    br = " ".join(f"M{fmt(p)}Z" for p, lv in D["branches"])
    twig = " ".join(f"M{fmt(p)}Z" for p, lv in D["branches"] if lv >= 3)
    ro = " ".join(f"M{fmt(p)}Z" for p, lv in D["roots"])
    lf = " ".join(D["leaves"])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VX} {VY} {W} {H}" width="{W}" height="{H}">
<defs>
  <filter id="wc" x="-12%" y="-12%" width="124%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.013 0.019" numOctaves="4" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="17" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="wc2" x="-12%" y="-12%" width="124%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.021 0.016" numOctaves="3" seed="23" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="12" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <filter id="barkf" x="-8%" y="-8%" width="116%" height="116%">
    <feTurbulence type="fractalNoise" baseFrequency="0.04 0.008" numOctaves="3" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  <linearGradient id="bark" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="{P['bark_d']}"/><stop offset=".42" stop-color="{P['bark_m']}"/>
    <stop offset=".72" stop-color="{P['bark_l']}"/><stop offset="1" stop-color="{P['bark_d']}"/>
  </linearGradient>
  <radialGradient id="gd" cx=".42" cy=".34" r=".78">
    <stop offset="0" stop-color="{P['g_mid']}"/><stop offset="1" stop-color="{P['g_dark']}"/>
  </radialGradient>
  <radialGradient id="gm" cx=".40" cy=".30" r=".76">
    <stop offset="0" stop-color="{P['g_lite']}"/><stop offset="1" stop-color="{P['g_mid']}"/>
  </radialGradient>
  <radialGradient id="gl" cx=".38" cy=".28" r=".74">
    <stop offset="0" stop-color="{P['g_glow']}"/><stop offset="1" stop-color="{P['g_lite']}"/>
  </radialGradient>
</defs>
<g id="roots" filter="url(#barkf)" opacity=".86"><path d="{ro}" fill="url(#bark)"/></g>
<g id="branches" filter="url(#barkf)"><path d="{br}" fill="url(#bark)"/></g>
<g id="crown">
  <!-- 层1 暗：整片剪影垫在枝后，evenodd 挖出的洞让枝条透出来 -->
  <g filter="url(#wc)">
    <path d="{D['layers'][0]}" fill="url(#gd)" fill-rule="evenodd" opacity="1"/>
    <path d="{D['layers'][0]}" fill="none" stroke="{P['g_dark']}" stroke-width="3.5" opacity=".45"/>
  </g>
  <!-- 细枝再画一遍：从叶隙里穿出来，这是"看得见生命结构"的关键 -->
  <g filter="url(#barkf)" opacity=".62"><path d="{twig}" fill="{P['bark_d']}"/></g>
  <!-- 层2 中 + 边缘沉积描边（水彩的边比中心深） -->
  <g filter="url(#wc)">
    <path d="{D['layers'][1]}" fill="url(#gm)" fill-rule="evenodd" opacity=".74"/>
    <path d="{D['layers'][1]}" fill="none" stroke="{P['g_mid']}" stroke-width="2.5" opacity=".5"/>
  </g>
  <!-- 层3 浅 -->
  <g filter="url(#wc2)">
    <path d="{D['layers'][2]}" fill="url(#gl)" fill-rule="evenodd" opacity=".5"/>
    <path d="{D['layers'][2]}" fill="none" stroke="{P['g_lite']}" stroke-width="2" opacity=".45"/>
  </g>
  <!-- 层4 高光：左上受光 -->
  <g filter="url(#wc2)"><path d="{D['layers'][3]}" fill="{P['g_glow']}" fill-rule="evenodd" opacity=".38"/></g>
  <g id="leaves" opacity=".42"><path d="{lf}" fill="{P['g_dark']}"/></g>
</g>
</svg>'''


if __name__ == "__main__":
    out = {}
    for v in ("full", "up"):
        D = build(v)
        open(f"assets/tree-spring-{v}.svg", "w").write(svg(D, v))
        out[v] = dict(anchors=D["anchors"], vb=[round(q) for q in D["vb"]], base=D["base"], crown=D["crown"],
                      n_branch=len(D["branches"]), n_root=len(D["roots"]),
                      n_mass=len(D["masses"]), n_leaf=len(D["leaves"]),
                      tips=[[round(t[0]), round(t[1])] for t in D["tips"][:40]])
    print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != "tips"} for k, v in out.items()}, ensure_ascii=False))
