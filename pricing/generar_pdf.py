from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, HRFlowable, Image, PageBreak)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import KeepTogether
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.utils import ImageReader
import os, textwrap

# colores génesis
BG       = colors.HexColor("#04060f")
BG2      = colors.HexColor("#080d1a")
CYAN     = colors.HexColor("#00d4ff")
CYAN_DIM = colors.HexColor("#00a8cc")
WHITE    = colors.HexColor("#f0f4ff")
MUTED    = colors.HexColor("#8b9ab5")
CARD     = colors.HexColor("#0d1525")
BORDER   = colors.HexColor("#1a2640")
GREEN    = colors.HexColor("#00e5a0")
GOLD     = colors.HexColor("#ffd166")

W, H = A4  # 595 x 842 pts

OUTPUT = os.path.join(os.path.dirname(__file__), "Genesis_Servicios_Precios.pdf")
LOGO   = os.path.join(os.path.dirname(__file__), "logo.png")

# estilos
def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=11, textColor=WHITE,
                leading=16, spaceAfter=4, spaceBefore=0)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "cover_brand": style("cb", fontName="Helvetica-Bold", fontSize=28,
                         textColor=WHITE, leading=32, alignment=TA_CENTER),
    "cover_sub":   style("cs", fontSize=13, textColor=CYAN, leading=18,
                         alignment=TA_CENTER, spaceAfter=6),
    "cover_tagline": style("ct", fontSize=11, textColor=MUTED, leading=16,
                           alignment=TA_CENTER),
    "section":     style("sec", fontName="Helvetica-Bold", fontSize=16,
                         textColor=CYAN, leading=20, spaceBefore=18, spaceAfter=8),
    "plan_title":  style("pt", fontName="Helvetica-Bold", fontSize=18,
                         textColor=WHITE, leading=22, alignment=TA_CENTER),
    "plan_price":  style("pp", fontName="Helvetica-Bold", fontSize=30,
                         textColor=CYAN, leading=34, alignment=TA_CENTER),
    "plan_price_label": style("ppl", fontSize=10, textColor=MUTED,
                              leading=14, alignment=TA_CENTER),
    "plan_desc":   style("pd", fontSize=10, textColor=MUTED, leading=15,
                         alignment=TA_CENTER, spaceAfter=6),
    "feature":     style("ft", fontSize=10, textColor=WHITE, leading=16),
    "body":        style("bd", fontSize=10, textColor=MUTED, leading=16),
    "footer":      style("fo", fontSize=8, textColor=MUTED, alignment=TA_CENTER),
    "h2":          style("h2", fontName="Helvetica-Bold", fontSize=13,
                         textColor=WHITE, leading=18, spaceBefore=12, spaceAfter=4),
    "tag":         style("tg", fontName="Helvetica-Bold", fontSize=9,
                         textColor=BG, leading=12, alignment=TA_CENTER),
    "contact":     style("co", fontSize=11, textColor=WHITE, leading=18,
                         alignment=TA_CENTER),
    "note":        style("nt", fontSize=9, textColor=MUTED, leading=13,
                         alignment=TA_CENTER),
}

# canvas background
class BgCanvas:
    def __init__(self, filename):
        self.filename = filename

    def __call__(self, canv, doc):
        canv.saveState()
        # Fondo principal
        canv.setFillColor(BG)
        canv.rect(0, 0, W, H, fill=1, stroke=0)
        # Gradiente sutil (círculos radiales simulados con rectángulos)
        canv.setFillColor(colors.HexColor("#001520"))
        canv.circle(W * 0.15, H * 0.88, 140, fill=1, stroke=0)
        canv.setFillColor(colors.HexColor("#000e18"))
        canv.circle(W * 0.85, H * 0.12, 110, fill=1, stroke=0)
        # Línea cyan inferior
        canv.setStrokeColor(CYAN)
        canv.setLineWidth(2)
        canv.line(40, 28, W - 40, 28)
        # Número de página
        canv.setFont("Helvetica", 8)
        canv.setFillColor(MUTED)
        canv.drawCentredString(W / 2, 14, f"genesis.com.py  ·  genesisdevelopmentpy@gmail.com  ·  +595 981 118 297")
        canv.restoreState()

# helpers
def hr(color=BORDER, thickness=0.5):
    return HRFlowable(width="100%", thickness=thickness, color=color,
                      spaceAfter=8, spaceBefore=8)

