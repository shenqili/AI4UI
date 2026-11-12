# 素材生成提示词

以下为本期实际使用的素材提示词。运行所需的处理后图片已随工程提供，无需重新生成。原始大图和过程拼图未收录。

## Batch A (textures) suffix T
Use your built-in image generation tool to create 5 separate images (one tool call each). After each is generated, copy it from ~/.codex/generated_images/ into film/assets/_raw/ with the exact filename given (do NOT resize; just copy). Finally report the filename and the pixel size of each.
Common suffix for ALL five: "seamless tileable texture, flat even lighting, no vignette, no text, no objects, square 1:1, edge-to-edge, top-down macro, the pattern continues identically across all four edges".
1. raw_wood_walnut.png : straight-grain dark walnut wood veneer, horizontal grain, rich brown (#5A3A22 range), subtle fine pores, no knots, no big features.
2. raw_brass_brushed.png : fine horizontal brushed brass metal surface, warm gold (#C9A227 to #B08D57), subtle micro scratches, no big reflections or hotspots.
3. raw_paper_fiber.png : near-white warm cream paper (#F4EDDC) with faint organic cellulose fibers, very low contrast.
4. raw_sand_grain.png : fine sand grain, GRAYSCALE only, mid-gray with small light/dark speckles, evenly distributed, low contrast.
5. raw_linen.png : natural linen cloth weave, beige (#D8CDB8), visible slub threads, soft, even.

## Batch B (plates/illustrations) suffix P
Use your built-in image generation tool to create 5 separate images (one tool call each). After each is generated, copy it from ~/.codex/generated_images/ into film/assets/_raw/ with the exact filename given (do NOT resize; just copy). Finally report the filename and pixel size of each.
Common suffix for ALL: "clean studio illustration, soft gradients, no text, no people, no logos, no borders, flat matte painterly finish" (except image 4 which is photographic).
1. raw_fan_ink.png : landscape format. Chinese ink-wash (shuimo) painting on warm rice paper (#F0E6D2), light diluted ink in deep blue-black (#1B2F5B). ONE tall main mountain peak exactly at horizontal center, with two lower distant mountain ranges fading left and right in mist, generous empty paper space (xuan paper white) around, peak reaches to upper-middle. Fills the whole frame edge to edge, no seal, no calligraphy, no frame.
2. raw_room_pixel.png : very wide panoramic pixel art (chunky visible square pixels, limited warm palette, 16-bit style) of a cozy living room interior in warm afternoon sunlight. Left: a big floor speaker cabinet with a large flat circular cone area, then a bookshelf, a window with sunlight, a sofa, a rug on wooden floor. NO characters, no people, no text. Side view orthographic like a game scene. Colors: floor/wall #F2D9B8 and #C9A27A.
3. raw_sky_morning.png : 16:9 illustration of a morning sky with layered stratus clouds, pale blue (#9BC4E8) at top to peach (#F7D4B5) near the horizon, NO sun, no ground, no birds, soft gradients.
4. raw_landscape_color.png : 16:9 photorealistic photograph: under a stone arch bridge, autumn red-orange Virginia creeper vines climbing the stone, reflected in a calm canal; upper half red-orange foliage (#D9452B), lower half teal-green water (#2F7F86); no people, no text.
5. raw_night_garden.png : 16:9 illustration of a night garden with out-of-focus bokeh leaves, nearly black with deep blue-green tint (#0E1A2B, leaves #1E3A2F), very dark overall, no light sources, no fireflies, no people.

## Post-process (tools/prep_assets.js -> prep_assets.py)
Tiles: resize to spec; if wrap-seam ratio >1.4, offset cross-fade (cosine window blend with half-shifted copy) for true seamlessness; sand to grayscale. Plates: cover-crop to 1920x1080. Room: cover-crop 1500x420, BOX-downscale to 375x105, 48-colour quantize, 4x nearest (grid verified). Fan: painting scaled to 2400 wide, cropped at y=180, masked by annular sector (pivot 1200,1250; r 420..1200; +-75 deg; 4x supersampled alpha); _fan_ref.png overlays the geometry. No retries were needed.
