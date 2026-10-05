# Hexmancers Sprite Workshop

Open `sprites/index.html` through a static web server, or use the Sprite Workshop link on the game's title screen. No build or dependencies required.

Import PNG sheets, choose a frame size (128×128 by default), row, starting column, frame count, and FPS. Preview animations with nearest-neighbor pixels, step through frames, and download an individual frame or the original sheet. Each sheet has a name, category, animation label, review status, and notes.

Imports and saved reviews persist in IndexedDB in the current browser and origin. Use **Save review** after changing metadata. Export/restore JSON backups to move sheets and notes between machines. Backups contain the original PNG data. Importing here does not upload files to GitHub or replace the game's procedural 3D characters. Approved status records your review; it does not automatically integrate a sheet into gameplay.

Recommended repository asset folders as assets are approved: `characters/`, `enemies/`, `bosses/`, `weapons/`, and `vfx/`. Keep source sheets as lossless PNGs and document animation rows alongside them. Labels occupying sheet rows must be excluded using the row selector.
