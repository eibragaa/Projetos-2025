import qrcode
from PIL import Image, ImageDraw

# Criar QR Code
qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
qr.add_data("https://drive.google.com/file/d/1fmPDYyJIIi41A9B2YFpRTRt0ZI4P56f7/view?usp=drive_link")# Substitua pelo seu link
qr.make(fit=True)

# Gerar imagem
img = qr.make_image(fill_color="pink", back_color="white")
img.save("qrcodeELOA.png")

# (Para personalizar, você pode abrir "qrcode.png" em um editor gráfico e aplicar o formato de coração e ondas sonoras)