import re

file_path = "/Users/redaoizghiti/Desktop/movie-main/frontend/src/features/catalog/components/WatchPlayer.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

def repl(old, new):
    global content
    content = content.replace(old, new)

# 2a
repl('⚡ Torrentio 4K (بدون إعلانات)', '⚡ Premium (No Ads)')
# 2b
repl('سيرفرات بديلة (Servers 1-5)', 'Servers (1-5)')
# 2c
repl("{isSeries ? 'تحميل الحلقات' : 'تحميل الفيلم'}", "{isSeries ? 'Download Episodes' : 'Download'}")

# 2d
block_2d_old = """                <button
                  type="button"
                  onClick={() => {
                    setViewMode('torrentio');
                    setDirectVideoUrl(null);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-purple-950/60 px-2.5 py-1 text-xs font-semibold text-purple-300 ring-1 ring-purple-500/40 hover:bg-purple-900/60 transition"
                  title="سيرفرات تورنتيو فائقة الجودة 4K"
                >
                  <Sparkles className="size-3 text-purple-400" />
                  <span>Torrentio (4K/HQ)</span>
                </button>"""
block_2d_new = """                <button
                  type="button"
                  onClick={() => {
                    setViewMode('torrentio');
                    setDirectVideoUrl(null);
                  }}
                  className="flex items-center gap-1.5 rounded-md bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40 hover:bg-emerald-900/60 transition"
                  title="Premium Ad-Free Server"
                >
                  <Sparkles className="size-3 text-emerald-400" />
                  <span>Ad-Free (4K/HQ)</span>
                </button>"""
repl(block_2d_old, block_2d_new)

# 2e
repl('الترجمة:', 'Subtitles:')
# 2f
repl('تكبير وتوسيع مشغل الفيديو لعرض عريض', 'Expand video player to cinema wide view')
# 2g
repl("{isWidePlayer ? 'تصغير المشغل' : '🔍 تكبير الفيديو (Cinema Wide)'}", "{isWidePlayer ? 'Standard View' : 'Cinema Wide'}")

# 2h
block_2h_old = """            {/* Ad & Streaming Guidance Alert */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3 py-2 text-xs" dir="rtl">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-purple-400" />
                <span className="text-fg-muted">
                  إذا فتحت لك نافذة إضافية عند الضغط على Play لأول مرة، أغلقها فقط وسيعمل الفيديو فوراً. للمشاهدة بدون أي إعلانات نهائياً:
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setViewMode('torrentio');
                  setDirectVideoUrl(null);
                }}
                className="flex items-center gap-1.5 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition"
              >
                <Sparkles className="size-3" />
                <span>جرّب سيرفرات Torrentio 4K</span>
              </button>
            </div>"""
block_2h_new = """            {/* Quick tip about pop-ups */}
            <div className="flex items-center gap-2.5 rounded-lg border border-line/60 bg-surface-2/80 px-3 py-2 text-xs">
              <Info className="size-4 shrink-0 text-accent" />
              <span className="text-fg-muted">
                If a pop-up appears on first play, just close it — the video will start immediately.
              </span>
            </div>"""
repl(block_2h_old, block_2h_new)

# 2i
block_2i_old = """                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Subtitles className="size-3.5" />
                  الترجمة متوفرة تلقائياً في المشغل (CC)
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                  🟢 ترجمة {currentSubLangObj.nativeName} {currentLangSub ? 'متزامنة' : 'مدمجة'}
                </span>"""
block_2i_new = """                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <Subtitles className="size-3.5" />
                  Subtitles (CC) Active
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-medium text-emerald-400">
                  🟢 {currentSubLangObj.nativeName} {currentLangSub ? 'synced' : 'embedded'}
                </span>"""
repl(block_2i_old, block_2i_new)

# 2j
repl("تحميل ملف الترجمة (${currentSubLangObj.nativeName}) المتزامن مع الصوت مباشرة", "Download subtitle file (${currentSubLangObj.nativeName})")
# 2k
repl("تحميل الترجمة ({currentSubLangObj.nativeName}) (.SRT)", "Download Subs ({currentSubLangObj.nativeName}) .SRT")
# 2l
repl('سيرفرات تورنتيو فائقة الجودة', 'Premium ad-free server')
repl('سيرفرات تورنتيو فائقة الجودة 4K', 'Premium ad-free server') # just in case
# 2m
repl('Torrentio 4K', 'Ad-Free 4K')
# 2n
repl("{isSeries ? `تحميل وترجمة الحلقة ${currentEpisode}` : 'سيرفرات التحميل والترجمة'}", "{isSeries ? `Download E${currentEpisode}` : 'Download Center'}")

# 2o
block_2o_old = """                <h3 className="text-base font-bold text-fg">
                  {isSeries
                    ? `تحميل الحلقات: الموسم ${currentSeason} - الحلقة ${currentEpisode}`
                    : `تحميل: ${details.title}`}
                </h3>"""
