const upscaleForm = document.querySelector('#upscale-form');
const picker = document.querySelector('#upscale-file');
const factor = document.querySelector('#upscale-factor');
const preview = document.querySelector('#upscale-preview');
const save = document.querySelector('#upscale-save');
const message = document.querySelector('#upscale-status');
const comparison = document.querySelector('#upscale-comparison');
const before = document.querySelector('#upscale-before');
const split = document.querySelector('#upscale-split');
const difference = document.querySelector('#upscale-difference');
function updateSplit() {
  comparison.querySelector('.upscale-stage').style.setProperty('--split',split.value+'%');
  split.setAttribute('aria-valuetext',split.value+'% uploaded image');
}
split.addEventListener('input',updateSplit);
let revision = 0;
function resetOutput() {
  revision++;
  if (save.hasAttribute('href')) URL.revokeObjectURL(save.href);
  save.removeAttribute('href');
  preview.removeAttribute('src');
  if (before.hasAttribute('src')) URL.revokeObjectURL(before.src);
  before.removeAttribute('src');
  save.hidden = comparison.hidden = true;
  difference.textContent = '';
  message.textContent = '';
}
upscaleForm.addEventListener('change', event => {
  resetOutput();
  if (event.target === picker && picker.files.length) {
    factor.value = 'max';
    upscaleForm.requestSubmit();
  }
});
upscaleForm.addEventListener('submit', async event => {
  event.preventDefault();
  resetOutput();
  const current = revision;
  const file = picker.files[0];
  if (!file) return;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 32 * 1024 * 1024) {
    message.textContent = 'Choose a PNG, JPEG or WebP file up to 32 MB.';
    return;
  }
  message.textContent = 'Preparing your image…';
  const original = URL.createObjectURL(file);
  const canvas = document.createElement('canvas');
  try {
    const img = new Image();
    img.src = original;
    await img.decode();
    if (current !== revision) return;
    const maximum = factor.value === 'max';
    const scale = maximum ? Math.min(8192 / Math.max(img.naturalWidth,img.naturalHeight),
      Math.sqrt(32000000 / (img.naturalWidth * img.naturalHeight))) : Number(factor.value);
    if (maximum && scale < 1) throw Error('This image already exceeds the upscaler’s output limits. Keep the original for its full resolution.');
    const width = Math.max(1,Math.floor(img.naturalWidth * scale));
    const height = Math.max(1,Math.floor(img.naturalHeight * scale));
    if (width * height > 32000000 || Math.max(width,height) > 8192) throw Error('Choose a smaller scale or image. Output is limited to 32 megapixels and 8,192 pixels per side.');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw Error('Image resizing is unavailable in this browser.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(img,0,0,width,height);
    const png = await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    if (current !== revision) return;
    if (!png) throw Error('The browser could not export this image.');
    save.href = preview.src = URL.createObjectURL(png);
    save.download = file.name.replace(/\.[^.]*$/,'')+'-'+width+'x'+height+'.png';
    before.src = URL.createObjectURL(file);
    split.value = '50';
    updateSplit();
    const added = width * height - img.naturalWidth * img.naturalHeight;
    const ratio = width * height / (img.naturalWidth * img.naturalHeight);
    difference.textContent = added.toLocaleString()+' additional pixels · '+ratio.toLocaleString(undefined,{maximumFractionDigits:2})+'× the original pixel count. Both previews use the same display size.';
    save.hidden = comparison.hidden = false;
    message.textContent = img.naturalWidth+' × '+img.naturalHeight+' → '+width+' × '+height+' pixels. Your PNG is ready.';
  } catch (error) {
    if (current === revision) message.textContent = error.name === 'EncodingError' ? 'This image could not be opened.' : error.message;
  } finally {
    URL.revokeObjectURL(original);
    canvas.width = canvas.height = 0;
  }
});
