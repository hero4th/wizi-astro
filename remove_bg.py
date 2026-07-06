from PIL import Image

def remove_background(image_path, output_path, tolerance=50):
    print(f"Processing {image_path}...")
    img = Image.open(image_path)
    frames = []
    
    duration = img.info.get('duration', 100)
    
    for frame in range(0, img.n_frames):
        img.seek(frame)
        rgba = img.convert("RGBA")
        datas = rgba.getdata()
        
        newData = []
        for item in datas:
            if item[0] > 255 - tolerance and item[1] > 255 - tolerance and item[2] > 255 - tolerance:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
                
        rgba.putdata(newData)
        frames.append(rgba)

    frames[0].save(
        output_path, 
        format='GIF',
        save_all=True, 
        append_images=frames[1:], 
        loop=0, 
        duration=duration, 
        disposal=2,
        transparency=0
    )
    print(f"Saved to {output_path}")

try:
    remove_background("public/images/animation-faq.gif", "public/images/animation-faq-trans.gif")
except Exception as e:
    print("Error:", e)