block_2o_new = """                <h3 className="text-base font-bold text-fg">
                  {isSeries
                    ? `Download: Season ${currentSeason} – Episode ${currentEpisode}`
                    : `Download: ${details.title}`}
                </h3>"""
repl(block_2o_old, block_2o_new)

# 2p
repl('اختر الحلقة لتحميلها: الموسم {currentSeason} • الحلقة {currentEpisode}', 'Select episode: Season {currentSeason} • Episode {currentEpisode}')
# 2q
repl('الحلقة السابقة', 'Previous')
# 2r
repl('الحلقة التالية', 'Next')
# 2s
repl('الموسم:', 'Season:')

# 2t
block_2t_old = """            {/* Install App on Device Banner (PWA) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3 text-xs" dir="rtl">
              <div className="flex items-center gap-2.5">
                <Download className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-fg">
                    تثبيت تطبيق <bdi className="font-bold text-accent">Netfarjo</bdi> على جهازك
                  </p>
                  <p className="text-fg-muted">
                    ثبّت الموقع كتطبيق أصلي على هاتفك أو حاسوبك لتشغيل وتنزيل الأفلام والمسلسلات مباشرة بدون متصفح
                  </p>
                </div>
              </div>
              {isInstalled ? (
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  ✓ التطبيق مثبت على جهازك
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  <Download className="size-3.5 mr-1" />
                  <span>تثبيت التطبيق الآن</span>
                </Button>
              )}
            </div>"""
block_2t_new = """            {/* Install App on Device Banner (PWA) */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 p-3 text-xs" dir="rtl">
              <div className="flex items-center gap-2.5">
                <Download className="size-4 shrink-0 text-emerald-400" />
                <div>
                  <p className="font-semibold text-fg">
                    Install <bdi className="font-bold text-accent">Netfarjo</bdi> on your device
                  </p>
                  <p className="text-fg-muted">
                    Install as a native app on your phone or computer to stream and download movies directly.
                  </p>
                </div>
              </div>
              {isInstalled ? (
                <span className="rounded bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  ✓ App installed
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="h-8 bg-emerald-600 px-3.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  <Download className="size-3.5 mr-1" />
                  <span>Install Now</span>
                </Button>
              )}
            </div>"""
repl(block_2t_old, block_2t_new)

# 2u
repl('اختر الجودة أدناه للمشاهدة المباشرة فائقة السرعة أو تنزيل ملف الترجمة المتزامن.', 'Select quality below to stream in HD or download the subtitle file.')
# 2v
repl('جاري البحث عن روابط التحميل المباشرة...', 'Searching for direct download links...')

# 2w to 2ac
repl('تحميل فيديو MP4 مباشر لجهازك', 'Download MP4 to device')
repl('تحميل فيديو مباشر (MP4)', 'Download MP4')
repl('مشاهدة وتشغيل الفيديو فوراً في المشغل', 'Play in browser')
repl('تشغيل الفيديو (1080p)', 'Play (1080p)')
repl('تشغيل الفيديو (720p)', 'Play (720p)')
repl('تشغيل الفيديو (4K)', 'Play (4K)')
repl('مشاهدة مباشرة في المشغل', 'Watch directly in player')
repl('▶ مشاهدة مباشرة ({currentSubLangObj.nativeName})', '▶ Watch ({currentSubLangObj.nativeName})')
repl('تحميل ملف الترجمة ({currentSubLangObj.nativeName}) المزامنة (.SRT)', 'Download subtitle (${currentSubLangObj.nativeName}) .SRT')
repl('الترجمة ({currentSubLangObj.nativeName})', 'Subs ({currentSubLangObj.nativeName})')

# 2ad
empty_ar = '''                  روابط التنزيل المباشرة التلقائية غير متوفرة لهذا العنوان حالياً. يمكنك الاستمتاع
                  بالمشاهدة المباشرة بجودة عالية عبر المشغل في الأعلى.'''
empty_en = 'Direct download links are not available for this title. You can watch it directly using the player above.'
repl(empty_ar, empty_en)

# 2ae
repl('اختر لغة الترجمة للتحميل والمشاهدة:', 'Choose subtitle language:')
# 2af
repl('ملف ترجمة {currentSubLangObj.nativeName} المتزامن (.SRT):', '{currentSubLangObj.nativeName} subtitle file (.SRT):')
# 2ag
repl('تحميل ملف الترجمة ({currentSubLangObj.nativeName}) (.SRT)', 'Download {currentSubLangObj.nativeName} Subtitles (.SRT)')
repl('تحميل ملف الترجمة ({currentSubLangObj.nativeName}) .SRT لجهازك', 'Download subtitle (${currentSubLangObj.nativeName}) .SRT')
# 2ah
repl('الترجمة متوفرة تلقائياً في المشغل ومتزامنة مع الصوت.', 'Subtitles are automatically available and synchronized in the player.')

