# Build a self-contained MediDiagnose architecture SVG (inline styles, explicit
# arrowheads, white bg) and render a high-res PNG.
import io

W, H = 1240, 772
TXT, SUB = "#111827", "#6b7280"
BOX_FILL, BOX_STROKE = "#ffffff", "#d1d5db"
ARROW = "#6b7280"

containers = [
    # x,y,w,h, fill, stroke, titlecolor, label, lx, ly
    (30, 210, 150, 300, "#f9fafb", "#4b5563", "#1f2937", "USER ROLES", 46, 234),
    (210, 150, 250, 430, "#eff6ff", "#2563eb", "#1e3a8a", "FRONTEND", 226, 174),
    (500, 150, 340, 440, "#f0fdf4", "#16a34a", "#14532d", "BACKEND", 516, 174),
    (880, 150, 330, 290, "#fffbeb", "#d97706", "#78350f", "DATABASE", 896, 174),
    (880, 470, 330, 282, "#faf5ff", "#9333ea", "#581c87", "AI / ML LAYER", 896, 494),
]

# Brand logos placed as a strip in each tier header. (key, x, y, size, fill_override)
LOGO_DIR = "_logos"
logos = [
    ("react", 370, 159, 24, None), ("vite", 400, 159, 24, None), ("tailwind", 430, 159, 24, None),
    ("node", 776, 159, 24, None), ("express", 806, 161, 24, None),
    ("mongodb", 1174, 159, 24, None),
    ("python", 1118, 479, 24, None), ("pytorch", 1148, 479, 24, None), ("huggingface", 1178, 480, 22, "#FFD21E"),
]

boxes = [
    # x,y,w,h,title,subtitle(None=single line)
    (46, 256, 118, 56, "Patient", "Submits symptoms"),
    (46, 326, 118, 56, "Doctor", "Reviews cases"),
    (46, 396, 118, 56, "Admin", "Manages system"),
    (226, 196, 218, 56, "Patient Dashboard", "Symptom checker · history"),
    (226, 266, 218, 56, "Doctor Dashboard", "Lock · review · finalize"),
    (226, 336, 218, 56, "Admin Dashboard", "Manage users · stats"),
    (226, 406, 218, 56, "AI Result + SHAP", "Word-importance view"),
    (226, 476, 218, 56, "Login / Register", "JWT session"),
    (516, 196, 308, 44, "REST API (Express)", None),
    (516, 252, 148, 52, "Auth & RBAC", "JWT · bcrypt"),
    (676, 252, 148, 52, "State Machine", "Session lifecycle"),
    (516, 316, 148, 52, "Locking", "Pessimistic lock"),
    (676, 316, 148, 52, "Audit Logging", "Every action"),
    (516, 380, 148, 52, "Notifications", "In-app alerts"),
    (676, 380, 148, 52, "Email Service", "Status emails"),
    (516, 444, 148, 52, "Prescription PDF", "Doctor sign-off"),
    (676, 444, 148, 52, "ICD-10 Mapping", "Code lookup"),
    (516, 508, 308, 52, "AI Model Wrapper", "Spawns Python worker"),
    (896, 196, 145, 50, "Users & Profiles", "Accounts & roles"),
    (1049, 196, 145, 50, "DiagnosisSession", "Current state"),
    (896, 258, 145, 50, "Revisions", "Append-only AI"),
    (1049, 258, 145, 50, "DoctorReview", "Endorses revision"),
    (896, 320, 145, 50, "Prescription", "PDF metadata"),
    (1049, 320, 145, 50, "Notification", "Alerts log"),
    (896, 372, 298, 50, "AuditLog", "Immutable trail"),
    (896, 512, 298, 52, "Persistent Worker", "predict_disease.py · stdio"),
    (896, 576, 298, 52, "Fine-tuned BERT", "Symptom → disease, Top-3"),
    (896, 640, 298, 52, "SHAP / LIME", "Word-importance"),
]

