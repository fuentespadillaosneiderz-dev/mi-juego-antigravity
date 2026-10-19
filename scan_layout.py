from PIL import Image

im = Image.open('assets/media_1791976681572.jpg').convert('RGB')
w, h = im.size

# Search button border: it is a rounded rectangle around center
# Let's find horizontal lines or bounding box of the PLAY GAME button
# Button has green border around x in [310, 715], y in [370, 465]
# Let's find exact coordinates
candidates_x = []
candidates_y = []
for y in range(350, 480):
    for x in range(300, 750):
        r, g, b = im.getpixel((x, y))
        # Button border is dark greenish/cyan
        if 40 < g < 160 and r < 60 and 40 < b < 140:
            # could be button border
            pass

# Let's find eye clusters:
# Eye colors:
# Green: g > 150, r < 80
# Red: r > 150, g < 60, b < 60
# Yellow: r > 160, g > 130, b < 60
# Teal (evil smile): r < 50, g > 140, b > 140
eyes = []
visited = set()

for y in range(180, 520):
    for x in range(20, w - 20):
        # Ignore button region
        if 310 <= x <= 714 and 365 <= y <= 470:
            continue
        r, g, b = im.getpixel((x, y))
        is_eye = False
        color_type = None
        if r > 160 and g < 70 and b < 70:
            is_eye = True
            color_type = 'red'
        elif g > 150 and r < 80 and b < 100:
            is_eye = True
            color_type = 'green'
        elif r > 170 and g > 130 and b < 70:
            is_eye = True
            color_type = 'yellow'
        elif r < 60 and g > 120 and b > 120:
            is_eye = True
            color_type = 'cyan'
        
        if is_eye and (x, y) not in visited:
            # Flood fill cluster
            cluster = []
            queue = [(x, y)]
            visited.add((x, y))
            while queue:
                cx, cy = queue.pop(0)
                cluster.append((cx, cy))
                for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                        cr, cg, cb = im.getpixel((nx, ny))
                        match = False
                        if color_type == 'red' and cr > 120 and cg < 90 and cb < 90: match = True
                        elif color_type == 'green' and cg > 120 and cr < 90: match = True
                        elif color_type == 'yellow' and cr > 130 and cg > 100 and cb < 90: match = True
                        elif color_type == 'cyan' and cr < 80 and cg > 90 and cb > 90: match = True
                        if match:
                            visited.add((nx, ny))
                            queue.append((nx, ny))
            if len(cluster) >= 8:
                avg_x = sum(pt[0] for pt in cluster) / len(cluster)
                avg_y = sum(pt[1] for pt in cluster) / len(cluster)
                eyes.append((round(avg_x, 1), round(avg_y, 1), color_type, len(cluster)))

print(f"Total eye points found: {len(eyes)}")
for e in sorted(eyes, key=lambda pt: (pt[1], pt[0])):
    print(f"x: {e[0]}, y: {e[1]}, color: {e[2]}, size: {e[3]}")
