"""从四季图裁出春季人物并抠成透明通道。

关键：这张图里皮肤是留白的，颜色几乎等于米白背景。任何"按颜色判背景"的做法
都会把脸和手一起吃掉。所以改成按「线稿包围」判断：
1) 先取出明显不是背景的像素（线条、衣服、头发）
2) 形态学闭运算封住线稿因抗锯齿产生的细缝
3) binary_fill_holes 把被线条围住的区域全部填成前景 —— 脸和手因此保住
4) 只保留最大连通块（丢掉樱花图标、脚下投影）
5) 边缘按颜色距离羽化，并在 3px 边缘带里反解真实前景色，避免深色底上发白
"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

SRC = "assets/freya-four-seasons-v1.png"
im = Image.open(SRC).convert("RGB")
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape

corners = np.concatenate([a[:24, :24].reshape(-1, 3), a[:24, -24:].reshape(-1, 3),
                          a[-24:, :24].reshape(-1, 3), a[-24:, -24:].reshape(-1, 3)])
bg = np.median(corners, axis=0)
dist = np.sqrt(((a - bg) ** 2).sum(axis=2))

# 1) 明显的前景：线条 / 衣服 / 头发
fg = dist > 26
# 2) 封住线稿的抗锯齿细缝，否则填充会从缝里漏出去
fg = ndimage.binary_closing(fg, np.ones((5, 5)), iterations=2)
# 3) 填充被围住的内部（脸、手、白色衣物）
fg = ndimage.binary_fill_holes(fg)
# 轻微腐蚀回收闭运算多吃的一圈
fg = ndimage.binary_erosion(fg, np.ones((3, 3)), iterations=1)

# 4) 只留最大连通块，顺手丢掉头顶樱花图标和脚下投影
lab, n = ndimage.label(fg)
sizes = ndimage.sum(fg, lab, range(1, n + 1))
order = np.argsort(sizes)[::-1]
print(f"components={n}  top sizes={[int(sizes[i]) for i in order[:6]]}")

# 四个人物 -> 取面积最大的四块，按 x 排序，最左边那个是春
keep = [int(i) + 1 for i in order[:4]]
boxes = ndimage.find_objects(lab)
cols = sorted(((boxes[k - 1][1].start, k) for k in keep))
spring_lab = cols[0][1]
sel = (lab == spring_lab)
print("spring bbox =", boxes[spring_lab - 1])

# 5) 羽化 + 边缘去色污染
ramp = np.clip((dist - 8) / 30, 0, 1)
alpha = np.where(sel, np.maximum(ramp, 0.0), 0.0)
# 内部（远离边界）强制不透明，皮肤不能因为浅色变半透明
inner = ndimage.binary_erosion(sel, np.ones((3, 3)), iterations=2)
alpha = np.where(inner, 1.0, alpha)
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8))
                   .filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255.

# 脚下的投影跟靴子相连，落在最大连通块里躲过了筛选：底部 12% 内凡是接近米白的一律清掉，
# 靴子是深色（dist 大）所以不受影响
ys = np.where(sel.any(axis=1))[0]
y0b, y1b = ys.min(), ys.max()
zone = np.zeros_like(sel)
zone[int(y1b - 0.12 * (y1b - y0b)):, :] = True
alpha[zone & (dist < 78)] = 0.0

band = sel & (~inner) & (alpha > 0.02) & (alpha < 0.90)
A = np.clip(alpha, 0.10, 1)[:, :, None]
fixed = np.clip((a - bg * (1 - A)) / A, 0, 255)
out = np.where(band[:, :, None], fixed, a)

rgba = np.dstack([out.astype(np.uint8), (alpha * 255).astype(np.uint8)])
sp = Image.fromarray(rgba, "RGBA").crop(Image.fromarray(rgba, "RGBA").getbbox())
sp.save("assets/freya-spring-cutout.png")
sp.resize((sp.width // 2, sp.height // 2), Image.LANCZOS).save("assets/freya-spring-cutout@1x.png")
print("size =", sp.size, " opaque ratio =", round(float((np.asarray(sp)[:, :, 3] > 200).mean()), 3))
