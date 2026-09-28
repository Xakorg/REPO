import os

src_dir = r"C:\Users\ridwa\Documents\Github\repo\Voltramax"
results = []
for root, dirs, files in os.walk(src_dir):
    for f in files:
        if f.endswith(('.c', '.cpp', '.h', '.qml', '.py', '.js', '.json', '.md', '.toml', '.ld', '.cfg')):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as fh:
                    lines = sum(1 for _ in fh)
                size = os.path.getsize(filepath)
                results.append((filepath, lines, size))
            except:
                pass

results.sort(key=lambda x: x[1])
print(f"Total files: {len(results)}")
small = [r for r in results if r[1] < 50]
print(f"\nUnder 50 lines ({len(small)}):")
for path, lines, size in small[:20]:
    print(f"  {lines:>3} lines | {path}")
print("...")
over300 = [r for r in results if r[1] >= 300]
print(f"\nOver 300 lines ({len(over300)}):")
for path, lines, size in over300:
    print(f"  {lines:>4} lines | {path}")
under100 = [r for r in results if r[1] < 100]
print(f"\nUnder 100 lines ({len(under100)}):")
for path, lines, size in under100[:15]:
    print(f"  {lines:>3} lines | {path}")
print("...")
