# 3D sprite lab (preview only, not used by the game yet)

Builds every character, enemy, boss and weapon as a small three.js model and renders it to pixel-art
sprite sheets (5 passes: albedo, light with shadows, normals, depth, part ids → banded hue-shifted
shading, rim light, metal glints, inner contour lines, coloured outline).

    PLAYWRIGHT=$(npm root -g)/playwright node deck/tools/sprite3d/run.js [id ...]   # -> out/<id>.png + .json
    python3 deck/tools/sprite3d/peek.py preview.png wizard elf_m --move walk --all

Files: core.js (renderer and shading), kit.js (humanoid kit and moves), weapons.js (weapon models and
the game's 21 weapons), players.js, enemies.js, bosses.js, items.js (rosters), sheet.js (sheet layout).