def check(text):
    return Paragraph(f"<font color='#00d4ff'>✦</font>  {text}", S["feature"])

CARD_W  = 5.6 * cm   # ancho exterior de cada tarjeta
INNER_W = 4.8 * cm   # ancho interior (CARD_W - 2*padding)

def plan_card(emoji, title, subtitle, price, unit, desc, features, tag=None, tag_color=CYAN):
    # estilos compactos dentro de la tarjeta
    s_title = ParagraphStyle("cpt", fontName="Helvetica-Bold", fontSize=13,
                              textColor=WHITE, leading=16, alignment=TA_CENTER)
    s_price = ParagraphStyle("cpp", fontName="Helvetica-Bold", fontSize=22,
                              textColor=CYAN, leading=26, alignment=TA_CENTER)
    s_unit  = ParagraphStyle("cpu", fontSize=8, textColor=MUTED,
                              leading=11, alignment=TA_CENTER)
    s_sub   = ParagraphStyle("cpd", fontSize=8, textColor=MUTED,
                              leading=12, alignment=TA_CENTER)
    s_feat  = ParagraphStyle("cpf", fontSize=8.5, textColor=WHITE,
                              leading=13)
    s_tag   = ParagraphStyle("ctg", fontName="Helvetica-Bold", fontSize=8,
                              textColor=BG, leading=11, alignment=TA_CENTER)

    items = []
    if tag:
        tag_table = Table([[Paragraph(tag, s_tag)]], colWidths=[INNER_W])
        tag_table.setStyle(TableStyle([
            ("BACKGROUND", (0,0), (-1,-1), tag_color),
            ("ALIGN", (0,0), (-1,-1), "CENTER"),
            ("TOPPADDING", (0,0), (-1,-1), 3),
            ("BOTTOMPADDING", (0,0), (-1,-1), 3),
        ]))
        items.append(tag_table)
        items.append(Spacer(1, 5))

    items += [
        Paragraph(f"{emoji} {title}", s_title),
        Spacer(1, 2),
        Paragraph(subtitle, s_sub),
        Spacer(1, 6),
        Paragraph(price, s_price),
        Paragraph(unit, s_unit),
        Spacer(1, 7),
        HRFlowable(width="100%", thickness=0.5, color=BORDER,
                   spaceAfter=5, spaceBefore=0),
    ]
    for f in features:
        items.append(Paragraph(f"<font color='#00d4ff'>✦</font>  {f}", s_feat))
        items.append(Spacer(1, 1))

    inner = Table([[item] for item in items], colWidths=[INNER_W])
    inner.setStyle(TableStyle([
        ("LEFTPADDING",   (0,0), (-1,-1), 0),
        ("RIGHTPADDING",  (0,0), (-1,-1), 0),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 0),
    ]))

    outer = Table([[inner]], colWidths=[CARD_W])
    outer.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CARD),
        ("BOX",           (0,0), (-1,-1), 0.8, BORDER),
        ("TOPPADDING",    (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
    ]))
    return outer

def service_row(icon, name, desc, price_from, price_to):
    name_cell  = [Paragraph(f"{icon}  <b>{name}</b>", S["h2"]),
                  Paragraph(desc, S["body"])]
    price_cell = [Paragraph(f"<b>{price_from}</b>", ParagraphStyle("pr",
                    fontName="Helvetica-Bold", fontSize=16, textColor=CYAN,
                    leading=20, alignment=TA_RIGHT)),
                  Paragraph(f"hasta {price_to}", ParagraphStyle("pr2",
                    fontSize=9, textColor=MUTED, leading=12, alignment=TA_RIGHT))]

    row = Table([[name_cell, price_cell]],
                colWidths=[10*cm, 4.5*cm])
    row.setStyle(TableStyle([
        ("VALIGN", (0,0), (-1,-1), "TOP"),
        ("ALIGN", (1,0), (1,-1), "RIGHT"),
        ("LEFTPADDING", (0,0), (-1,-1), 14),
        ("RIGHTPADDING", (0,0), (-1,-1), 14),
        ("TOPPADDING", (0,0), (-1,-1), 12),
        ("BOTTOMPADDING", (0,0), (-1,-1), 12),
        ("BACKGROUND", (0,0), (-1,-1), CARD),
        ("BOX", (0,0), (-1,-1), 0.5, BORDER),
        ("ROUNDEDCORNERS", [8,8,8,8]),
    ]))
    return row

