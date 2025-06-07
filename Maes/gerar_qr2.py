import qrcode
from PIL import Image, ImageDraw # Image e ImageDraw não são usados diretamente, mas são dependências

# 1. Configuração do QR Code
qr = qrcode.QRCode(
    version=1, # Pode ajustar se o link for muito longo, mas fit=True cuida disso
    error_correction=qrcode.constants.ERROR_CORRECT_L, # Nível de correção (L, M, Q, H)
    box_size=10, # Tamanho de cada "ponto" do QR code
    border=4, # Largura da borda branca
)

# 2. Adiciona os dados (o link desejado)
# Certifique-se que esta linha contém o link correto!
data_to_encode = "https://drive.google.com/file/d/1yJ9MfHXATpsp6gLlfmakqDg1COBo-75W/view?usp=drive_link"
qr.add_data(data_to_encode)

# 3. Compila os dados
qr.make(fit=True) # fit=True ajusta a versão se necessário

# 4. Cria a imagem do QR Code
img = qr.make_image(fill_color="black", back_color="white") # Cores personalizadas

# 5. Salva a imagem
output_filename = "qrcodeKALEO.png"
img.save(output_filename)

print(f"QR Code gerado com sucesso e salvo como '{output_filename}'!")
# O QR code deve conter o link: {data_to_encode}
print(f"Verifique se o QR code aponta para: {data_to_encode}")

