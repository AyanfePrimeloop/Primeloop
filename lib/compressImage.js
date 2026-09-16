// Resizes an image file down to a max dimension before it's base64-encoded
// and sent to the AI check. This directly cuts vision-token cost — Claude
// bills roughly (width * height) / 750 tokens, so a full 2000px+ phone
// screenshot costs several times more than a compressed 900px version,
// with no real accuracy loss for reading UI states and short comment text.
export function compressImageFile(file, maxDimension = 900) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          const scale = maxDimension / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            const outReader = new FileReader();
            outReader.onload = () => resolve({ base64: outReader.result.split(',')[1], mediaType: 'image/jpeg' });
            outReader.onerror = reject;
            outReader.readAsDataURL(blob);
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
