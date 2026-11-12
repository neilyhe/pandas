#!/usr/bin/env python3
# 生成公众号引导图（二维码 + 文案），输出 webapp/assets/share-qr.png
import io
import segno
from PIL import Image, ImageDraw, ImageFont

URL = "https://panda-circle-19851.app.workbuddy.host/?sharecode=ZNBPRJVHAH"
OUT = "/Users/heyu/WorkBuddy/熊猫动态圈/webapp/assets/share-qr.png"

FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"
FONT_REG = "/System/Library/Fonts/Hiragino Sans GB.ttc"

W = H = 1080
INK = (26, 30, 40)
INK2 = (110, 122, 140)
BG1 = (238, 241, 247)
BG2 = (246, 240, 246)


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size, index=0)


def vgrad(w, h, c1, c2):
    base = Image.new("RGB", (1, h))
    d = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(1, h - 1)
        d.point((0, y), tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3)))
    return base.resize((w, h), Image.BICUBIC)


# 二维码（深色圆点风格更柔和）
qr = segno.make(URL, error="h", micro=False)
n = qr.symbol_size(scale=1, border=0)[0]          # 模块数
K = max(1, round(470 / n))                        # 每个模块的整像素边长，避免插值
QS = n * K
buf = io.BytesIO()
qr.save(buf, kind="png", scale=K, border=0, dark="#171a21", light=None)
buf.seek(0)
qimg = Image.open(buf).convert("RGBA")
print("modules", n, "px/module", K, "qr", QS)

canvas = vgrad(W, H, BG1, BG2).convert("RGBA")
d = ImageDraw.Draw(canvas)

# 白色圆角卡片
card = (64, 72, W - 64, H - 72)
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle(
    (card[0] + 6, card[1] + 14, card[2] + 6, card[3] + 14), 56, fill=(30, 42, 68, 34)
)
canvas.alpha_composite(shadow)
d.rounded_rectangle(card, 56, fill=(255, 255, 255, 244))

# 顶部小标签
tag = "熊猫动态圈"
d.rounded_rectangle((108, 128, 108 + 214, 128 + 52), 26, fill=(238, 242, 252, 255))
d.text((108 + 107, 128 + 26), tag, font=font(26), fill=(46, 92, 200), anchor="mm")

# 标题 / 副标题
d.text((110, 214), "每天看滚滚的新鲜事", font=font(58, True), fill=INK, anchor="lm")
d.text((110, 292), "熊猫动态 · 图鉴 · 圈子里聊国宝", font=font(30), fill=INK2, anchor="lm")

# 二维码白底 + 细边
qx, qy = (W - QS) // 2, 330
d.rounded_rectangle((qx - 22, qy - 22, qx + QS + 22, qy + QS + 22), 30, fill=(255, 255, 255, 255),
                    outline=(226, 232, 244, 255), width=2)
canvas.alpha_composite(qimg, (qx, qy))

# 底部提示
d.text((W // 2, qy + QS + 72), "长按识别二维码 · 进入熊猫动态圈", font=font(30, True), fill=INK, anchor="mm")
d.text((W // 2, qy + QS + 118), "手机微信扫码也能直接打开", font=font(24), fill=INK2, anchor="mm")

canvas.convert("RGB").save(OUT, quality=95)
print("saved", OUT, canvas.size)
