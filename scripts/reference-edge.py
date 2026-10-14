#!/usr/bin/env python3
"""Create a reference-only 2% detail edge crop; never overwrite source artwork."""
import argparse
from pathlib import Path
from PIL import Image,ImageOps
p=argparse.ArgumentParser(description=__doc__);p.add_argument("source",type=Path);p.add_argument("output",type=Path);p.add_argument("--edge",choices=["top","bottom"],default="bottom");a=p.parse_args()
if a.output.exists() or a.source.resolve()==a.output.resolve():p.error("Output must be a new reference file")
with Image.open(a.source) as original:
 im=ImageOps.exif_transpose(original);h=max(1,__import__("math").ceil(im.height*.02));y=0 if a.edge=="top" else im.height-h
 crop=im.crop((0,y,im.width,y+h))
 if crop.width>1080:crop=crop.resize((1080,max(1,round(crop.height*1080/crop.width))))
 a.output.parent.mkdir(parents=True,exist_ok=True);crop.save(a.output,"PNG")
print(str(a.output.resolve()))
