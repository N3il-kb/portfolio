import { fetchJSON, renderProjects } from './global.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Fetch all project data
  const projects = await fetchJSON('lib/projects.json');

  // 2. Select the container on the homepage
  const projectsContainer = document.querySelector('.projects');

  // 3. Filter the latest 3 projects (safely)
  const latestProjects = Array.isArray(projects) ? projects.slice(0, 3) : [];

  // 4. Render the latest projects using reusable function
  renderProjects(latestProjects, projectsContainer, 'h2');
});

async function fetchGitHubData(username) {
    const response = await fetch(`https://api.github.com/users/${username}`);
    return response.json();
  }
  
  async function loadGitHubStats() {
    const githubData = await fetchGitHubData('N3il-kb');
    const profileStats = document.querySelector('#profile-stats');
  
    if (profileStats) {
      profileStats.innerHTML = `
        <section class="github-stats">
        <h2>My GitHub Stats</h2>
        <dl>
          <dt>Followers</dt><dd>${githubData.followers}</dd>
          <dt>Following</dt><dd>${githubData.following}</dd>
          <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
          <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        </dl>
        </section>
      `;
    }
  }
  
  // run the function on page load
  loadGitHubStats();
  