# documento
doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    leftMargin=1.4*cm, rightMargin=1.4*cm,
    topMargin=1.4*cm,  bottomMargin=1.4*cm,
    title="Génesis Development Service — Servicios & Precios",
    author="Génesis Development Service",
)

story = []

# página 1 — portada

story.append(Spacer(1, 2.5*cm))

# Logo
if os.path.exists(LOGO):
    img = Image(LOGO, width=3.2*cm, height=3.2*cm)
    img.hAlign = "CENTER"
    story.append(img)
    story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("GÉNESIS", S["cover_brand"]))
story.append(Paragraph("Development Service", S["cover_sub"]))
story.append(Spacer(1, 0.3*cm))
story.append(hr(CYAN_DIM, 1))
story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Soluciones digitales profesionales para tu negocio", S["cover_tagline"]))
story.append(Paragraph("Diseño · Desarrollo · Automatización · Soporte", S["cover_tagline"]))
story.append(Spacer(1, 2.5*cm))

# Cuadro destacado portada
cover_box = Table(
    [[Paragraph(
        "<b>¿Por qué Génesis?</b><br/><br/>"
        "Somos una agencia 100% paraguaya especializada en crear presencias digitales "
        "que generan resultados reales. Trabajamos con marcas de la belleza, "
        "gastronomía, indumentaria y empresas de todos los rubros que entienden "
        "el valor de tener una identidad digital profesional.",
        ParagraphStyle("cb2", fontName="Helvetica", fontSize=11, textColor=WHITE,
                       leading=18, alignment=TA_CENTER)
    )]],
    colWidths=[16*cm]
)
cover_box.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), CARD),
    ("BOX", (0,0), (-1,-1), 1, CYAN_DIM),
    ("TOPPADDING", (0,0), (-1,-1), 20),
    ("BOTTOMPADDING", (0,0), (-1,-1), 20),
    ("LEFTPADDING", (0,0), (-1,-1), 24),
    ("RIGHTPADDING", (0,0), (-1,-1), 24),
    ("ROUNDEDCORNERS", [10,10,10,10]),
]))
story.append(cover_box)
story.append(Spacer(1, 2.5*cm))

# Stats portada
stats = Table(
    [[
        [Paragraph("<b>100%</b>", ParagraphStyle("sv", fontName="Helvetica-Bold",
            fontSize=26, textColor=CYAN, leading=30, alignment=TA_CENTER)),
         Paragraph("Personalizado", S["cover_tagline"])],
        [Paragraph("<b>30/70</b>", ParagraphStyle("sv", fontName="Helvetica-Bold",
            fontSize=26, textColor=CYAN, leading=30, alignment=TA_CENTER)),
         Paragraph("Forma de pago", S["cover_tagline"])],
        [Paragraph("<b>24h</b>", ParagraphStyle("sv", fontName="Helvetica-Bold",
            fontSize=26, textColor=CYAN, leading=30, alignment=TA_CENTER)),
         Paragraph("Tiempo de respuesta", S["cover_tagline"])],
        [Paragraph("<b>2025</b>", ParagraphStyle("sv", fontName="Helvetica-Bold",
            fontSize=26, textColor=CYAN, leading=30, alignment=TA_CENTER)),
         Paragraph("Innovando desde", S["cover_tagline"])],
    ]],
    colWidths=[4*cm]*4
)
stats.setStyle(TableStyle([
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("TOPPADDING", (0,0), (-1,-1), 0),
    ("BOTTOMPADDING", (0,0), (-1,-1), 0),
]))
story.append(stats)

story.append(PageBreak())

# página 2 — planes por perfil de cliente

story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Planes según tu perfil", S["section"]))
story.append(Paragraph(
    "Diseñamos propuestas flexibles para cada tipo de cliente.",
    S["body"]
))
story.append(Spacer(1, 0.5*cm))

card1 = plan_card(
    "🌱", "STARTER", "Emprendedores y negocios pequeños",
    "desde $150 USD", "pago único",
    "",
    [
        "Landing page de 1 página",
        "Diseño responsive (móvil + desktop)",
        "Formulario de contacto",
        "Integración con WhatsApp",
        "Optimización básica SEO",
        "1 revisión incluida",
        "Entrega en 7-10 días hábiles",
    ],
    tag="MÁS POPULAR", tag_color=GREEN
)

