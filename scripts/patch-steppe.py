"""Добавляет в Steppe моноширинные цифры (tnum) и типографские пробелы.

В Steppe v0.1 цифры только пропорциональные («1» вдвое уже «0»), поэтому
font-variant-numeric: tabular-nums не работал, а суммы не выравнивались.
Скрипт добавляет zero.tnum…nine.tnum шириной 640 ед. (контуры те же,
отцентрованы), узкий неразрывный пробел U+202F для разрядов, U+2009,
U+2007 и U+00A0. Существующие фичи (salt, case, ordn) сохраняются.

    pip install fonttools brotli
    python scripts/patch-steppe.py Steppe-original.woff2 src/assets/fonts/Steppe.woff2
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString

src, dst = sys.argv[1], sys.argv[2]
TNUM = 640
f = TTFont(src)
if 'zero.tnum' in f.getGlyphOrder():
    sys.exit('Шрифт уже пропатчен: нужен оригинальный файл Steppe.')
cff = f['CFF '].cff
top = cff.topDictIndex[0]
cs = top.CharStrings
gs = f.getGlyphSet()
hm = f['hmtx']
cmap = f.getBestCmap()
order = f.getGlyphOrder()
digits = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

def add_glyph(name, width, draw=None):
    pen = T2CharStringPen(width, gs)
    if draw:
        draw(pen)
    charstring = pen.getCharString(private=top.Private, globalSubrs=cff.GlobalSubrs)
    cs.charStringsIndex.append(charstring)
    cs.charStrings[name] = len(cs.charStringsIndex) - 1
    order.append(name)
    hm.metrics[name] = (width, 0)

from fontTools.pens.boundsPen import BoundsPen
for d in digits:
    bp = BoundsPen(gs); gs[d].draw(bp)
    xmin, _, xmax, _ = bp.bounds
    dx = round((TNUM - (xmax - xmin)) / 2 - xmin)
    add_glyph(d + '.tnum', TNUM, lambda pen, d=d, dx=dx: gs[d].draw(TransformPen(pen, (1, 0, 0, 1, dx, 0))))
    hm.metrics[d + '.tnum'] = (TNUM, round((TNUM - (xmax - xmin)) / 2))

spaces = {0x00A0: ('uni00A0', 260), 0x2007: ('uni2007', TNUM), 0x2009: ('uni2009', 160), 0x202F: ('uni202F', 160)}
for cp, (name, w) in spaces.items():
    if cp not in cmap:
        add_glyph(name, w)
        for t in f['cmap'].tables:
            if t.isUnicode():
                t.cmap[cp] = name

f.setGlyphOrder(order)
top.charset = order  # это тот же список, что и порядок глифов

fea = """
languagesystem DFLT dflt; languagesystem cyrl dflt; languagesystem latn dflt;
feature aalt { feature salt; feature case; } aalt;
feature case { sub acutecomb by acutecomb.case; sub uni0306 by brevecomb.case; sub uni0308 by dieresiscomb.case; } case;
feature ordn { sub N o period by uni2116; } ordn;
feature salt { sub a from [a.salt]; sub l from [l.salt]; sub uni0430 from [aCy.salt]; } salt;
feature tnum { sub [%s] by [%s]; } tnum;
""" % (' '.join(digits), ' '.join(d + '.tnum' for d in digits))
del f['GSUB']
addOpenTypeFeaturesFromString(f, fea, tables=['GSUB'])
f['head'].fontRevision = 0.002
f.flavor = 'woff2'
f.save(dst)
print('saved', dst)
