"""Subset the supplied regular and bold Swei fonts to the game's actual text."""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

source, dest = map(Path, sys.argv[1:3])
strings = set(chr(n) for n in range(32, 127))
data = [Path(sys.argv[3])] if len(sys.argv) > 3 else [
    *[file for file in source.joinpath("public/data").rglob("*.json")
      if file.parent.name != "i18n" or file.name == "zh.json"],
    *source.joinpath("public/assets").glob("zh-*.js")]
for file in [*source.joinpath("src").glob("*.js"), *data]:
    strings.update(file.read_text(encoding="utf-8"))
dest.mkdir(exist_ok=True, parents=True)
for weight in ("Regular", "Bold"):
    # Unchanged text must produce the same hash and reuse the phone's cache.
    font = TTFont(source / ("public/fonts/swei/SweiGothicCJKsc-" + weight + ".ttf"), recalcTimestamp=False)
    sub = subset.Subsetter()
    sub.populate(text="".join(sorted(strings)))
    sub.subset(font)
    font.save(dest / (weight.lower() + ".ttf"))
