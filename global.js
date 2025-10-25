console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname,
// );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/N3il-kb', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local server
    : "/portfolio/";        // GitHub Pages repo name


for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // next step: create link and add it to nav

    url = !url.startsWith('http') ? BASE_PATH + url : url;
      // Create link and add it to nav
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname,
      );
    
    a.toggleAttribute('target', a.host !== location.host);
    if (a.host !== location.host) {
        a.target = '_blank';
        }  

    nav.append(a);
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
              <option value="light dark">Automatic</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
          </select>
      </label>`,
  );

const select = document.querySelector('.color-scheme select')

if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty(
        'color-scheme',
        localStorage.colorScheme
    );
    select.value = localStorage.colorScheme;
}

select.addEventListener('input', function (event) {
    const newScheme = event.target.value;
    console.log('color scheme changed to', event.target.value);

    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.colorScheme = newScheme;
  });

// Get a reference to the <form> element
const form = document.querySelector('form');

// Only run the logic if the form exists on the current page
if (form) {
    // 1. Add a listener for the 'submit' event
    form.addEventListener('submit', function (event) {
        // Prevent the default HTML form submission (which uses the old encoding)
        event.preventDefault(); 
        
        // Get the base URL from the form's action attribute (mailto:nbango@ucsd.edu)
        let url = form.action + '?'; 

        // Create a FormData object from the form to easily access all fields
        const data = new FormData(form);

        // 2. Iterate over the submitted fields and build the URL
        for (let [name, value] of data) {
            console.log(name, value);
            const encodedValue = encodeURIComponent(value); 
            url += `${name}=${encodedValue}&`; 
        }

        // Remove the trailing '&' character if the URL isn't empty
        if (url.endsWith('&')) {
            url = url.slice(0, -1);
        }
        
        // 3. Open the final, correctly encoded URL (which opens the email client)
        location.href = url;
    });
}
export async function fetchJSON(url) {
    try {
      const response = await fetch(url);
  
      console.log(response); // Optional: check in DevTools
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
  
    } catch (error) {
      console.error('Error fetching or parsing JSON data:', error);
      return null;
    }
  }
  
  export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!containerElement) {
      console.warn('No valid container element provided.');
      return;
    }
  
    // Clear any previous content
    containerElement.innerHTML = '';
  
    // Handle empty project list
    if (!Array.isArray(projects) || projects.length === 0) {
      containerElement.innerHTML = '<p>No projects found.</p>';
      return;
    }
  
    // Optional: Update project count if `.projects-title` element exists
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.textContent = `${projects.length} Projects`;
    }
  
    // Render each project
    projects.forEach(project => {
      const article = document.createElement('article');
  
      // Validate project fields and provide fallback
      const title = project.title || 'Untitled Project';
      const description = project.description || 'No description provided.';
      const image = project.image || 'images/placeholder.png'; // fallback placeholder image
      const year = project.year || ''; 
  
      // Build innerHTML with dynamic heading
      article.innerHTML = `
      <div class="project-card">
        <${headingLevel}>${title}</${headingLevel}>
        ${year ? `<p class="project-year">Year: ${year}</p>` : ''}
        <img src="${image}" alt="${title}">
        <p>${description}</p>
      </div>
    `;
    
    
  
      containerElement.appendChild(article);
    });
  }
  