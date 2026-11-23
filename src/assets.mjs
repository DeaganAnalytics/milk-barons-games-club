export function loadImage(path) {
  const image = new Image();
  image.src = new URL('../assets/' + path, import.meta.url);
  return image;
}
