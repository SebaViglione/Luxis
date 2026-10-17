# Genera demo-assets/lista-precios.xlsx (pip install openpyxl). Precios sin IVA, calibrados con adjudicaciones de ARCE de oct. 2026.
from openpyxl import Workbook
from openpyxl.styles import Font
from openpyxl.utils import get_column_letter

PRODUCTOS = [
    ("Cemento portland bolsa 25 kg", "UNIDAD", 245, 800, "ANCAP"),
    ("Cemento portland a granel", "KG", 8.2, 15000, "ANCAP"),
    ("Cal hidratada bolsa 25 kg", "UNIDAD", 210, 300, "Genérica"),
    ("Arena fina", "M3", 1500, 120, "A granel"),
    ("Arena terciada", "M3", 1400, 150, "A granel"),
    ("Arena gruesa", "M3", 1600, 100, "A granel"),
    ("Pedregullo", "M3", 1600, 180, "A granel"),
    ("Balasto", "M3", 950, 200, "A granel"),
    ("Tosca", "M3", 700, 90, "A granel"),
    ("Ladrillo de campo", "UNIDAD", 15, 40000, "Genérica"),
    ("Ticholo ocho bocas", "UNIDAD", 38, 12000, "Genérica"),
    ("Bloque de hormigón 12x19x39 cm", "UNIDAD", 38, 6000, "Genérica"),
    ("Hierro varilla lisa 6 mm (barra 12 m)", "UNIDAD", 85, 500, "Gerdau"),
    ("Hierro varilla conformada 8 mm (barra 12 m)", "UNIDAD", 150, 450, "Gerdau"),
    ("Hierro varilla conformada 10 mm (barra 12 m)", "UNIDAD", 235, 350, "Gerdau"),
    ("Hierro varilla conformada 12 mm (barra 12 m)", "UNIDAD", 340, 300, "Gerdau"),
    ("Malla electrosoldada 15x15 cm 6 mm (panel 2,15x6 m)", "UNIDAD", 4200, 80, "Gerdau"),
    ("Alambre galvanizado liso N.° 14", "KG", 150, 400, "Genérica"),
    ("Alambre de púa", "KG", 220, 250, "Genérica"),
    ("Chapa galvanizada acanalada cal. 24 (1,08x1,83 m)", "UNIDAD", 850, 200, "Genérica"),
    ("Chapa galvanizada acanalada cal. 26 (1,08x3,66 m)", "UNIDAD", 1400, 150, "Genérica"),
    ("Clavos de 2 1/2\"", "KG", 180, 300, "Genérica"),
    ("Tornillos autoperforantes para chapa (caja x100)", "UNIDAD", 450, 150, "Genérica"),
    ("Caño PVC sanitario 110 mm (barra 3 m)", "UNIDAD", 780, 300, "Genérica"),
    ("Caño PVC sanitario 160 mm (barra 3 m)", "UNIDAD", 1450, 180, "Genérica"),
    ("Tirante pino tratado 2\"x3\" (3,30 m)", "UNIDAD", 600, 400, "Pino nacional"),
    ("Tabla pino 1\"x15 cm (3,30 m)", "UNIDAD", 95, 600, "Pino nacional"),
    ("Compensado fenólico 18 mm (1,22x2,44 m)", "UNIDAD", 2450, 150, "Genérica"),
    ("Yeso en bolsa 25 kg", "UNIDAD", 320, 300, "Genérica"),
    ("Placa de yeso 12,5 mm (1,20x2,40 m)", "UNIDAD", 950, 200, "Durlock"),
    ("Membrana asfáltica 4 mm (rollo 10 m²)", "UNIDAD", 3800, 120, "Genérica"),
    ("Impermeabilizante líquido balde 20 L", "UNIDAD", 4300, 60, "Genérica"),
    ("Adhesivo para cerámica bolsa 25 kg", "UNIDAD", 260, 350, "Genérica"),
    ("Pastina para juntas bolsa 1 kg", "UNIDAD", 95, 400, "Genérica"),
    ("Cerámica piso básica 33x33 cm", "M2", 550, 2500, "Genérica"),
    ("Pintura látex interior balde 20 L", "UNIDAD", 3900, 150, "Inca"),
    ("Esmalte sintético 4 L", "UNIDAD", 1450, 200, "Inca"),
]

wb = Workbook()
ws = wb.active
ws.title = "Lista de precios"
ws.append(["Producto", "Unidad", "Precio UYU sin IVA", "Stock", "Marca"])
for cell in ws[1]:
    cell.font = Font(bold=True)
for fila in PRODUCTOS:
    ws.append(list(fila))
for (cell,) in ws.iter_rows(min_row=2, min_col=3, max_col=3):
    cell.number_format = "#,##0.00"
for i, ancho in enumerate([52, 10, 18, 10, 16], start=1):
    ws.column_dimensions[get_column_letter(i)].width = ancho
ws.freeze_panes = "A2"

wb.save("demo-assets/lista-precios.xlsx")
print(f"OK: {len(PRODUCTOS)} productos")
