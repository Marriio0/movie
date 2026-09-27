import re

test_path = "/Users/redaoizghiti/Desktop/movie-main/frontend/src/features/catalog/components/WatchPlayer.test.tsx"
with open(test_path, "r", encoding="utf-8") as f:
    test_content = f.read()

test_content = test_content.replace('/Servers (1-5)/i', '/Servers \\(1-5\\)/i')

with open(test_path, "w", encoding="utf-8") as f:
    f.write(test_content)
