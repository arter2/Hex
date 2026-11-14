START HERE: CLAUDE_INTEGRATION.md
Exact asset placement/bindings: asset-map.json
Shader and material settings: INSTRUCTIONS.md

HEXMANCERS - PAINTERLY TEXTURES

68 individual PNG assets, all exactly 512 x 512.
18 area floors, 18 area walls, 10 theme floors, 10 theme normals,
10 shared assets/effects, 1 grayscale rock noise, 1 medium-rock RGBA overlay.

Read INSTRUCTIONS.md for the current material map, import settings,
independent rock overlay shader setup, UV offsets, pass weights and noise use.

All texture boundaries have been checked in both axes.
The nine visual effects and separate medium-rock layer use real transparency.
Normal maps and grayscale noise are linear data; colored textures use sRGB.
Normal convention is OpenGL / +Y.

previews/ contains only current assets and illustrative layering composites.
repeat-checks/ shows tiled textures and the three-pass rock-layer composite.
asset-checks.csv records dimensions, boundary checks and SHA-256 hashes.

Art was repainted from the supplied references using image generation, then
exported with matched repeat boundaries. Theme normals are approximate
height-derived companions, not geometry bakes.
