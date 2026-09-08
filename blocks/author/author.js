import { createOptimizedPicture, getMetadata } from '../../scripts/aem.js';

export default function decorate(block) {
  const name = getMetadata('title');
  const role = getMetadata('role');
  const team = getMetadata('team');
  // The special `image` metadata key emits as og:image; fall back to a plain `image` meta.
  const image = getMetadata('og:image') || getMetadata('image');

  // Masthead (prepended, eager headshot for LCP).
  const masthead = document.createElement('div');
  masthead.className = 'author-masthead';
  if (image) {
    const pic = createOptimizedPicture(image, name, true, [{ width: '400' }]);
    pic.classList.add('author-photo');
    masthead.append(pic);
  }
  const meta = document.createElement('div');
  meta.className = 'author-meta';
  if (name) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    meta.append(h1);
  }
  if (role) {
    const roleEl = document.createElement('p');
    roleEl.className = 'author-role';
    roleEl.textContent = role;
    meta.append(roleEl);
  }
  if (team) {
    const teamEl = document.createElement('p');
    teamEl.className = 'author-team';
    teamEl.textContent = team;
    meta.append(teamEl);
  }
  masthead.append(meta);
  block.prepend(masthead);
}
