// Focal point for each photo (CSS object-position, "x% y%").
// When a photo is cropped (arch, cards, phone layouts) this point stays in view,
// so faces, hands and the paste are never cut off. New uploads default to the centre.
export const FOCAL = {
  'client-neckline.jpg': '50% 40%',
  'client-portrait-flower.jpg': '58% 28%',
  'client-portrait-shoulder.jpg': '50% 30%',
  'client-portrait-side.jpg': '50% 30%',
  'client-portrait-studio.jpg': '42% 26%',
  'client-robe.jpg': '50% 50%',
  'laser-client-underarm.jpg': '58% 40%',
  'laser-knee.jpg': '42% 45%',
  'laser-leg-closeup.jpg': '55% 42%',
  'laser-therapist-legs.jpg': '45% 35%',
  'laser-therapist-underarm.jpg': '50% 55%',
  'laser-underarm.jpg': '45% 45%',
  'sugaring-arm-treatment.jpg': '50% 45%',
  'sugaring-bikini-line.jpg': '45% 45%',
  'sugaring-leg-black-gloves.jpg': '55% 38%',
  'sugaring-leg-closeup.jpg': '55% 42%',
  'sugaring-leg-strip.jpg': '40% 45%',
  'sugaring-paste-shoulder.jpg': '50% 48%',
  'therapist-portrait.jpg': '50% 26%',
  'therapist-sugaring-leg.jpg': '50% 28%',
  'therapist-sugaring-legs.jpg': '42% 38%',
  'therapist-sugaring-studio.jpg': '42% 38%',
  'therapist-with-paste.jpg': '40% 30%',
};

export function focalFor(path) {
  if (!path) return '50% 50%';
  const file = path.split('/').pop();
  return FOCAL[file] ?? '50% 50%';
}