card2 = plan_card(
    "🚀", "PROFESSIONAL", "Profesionales y PYMEs",
    "desde $380 USD", "pago único",
    "",
    [
        "Sitio web 4-6 páginas",
        "Diseño UI/UX personalizado",
        "Blog o sección noticias",
        "SEO avanzado + Google Analytics",
        "Integración redes sociales",
        "Bot WhatsApp básico",
        "3 revisiones incluidas",
        "Entrega en 15-20 días hábiles",
    ],
    tag="RECOMENDADO", tag_color=CYAN
)

card3 = plan_card(
    "🏢", "ENTERPRISE", "Empresas medianas y grandes",
    "desde $900 USD", "pago según alcance",
    "",
    [
        "Sitio corporativo completo",
        "E-commerce o sistema a medida",
        "Panel de administración",
        "Bot WhatsApp con IA",
        "Integraciones con APIs externas",
        "SEO premium + estrategia digital",
        "Revisiones ilimitadas",
        "Soporte prioritario 3 meses",
    ],
    tag="PREMIUM", tag_color=GOLD
)

plans_table = Table(
    [[card1, card2, card3]],
    colWidths=[CARD_W + 0.4*cm, CARD_W + 0.4*cm, CARD_W + 0.4*cm]
)
plans_table.setStyle(TableStyle([
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 4),
    ("RIGHTPADDING", (0,0), (-1,-1), 4),
    ("TOPPADDING", (0,0), (-1,-1), 0),
    ("BOTTOMPADDING", (0,0), (-1,-1), 0),
]))
story.append(plans_table)

story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    "✦  Todos los planes incluyen dominio y hosting del primer año gratis al contratar mantenimiento mensual.",
    S["note"]
))

story.append(PageBreak())

# página 3 — catálogo completo de servicios

story.append(Spacer(1, 0.4*cm))
story.append(Paragraph("Catálogo completo de servicios", S["section"]))
story.append(Paragraph(
    "Precios referenciales en USD. Los presupuestos finales se definen según el alcance y complejidad del proyecto.",
    S["body"]
))
story.append(Spacer(1, 0.5*cm))

services = [
    ("🌐", "Desarrollo Web",
     "Sitios corporativos, landing pages y portales a medida con código limpio y alto rendimiento.",
     "desde $150", "$1.200 USD"),
    ("🎨", "Diseño UI/UX",
     "Interfaces intuitivas y visualmente potentes que refuerzan tu identidad de marca.",
     "desde $120", "$600 USD"),
    ("🛒", "E-commerce",
     "Tiendas online con pasarela de pago, gestión de inventario y experiencia optimizada para vender más.",
     "desde $600", "$2.500 USD"),
    ("⚙️", "Aplicaciones Web",
     "Sistemas a medida, dashboards y herramientas internas que automatizan procesos de tu equipo.",
     "desde $800", "$5.000 USD"),
    ("🤖", "Bot de WhatsApp",
     "Atención al cliente 24/7 con IA: responde consultas, toma pedidos y brinda soporte automático.",
     "desde $200", "$800 USD"),
    ("🛡️", "Mantenimiento Web",
     "Actualizaciones, backups, monitoreo y soporte continuo. Planes mensuales desde $40/mes.",
     "desde $40/mes", "$120/mes"),
]

for icon, name, desc, p_from, p_to in services:
    story.append(service_row(icon, name, desc, p_from, p_to))
    story.append(Spacer(1, 6))

story.append(Spacer(1, 0.4*cm))
story.append(hr(CYAN_DIM, 0.8))
story.append(Spacer(1, 0.3*cm))

# Tabla métodos de pago
story.append(Paragraph("Métodos de pago", S["section"]))

