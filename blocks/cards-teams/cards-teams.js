/*
 * cards-teams — investment-teams list (name → description), matching the
 * production "Our Equity Teams" table. Each authored row is [name link,
 * description]; rendered as a stacked list of linked team name + description.
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;
    const li = document.createElement('li');
    const name = document.createElement('div');
    name.className = 'cards-teams-name';
    name.append(...cells[0].childNodes);
    const desc = document.createElement('div');
    desc.className = 'cards-teams-desc';
    if (cells[1]) desc.append(...cells[1].childNodes);
    li.append(name, desc);
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