arrows = [
    (182, 380, 206, 380),
    (462, 218, 496, 218),
    (842, 250, 876, 250),
    (842, 534, 876, 534),
    (876, 572, 842, 572),
]

def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

import re, os
def emit_logo(key, x, y, size, fill=None):
    raw = io.open(os.path.join(LOGO_DIR, key + ".svg"), encoding="utf-8").read()
    vb = re.search(r'viewBox="([^"]+)"', raw)
    vb = vb.group(1) if vb else "0 0 128 128"
    inner = raw[raw.index(">", raw.index("<svg")) + 1: raw.rindex("</svg>")]
    f = f' fill="{fill}"' if fill else ""
    return (f'<svg x="{x}" y="{y}" width="{size}" height="{size}" '
            f'viewBox="{vb}" overflow="visible"{f}>{inner}</svg>')

s = []
s.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" font-family="Arial, Helvetica, sans-serif">')
s.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#ffffff"/>')

# containers
for x, y, w, h, fill, stroke, tc, label, lx, ly in containers:
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{fill}" stroke="{stroke}" stroke-width="1"/>')
    s.append(f'<text x="{lx}" y="{ly}" font-size="14" font-weight="700" fill="{tc}">{esc(label)}</text>')

# inner boxes
for x, y, w, h, title, sub in boxes:
    cx = x + w / 2
    s.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{BOX_FILL}" stroke="{BOX_STROKE}" stroke-width="1"/>')
    if sub is None:
        s.append(f'<text x="{cx}" y="{y+h/2+5}" font-size="14" font-weight="600" fill="{TXT}" text-anchor="middle">{esc(title)}</text>')
    else:
        s.append(f'<text x="{cx}" y="{y+22}" font-size="14" font-weight="600" fill="{TXT}" text-anchor="middle">{esc(title)}</text>')
        s.append(f'<text x="{cx}" y="{y+h-12}" font-size="12" fill="{SUB}" text-anchor="middle">{esc(sub)}</text>')

# arrows with explicit triangular heads
for x1, y1, x2, y2 in arrows:
    s.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{ARROW}" stroke-width="1.5"/>')
    if x2 >= x1:  # rightward
        s.append(f'<polygon points="{x2},{y2} {x2-8},{y2-4} {x2-8},{y2+4}" fill="{ARROW}"/>')
    else:          # leftward
        s.append(f'<polygon points="{x2},{y2} {x2+8},{y2-4} {x2+8},{y2+4}" fill="{ARROW}"/>')

# brand logos (drawn last so they sit on top of the container header)
for key, x, y, size, fill in logos:
    s.append(emit_logo(key, x, y, size, fill))

s.append('</svg>')
svg = "\n".join(s)

SVG_OUT = r"C:/Users/Youssef/Downloads/MediDiagnose_Architecture_Current.svg"
PNG_OUT = r"C:/Users/Youssef/Downloads/MediDiagnose_Architecture_Current.png"
io.open(SVG_OUT, "w", encoding="utf-8").write(svg)
print("SVG saved:", SVG_OUT)

# render PNG at 2x via headless Chrome (real browser fidelity, no native deps)
import subprocess, tempfile
CHROME = r"C:/Program Files/Google/Chrome/Application/chrome.exe"
html = ('<!doctype html><html><head><meta charset="utf-8">'
        '<style>html,body{margin:0;padding:0;background:#fff}svg{display:block}</style>'
        '</head><body>' + svg + '</body></html>')
wrap = os.path.join(tempfile.gettempdir(), "_arch_wrap.html")
io.open(wrap, "w", encoding="utf-8").write(html)
subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                "--force-device-scale-factor=2", f"--window-size={W},{H}",
                "--default-background-color=FFFFFFFF",
                f"--screenshot={PNG_OUT}", wrap],
               capture_output=True, timeout=120)
os.remove(wrap)
print("PNG saved:", PNG_OUT, "|", os.path.getsize(PNG_OUT) if os.path.exists(PNG_OUT) else "MISSING", "bytes")
