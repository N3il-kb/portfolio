import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch data
  const projects = await fetchJSON('../lib/projects.json');

  // 2. Select the projects container
  const projectsContainer = document.querySelector('.projects');

  // 3. Render the projects using dynamic <h2> headings
  renderProjects(projects, projectsContainer, 'h2');
});

const projects = await fetchJSON('../lib/projects.json');
let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let total = 0;

let data = rolledData.map(([year, count]) => {
  return { value: count, label: year };
});

let angle = 0;


let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let svg = d3.select('svg');

arcs.forEach((arc, index) => {
  svg.append('path').attr('d', arc).attr('fill', colors(index));
});

// === ADD LEGEND ===
const legend = d3.select('.legend');

// Clear old legend if it exists
legend.selectAll('*').remove();

legend
  .selectAll('li')
  .data(data)
  .join('li')
  .attr('style', (_, i) => `--color:${colors(i)}`)
  .html(
    (d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
  );
