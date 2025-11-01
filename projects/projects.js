// projects.js
import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ---- Load data once ----
const projects = await fetchJSON('../lib/projects.json');

// ---- Static handles ----
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

// ---- Visual constants ----
const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let selectedIndex = -1;
let currentQuery = '';
// ---- Refactor all plotting into one function ----
function renderPieChart(projectsGiven) {
  // re-calculate rolled data
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let arcs = newArcData.map((d) => arcGenerator(d));

  // --- clear up paths and legends ---

  const legend = d3.select('.legend');
  legend.selectAll('*').remove();

  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  arcs.forEach((arc, i) => {
    svg.append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;
      
        svg.selectAll('path')
           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
        legend.selectAll('li')
           .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));
      
        // re-apply both filters
        const filteredByQuery = projects.filter((p) =>
          Object.values(p).join('\n').toLowerCase().includes(currentQuery)
        );
      
        const finalFiltered =
          selectedIndex === -1
            ? filteredByQuery
            : filteredByQuery.filter(
                (p) => p.year === newData[selectedIndex].label
              );
      
        renderProjects(finalFiltered, projectsContainer, 'h2');
      });      
  });
  


  // --- update legend (Step 2.2 style) ---
  legend
    .selectAll('li')
    .data(newData)
    .join('li')
    .attr('style', (_, i) => `--color:${colors(i)}`)
    .html((d) => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
}

// ---- Initial page render ----
renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

// ---- Filtering helpers (lab-style) ----
function setQuery(q) {
  const query = (q ?? '').toLowerCase();
  return projects.filter((p) =>
    Object.values(p).join('\n').toLowerCase().includes(query)
  );
}

// ---- Wire up search: re-render list + pie on change ----
searchInput?.addEventListener('input', (event) => {
  currentQuery = (event.target.value ?? '').toLowerCase();

  // apply both filters at once
  const filteredByQuery = projects.filter((p) =>
    Object.values(p).join('\n').toLowerCase().includes(currentQuery)
  );

  const finalFiltered =
    selectedIndex === -1
      ? filteredByQuery
      : filteredByQuery.filter(
          (p) => p.year === newData[selectedIndex].label
        );

  renderProjects(finalFiltered, projectsContainer, 'h2');
  renderPieChart(finalFiltered);
});


