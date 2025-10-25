import { fetchJSON, renderProjects } from '../global.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch data
  const projects = await fetchJSON('../lib/projects.json');

  // 2. Select the projects container
  const projectsContainer = document.querySelector('.projects');

  // 3. Render the projects using dynamic <h2> headings
  renderProjects(projects, projectsContainer, 'h2');
});