pay_table = Table(
    [[
        [Paragraph("🏦  Transferencia Bancaria", S["h2"]),
         Paragraph("Local e internacional. Depósito directo a cuenta bancaria.", S["body"])],
        [Paragraph("💵  Efectivo / Divisa", S["h2"]),
         Paragraph("Guaraníes (PYG) y dólares (USD) para clientes en Paraguay.", S["body"])],
        [Paragraph("📅  Esquema de pago", S["h2"]),
         Paragraph("30% al inicio del proyecto · 70% al momento de la entrega.", S["body"])],
    ]],
    colWidths=[5.5*cm, 5.5*cm, 5.5*cm]
)
pay_table.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("LEFTPADDING", (0,0), (-1,-1), 12),
    ("RIGHTPADDING", (0,0), (-1,-1), 12),
    ("TOPPADDING", (0,0), (-1,-1), 12),
    ("BOTTOMPADDING", (0,0), (-1,-1), 12),
    ("BACKGROUND", (0,0), (-1,-1), CARD),
    ("BOX", (0,0), (-1,-1), 0.5, BORDER),
    ("LINEBEFORE", (1,0), (2,-1), 0.5, BORDER),
    ("ROUNDEDCORNERS", [8,8,8,8]),
]))
story.append(pay_table)

story.append(PageBreak())

# página 4 — contacto y cierre

story.append(Spacer(1, 1.5*cm))

if os.path.exists(LOGO):
    img2 = Image(LOGO, width=2.4*cm, height=2.4*cm)
    img2.hAlign = "CENTER"
    story.append(img2)
    story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("¿Listo para tu próximo proyecto?", S["cover_brand"]))
story.append(Spacer(1, 0.3*cm))
story.append(Paragraph(
    "Contanos tu idea y te respondemos en menos de 24 horas<br/>"
    "con una propuesta personalizada sin costo ni compromiso.",
    ParagraphStyle("ct2", fontName="Helvetica", fontSize=12, textColor=MUTED,
                   leading=20, alignment=TA_CENTER)
))
story.append(Spacer(1, 1.5*cm))

contact_box = Table(
    [[
        [Paragraph("📱 WhatsApp", S["h2"]),
         Paragraph("+595 981 118 297", S["contact"])],
        [Paragraph("📩 Email", S["h2"]),
         Paragraph("genesisdevelopmentpy@gmail.com", S["contact"])],
    ]],
    colWidths=[8*cm, 8*cm]
)
contact_box.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("LEFTPADDING", (0,0), (-1,-1), 16),
    ("RIGHTPADDING", (0,0), (-1,-1), 16),
    ("TOPPADDING", (0,0), (-1,-1), 16),
    ("BOTTOMPADDING", (0,0), (-1,-1), 16),
    ("BACKGROUND", (0,0), (-1,-1), CARD),
    ("BOX", (0,0), (-1,-1), 1, CYAN_DIM),
    ("LINEBEFORE", (1,0), (1,-1), 0.5, BORDER),
    ("ROUNDEDCORNERS", [10,10,10,10]),
]))
story.append(contact_box)
story.append(Spacer(1, 0.8*cm))

social_box = Table(
    [[
        [Paragraph("📸 Instagram", S["h2"]),
         Paragraph("@genesisparaguay_", S["contact"])],
        [Paragraph("🌐 Web", S["h2"]),
         Paragraph("www.genesis.com.py", S["contact"])],
    ]],
    colWidths=[8*cm, 8*cm]
)
social_box.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "TOP"),
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("LEFTPADDING", (0,0), (-1,-1), 16),
    ("RIGHTPADDING", (0,0), (-1,-1), 16),
    ("TOPPADDING", (0,0), (-1,-1), 16),
    ("BOTTOMPADDING", (0,0), (-1,-1), 16),
    ("BACKGROUND", (0,0), (-1,-1), CARD),
    ("BOX", (0,0), (-1,-1), 0.5, BORDER),
    ("LINEBEFORE", (1,0), (1,-1), 0.5, BORDER),
    ("ROUNDEDCORNERS", [10,10,10,10]),
]))
story.append(social_box)
story.append(Spacer(1, 1.5*cm))
story.append(hr(CYAN_DIM, 1))
story.append(Spacer(1, 0.5*cm))
story.append(Paragraph(
    "Los precios expresados son referenciales en USD y pueden variar según el alcance, "
    "complejidad y requerimientos específicos de cada proyecto.<br/>"
    "Pedí tu presupuesto personalizado sin costo. · © 2025 Génesis Development Service · Paraguay",
    S["note"]
))

# build
bg = BgCanvas(OUTPUT)
doc.build(story, onFirstPage=bg, onLaterPages=bg)
print(f"PDF generado: {OUTPUT}")