# 2ai
repl('سيرفرات Torrentio 4K فائقة السرعة (قيد التجهيز والتطوير • En cours)', 'Premium Ad-Free Servers (Coming Soon)')
repl('نعمل حالياً على تجهيز وربط خوادم تورنتيو السريعة المباشرة (4K HDR وبدون إعلانات) لتعمل بشكل فوري داخل الموقع وبدون الحاجة لبرامج خارجية. في هذه الأثناء، يمكنك الاستمتاع بالمشاهدة السريعة الفورية عبر السيرفرات البديلة (سيرفر 1 - 5) أو عبر قسم التحميل المباشر.', 'We\'re setting up high-speed ad-free 4K servers for direct in-site playback. Meanwhile, use Servers 1-5 or the Download Center.')
repl('الانتقال للمشغل المباشر (سيرفرات 1-5)', 'Go to Player (Servers 1-5)')
repl('سيرفرات التحميل', 'Download Center')
repl('سيرفرات تورنتيو فائقة الجودة (Torrentio 4K / 1080p)', 'Premium Servers (4K / 1080p)')
repl('${torrentStreams.length} سيرفر متوفر', '${torrentStreams.length} available')
repl('Torrentio HQ', 'Premium HQ')
repl('سيرفرات سريعة بدقة 4K و 1080p بدون إعلانات نهائياً مع أعلى جودة صوت وصورة.', 'High-speed 4K and 1080p servers with zero ads and top quality audio/video.')
repl('إعدادات Debrid / Torrentio', 'Debrid settings')
repl('Debrid مفعل', 'Debrid active')
repl('إعداد Debrid', 'Setup Debrid')
repl('المشغل العادي', 'Standard Player')
repl('إعدادات مزود Debrid (RealDebrid / Torbox) لتشغيل مباشر:', 'Debrid Provider Settings (RealDebrid / Torbox):')
repl('إغلاق ✕', 'Close ✕')
repl('إذا كان لديك حساب RealDebrid أو AllDebrid أو Torbox، أدخل كود الإعداد من موقع Torrentio للحصول على تشغيل فوري 4K بدون تحميل:', 'If you have a RealDebrid, AllDebrid, or Torbox account, enter your Torrentio config code for instant 4K playback:')
repl('مثال: realdebrid=APIKEY أو torbox=APIKEY', 'e.g. realdebrid=APIKEY or torbox=APIKEY')
repl('>حفظ<', '>Save<') # careful with 'حفظ' matching elsewhere, use brackets
repl('جاري التشغيل المباشر فالموقع بجودة 4K أصلية وبدون إعلانات (Direct Stream)', 'Playing directly in-site in original 4K quality — ad-free (Direct Stream)')
repl('إغلاق المشغل ✕', 'Close Player ✕')
repl('اختر الموسم والحلقة:', 'Select season and episode:')
repl('الموسم {currentSeason} - الحلقة {currentEpisode}', 'Season {currentSeason} – Episode {currentEpisode}')
repl('الموسم {seasonNum}', 'Season {seasonNum}')
repl('الحلقة {epNum}', 'Episode {epNum}')
repl('جاري فحص وتجهيز سيرفرات تورنتيو فائقة الجودة...', 'Searching for premium streams...')
repl('لم يتم العثور على سيرفرات تورنتيو لهذا العنوان', 'No premium streams found for this title')
repl('يمكنك استخدام المشغل العادي (سيرفر 1 أو 2) لمشاهدة الفيلم مباشرة بجودة عالية وبدون إعلانات.', 'You can use the standard player (Server 1 or 2) to watch in high quality.')
repl('الرجوع للمشغل المباشر', 'Back to Player')
repl('تشغيل مباشر في المشغل بدون تحميل', 'Play directly in browser')
repl('▶ تشغيل مباشر', '▶ Play Now')
repl('تحميل ملف MP4 مباشر', 'Download MP4 file')
repl('تحميل MP4', 'Download MP4')
repl('تشغيل في مشغل الموقع فوراً بدون أي برامج', 'Play in site player')
repl('▶ تشغيل في الموقع', '▶ Play in Browser')
repl('نسخ رابط Magnet', 'Copy Magnet link')
repl('تم النسخ ✔', 'Copied ✔')
repl('نسخ Magnet', 'Copy Magnet')
repl('سيرفرات تورنتيو تجلب ملفات الفيديو الأصلية بأعلى نقاوة (4K HDR / 1080p). اضغط تشغيل لمشاهدة الفيلم فوراً في مشغل الموقع، أو أدخل كود Debrid لتشغيلها مباشرة بجودة MP4 وبدون إعلانات.', 'Premium servers fetch original video files in top quality (4K HDR / 1080p). Press Play to watch instantly, or enter a Debrid code for direct MP4 playback.')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

