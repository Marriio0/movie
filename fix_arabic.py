import re

file_path = "/Users/redaoizghiti/Desktop/movie-main/frontend/src/features/catalog/components/WatchPlayer.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

def repl(old, new):
    global content
    content = content.replace(old, new)

# Cleanup WatchPlayer.tsx
repl('title={`تحميل ملف الترجمة (${currentSubLangObj.nativeName}) المزامنة (.SRT)`}', 'title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}')
repl('title={`تحميل ملف الترجمة (${currentSubLangObj.nativeName}) .SRT لجهازك`}', 'title={`Download subtitle (${currentSubLangObj.nativeName}) .SRT`}')
repl('<span>تحميل ملف Subs ({currentSubLangObj.nativeName}) (.SRT)</span>', '<span>Download {currentSubLangObj.nativeName} Subtitles (.SRT)</span>')
repl('سيرفرات Ad-Free 4K فائقة السرعة (قيد التجهيز والتطوير • En cours)', 'Premium Ad-Free Servers (Coming Soon)')
repl('حفظ', 'Save')
repl('جاري فحص وتجهيز Premium ad-free server...', 'Searching for premium streams...')
repl('يمكنك استخدام Standard Player (سيرفر 1 أو 2) لمشاهدة الفيلم مباشرة بجودة عالية وبدون إعلانات.', 'You can use the standard player (Server 1 or 2) to watch in high quality.')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

test_path = "/Users/redaoizghiti/Desktop/movie-main/frontend/src/features/catalog/components/WatchPlayer.test.tsx"
with open(test_path, "r", encoding="utf-8") as f:
    test_content = f.read()

test_content = test_content.replace('Torrentio 4K (بدون إعلانات)', 'Premium (No Ads)')
test_content = test_content.replace('سيرفرات بديلة', 'Servers (1-5)')
test_content = test_content.replace('سيرفرات تورنتيو فائقة الجودة', 'Premium Servers (4K / 1080p)')
test_content = test_content.replace('name: /تحميل/i', 'name: /Download/i')
test_content = test_content.replace('تحميل:', 'Download:')
test_content = test_content.replace('الترجمة متوفرة تلقائياً في المشغل', 'Subtitles are automatically available and synchronized in the player')
test_content = test_content.replace('تثبيت التطبيق الآن', 'Install Now')
test_content = test_content.replace('/تثبيت تطبيق/i', '/Install/i')

with open(test_path, "w", encoding="utf-8") as f:
    f.write(test_content)
