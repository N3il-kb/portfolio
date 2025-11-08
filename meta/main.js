import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let commitXScale;
let commitYScale;

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
        });
  
        return ret;
      });
  }
  
  function renderCommitInfo(data, commits) {
    // Clear old stats (if you reload)
    d3.select('#stats').html('');
  
    // Create container
    const summary = d3.select('#stats')
      .append('section')
      .attr('class', 'summary');
  
    // Add title
    summary.append('h2').text('Summary');
  
    // Create grid
    const grid = summary.append('div')
      .attr('class', 'summary-grid');
  
    // Calculate stats
    const numFiles = new Set(data.map(d => d.file)).size;
    const maxDepth = d3.max(data, d => d.depth);
    const longestLine = d3.max(data, d => d.length);
    const maxFileLength = d3.max(
      d3.rollups(data, v => v.length, d => d.file),
      ([, len]) => len
    );
  
    // Define data for display
    const stats = [
      { label: 'COMMITS', value: commits.length },
      { label: 'FILES', value: numFiles },
      { label: 'TOTAL LOC', value: data.length },
      { label: 'MAX DEPTH', value: maxDepth },
      { label: 'LONGEST LINE', value: longestLine },
      { label: 'MAX LINES', value: maxFileLength }
    ];
  
    // Render all items dynamically
    const items = grid.selectAll('.summary-item')
      .data(stats)
      .enter()
      .append('div')
      .attr('class', 'summary-item');
  
    items.append('p')
      .attr('class', 'label')
      .text(d => d.label);
  
    items.append('p')
      .attr('class', 'value')
      .text(d => d.value);
  }
  
//   const fileLengths = d3.rollups(
//     data,
//     (v) => d3.max(v, (v) => v.line),
//     (d) => d.file,
//   );
//   const averageFileLength = d3.mean(fileLengths, (d) => d[1]);

//   const workByPeriod = d3.rollups(
//     data,
//     (v) => v.length,
//     (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }),
//   );

//   const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];

function createBrushSelector(svg) {
    // Create brush
svg.call(d3.brush());

// Raise dots and everything after overlay
svg.selectAll('.dots, .overlay ~ *').raise();

svg.call(d3.brush().on('start brush end', brushed));
}  

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
  
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    
  
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(sortedCommits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
    commitXScale = xScale;
  
    const yScale = d3
      .scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);
    commitYScale = yScale;
  
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat(
      (d) => String(d % 24).padStart(2, '0') + ':00'
    );
  
    svg
      .append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(xAxis);
  
    svg
      .append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(yAxis);
  
    const gridlines = svg
      .append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

      
  
    // ✅ Step 4.1: Create radius scale inside renderScatterPlot
    const [minLines, maxLines] = d3.extent(sortedCommits, (d) => d.totalLines);
    const rScale = d3
    .scaleSqrt() // Change only this line
    .domain([minLines, maxLines])
    .range([4, 25]);
    
  
    // ✅ Create dots and use radius scale
    const dots = svg
      .append('g')
      .attr('class', 'dots')
      .selectAll('circle')
      .data(sortedCommits)
      .join('circle')
      .attr('cx', (d) => xScale(d.datetime))
      .attr('cy', (d) => yScale(d.hourFrac))
      .attr('r', (d) => rScale(d.totalLines)) // use radius scale here
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
  
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mousemove', (event) => {
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });

      dots.selectAll('circle').data(sortedCommits).join('circle');

      createBrushSelector(svg);
  }
  
  
  
  
  function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const linesEdited = document.getElementById('commit-lines-edited');
  
    if (!commit || Object.keys(commit).length === 0) return;
  
    // Fill tooltip fields
    link.href = commit.url;
    link.textContent = commit.id;
  
    date.textContent = commit.datetime?.toLocaleDateString('en', {
      dateStyle: 'full',
    }) ?? 'Unknown';
  
    time.textContent = commit.datetime?.toLocaleTimeString('en', {
      hour: '2-digit',
      minute: '2-digit',
    }) ?? '--:--';
  
    author.textContent = commit.author ?? 'Unknown';
  
    linesEdited.textContent = commit.totalLines?.toLocaleString() ?? '0';
  }

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!tooltip) return;

  if (isVisible) {
    tooltip.hidden = false;  // <-- unhide explicitly
    tooltip.style.opacity = '1';
    tooltip.style.visibility = 'visible';
  } else {
    tooltip.style.opacity = '0';
    tooltip.style.visibility = 'hidden';
    setTimeout(() => {
      tooltip.hidden = true; // <-- hide after transition
    }, 500);
  }
}


function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function brushed(event) {
    const selection = event.selection;
  
    // Highlight selected circles
    d3.selectAll('circle').classed('selected', (d) =>
      isCommitSelected(selection, d)
    );
  
    // ✅ Update count display
    renderSelectionCount(selection);
    renderLanguageBreakdown(selection)
  }
  
  function renderSelectionCount(selection) {
    // Use global commits array (declared later)
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
  
    // Handle missing element gracefully
    if (!countElement) return;
  
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  }
  
  
  function isCommitSelected(selection, commit) {
    if (!selection || !commitXScale || !commitYScale) {
      return false;
    }
    const [[x0, y0], [x1, y1]] = selection;
    const cx = commitXScale(commit.datetime);
    const cy = commitYScale(commit.hourFrac);
    return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }

let data = await loadData();
let commits = processCommits(data);

renderScatterPlot(data, commits);
renderCommitInfo(data, commits);

const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
const rScale = d3.scaleLinear().domain([minLines, maxLines]).range([2, 30]); // adjust these values based on your experimentation
