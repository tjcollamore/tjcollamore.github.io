document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
}

function startSlideshow() {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;
  let i = 0;
  slides[i].style.display = 'block';
  setInterval(() => {
    slides[i].style.display = 'none';
    i = (i + 1) % slides.length;
    slides[i].style.display = 'block';
  }, 4000);
}

function openModalFromArray(array, idx) {
  const proj = array[idx];
  const body = document.getElementById('modal-body');
  body.innerHTML = `
    <h2>${proj.title}</h2>
    ${proj.projects.map(p => `
      <div class="modal-project">
        <h3>${p.title}</h3>
        ${p.description.map(d => `<p>${d}</p>`).join('')}
        <h4>Skills:</h4>
        <ul>${p.skills.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
    `).join('')}
  `;
  document.getElementById("modal").style.display = "flex";
}

function openProjectModalFromArray(array, expIdx, projIdx) {
  const proj = array[expIdx].projects[projIdx];
  const body = document.getElementById("modal-body");

  // Case 1: PDF file (new logic)
  if (proj.file && proj.file.endsWith(".pdf")) {
    openPdfModal(proj.file, proj.title);
    return; // Skip building a second modal layer
  }

  let embedHtml = "";

  // Case 2: embedded video/game
  if (proj.embed) {
    embedHtml = `<div class="modal-embed">${proj.embed}</div><hr>`;
  }

  // Case 3: lab notebook viewer
  if (proj.notebook) {
    let currentPage = 1;
    const { folder, pageCount, extension } = proj.notebook;

    embedHtml = `
      <div class="notebook-viewer">
        <img id="notebook-image" src="${folder}/1.${extension}" alt="Notebook Page" />
        <div class="notebook-controls">
          <button id="prev-page" disabled>⟵ Prev</button>
          <span id="page-counter">Page 1 of ${pageCount}</span>
          <button id="next-page">Next ⟶</button>
        </div>
      </div>
    `;
  }

  // Inject content FIRST (so elements exist)
  body.innerHTML = `
    <h2>${proj.title}</h2>
    ${embedHtml}
    ${proj.description.map(p => `<p>${p}</p>`).join("")}
    <h4>Skills:</h4>
    <p class="skills-line">${proj.skills.join(", ")}</p>
  `;

  document.getElementById("modal").style.display = "flex";

  // THEN safely attach event listeners AFTER DOM is updated
  if (proj.notebook) {
    let currentPage = 1;
    const { folder, pageCount, extension } = proj.notebook;
    const img = document.getElementById("notebook-image");
    const counter = document.getElementById("page-counter");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");

    const updateNotebookPage = () => {
      img.src = `${folder}/${currentPage}.${extension}`;
      counter.textContent = `Page ${currentPage} of ${pageCount}`;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === pageCount;
    };

    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        updateNotebookPage();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage < pageCount) {
        currentPage++;
        updateNotebookPage();
      }
    });
  }
}

function closeModal() {
  const modal = document.getElementById("modal");
  modal.style.display = "none";

  // Stop any <video> or <audio> elements playing inside
  modal.querySelectorAll("video, audio").forEach(el => {
    el.pause();
    el.currentTime = 0; // optional: rewind to start
  });

  // Reset any <iframe> (e.g., YouTube or Scratch embeds) by reloading them
  modal.querySelectorAll("iframe").forEach(iframe => {
    iframe.src = iframe.src;
  });
}


function openPdfModal(file, title) {
  const modal = document.getElementById("pdf-modal");
  const body = document.getElementById("pdf-viewer-body");

  body.innerHTML = `
    <div class="pdf-inner">
      <h2>${title}</h2>
      <iframe src="${file}" title="${title} PDF Viewer"></iframe>
    </div>
  `;

  modal.style.display = "flex";
}

function closePdfModal() {
  document.getElementById("pdf-modal").style.display = "none";
}

function renderTimeline(containerId, dataArray) {
  const section = document.getElementById(containerId);
  const seasonOrder = { Winter: 1, Spring: 2, Summer: 3, Fall: 4, Present: 5 };
  const currentYear = new Date().getFullYear();

  const sorted = dataArray.sort((a, b) => {
    const isPresentA = a.season === "Present";
    const isPresentB = b.season === "Present";
    if (isPresentA && !isPresentB) return -1;
    if (!isPresentA && isPresentB) return 1;
    if (isPresentA && isPresentB) return 0;

    const aFuture = a.year > currentYear;
    const bFuture = b.year > currentYear;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;

    // Sort by year descending, then by seasonOrder descending
    if (a.year !== b.year) return b.year - a.year;
    return seasonOrder[b.season] - seasonOrder[a.season];
  });

  section.innerHTML = `
    <div class="timeline">
      ${sorted.map((exp, expIdx) => `
        <div class="timeline-entry">
          <img src="${exp.logo}" alt="${exp.title} logo" class="timeline-logo"/>
          <div class="timeline-details">
            <div class="timeline-date">
              ${exp.season} ${exp.year}${exp.end ? ` – ${exp.end}` : ""}
            </div>
            <h3>${exp.title}</h3>
            <p>${exp.shortDescription}</p>

            ${
              exp.projects && exp.projects.length
                ? `<div class="project-boxes">
                    ${exp.projects.map((proj, projIdx) => `
                      <div class="project-box">
                        <h4>${proj.title}</h4>
                        <img src="${proj.image}" alt="${proj.title}" class="project-image"/>
                        <button 
                          class="project-read-more-btn"
                          onclick="openProjectModalFromArray(data.${containerId}, ${expIdx}, ${projIdx})">
                          ${proj.buttonLabel || "Read More"} 
                        </button>
                      </div>
                    `).join("")}
                  </div>`
                : exp.hideReadMore ? "" : `<button class="read-more-btn" onclick="openModalFromArray(data.${containerId}, ${expIdx})">
                    Read More
                  </button>`
            }
          </div>
        </div>
      `).join("")}
    </div>
    <div id="modal" class="modal">
      <div class="modal-content">
        <span class="modal-close" onclick="closeModal()">&times;</span>
        <div id="modal-body"></div>
      </div>
    </div>
  `;
}

let data = null;

fetch('assets/js/profile.json')
  .then(r => r.json())
  .then(json => {
    data = json;
    
    // Timeline tabs
    renderTimeline("experiences", data.experiences);
    renderTimeline("projects", data.projects);

    // ESSAYS
    const essaysSection = document.getElementById('essays-list');
    if (data.essays && data.essays.length) {
      essaysSection.innerHTML = data.essays.map(e => `
        <div class="essay-card">
          <div class="essay-content">
            <h3>${e.title}</h3>
            ${e.tagline ? `<p class="essay-tagline">${e.tagline}</p>` : ""}
            <p>${e.description || ''}</p>
            <button class="essay-btn" onclick="openPdfModal('${e.file}', '${e.title}')">
              <i class="fa-regular fa-file-pdf"></i> View PDF
            </button>
          </div>
        </div>
      `).join('');
    }

// ABOUT
const aboutEl = document.getElementById('about');

aboutEl.innerHTML = `
  <div class="intro-hero">
    <img
      src="assets/images/profile.jpg"
      alt="TJ Collamore"
      class="intro-photo"
    >

    <div class="intro-text">
      <h2>Hi,</h2>
      <p>${data.home}</p>

      <div class="intro-buttons">
        <button
          onclick="window.location.href='assets/text/TJCollamore-resume.pdf'"
        >
          <i class="fa-regular fa-file-lines"></i>
          Resume
        </button>

        <button
          onclick="window.open('https://www.instagram.com/tj.collamore/')"
        >
          <i class="fa-brands fa-instagram"></i>
          Instagram
        </button>
      </div>
    </div>
  </div>


<section class="current-project">
  <div class="current-project-heading">
    <div>
      <p class="project-eyebrow">CURRENT PROJECT</p>
      <h2>TJ's Blackjack</h2>
    </div>

    <span class="project-status">
      In Development
    </span>
  </div>

  <p class="current-project-summary">
    A casino-style desktop blackjack game and training tool built in Java
    and JavaFX. The project combines configurable casino rules, animated
    gameplay, basic-strategy coaching, Monte Carlo decision analysis, and
    realistic table interactions in a cross-platform desktop application.
  </p>


  <div class="blackjack-showcase">
    <div class="blackjack-video-wrapper">
      <video
        class="blackjack-video"
        controls
        muted
        playsinline
        poster="assets/images/blackjack-preview.png"
      >
        <source
          src="assets/video/blackjack-demo.mp4"
          type="video/mp4"
        >

        Your browser does not support embedded video.
      </video>
    </div>

    <div class="blackjack-overview">
      <h3>Built as more than a card game</h3>

      <p>
        TJ's Blackjack began as a project to teach myself Java programming
        and to tutor others. I developed more than 100 hand-written steps
        and sub-steps, beginning with classes such as Suit, Rank, Card, Deck,
        Shoe, and Hand, and gradually building toward larger components such
        as SceneCreator, Round, and PlayerHandStrategy.
      </p>

      <p>
        Once the core gameplay was established, I transitioned to an AI
        pair-programming workflow, initially for UI development and later for
        broader feature work. To preserve the educational value of the
        project, I make all suggested AI edits by hand and review the resulting
        architecture and behavior.
      </p>

      <p>
        The game has since grown into a full desktop application designed for
        realistic casino-style gameplay, especially for social players with an
        analytical mindset. Its architecture separates blackjack rules,
        simulation logic, and JavaFX presentation so the same decision engines
        can support interactive play, automated simulations, training features,
        and future native-mobile development.
      </p>

<div class="download-buttons">
  <a
    class="download-btn primary-download"
    href="https://github.com/tjcollamore/tj-blackjack-releases/releases/download/v1.0.0/TJ-Blackjack-Windows.zip"
  >
    <i class="fa-brands fa-windows"></i>
    Download for Windows
  </a>

  <a
    class="download-btn"
    href="https://github.com/tjcollamore/tj-blackjack-releases/releases/download/v1.0.0/TJ-Blackjack-macOS.zip"
  >
    <i class="fa-brands fa-apple"></i>
    Download for macOS
  </a>

  <a
    class="download-btn github-btn"
    href="https://github.com/tjcollamore/tj-blackjack"
    target="_blank"
    rel="noopener noreferrer"
  >
    <i class="fa-brands fa-github"></i>
    View Source on GitHub
  </a>
</div>

<div class="download-note">
        <p>
          <strong>Windows:</strong>
          Download and unzip the package, then run the application.
          The build is not yet code-signed, so Windows may display a security
          warning.
        </p>

        <p>
          <strong>macOS:</strong>
          Download and unzip the package. Because the current build is not yet
          signed or notarized, macOS may report that the app is damaged or
          cannot be opened. To run this development build, open Terminal and
          enter:
        </p>

        <pre><code>xattr -cr "$HOME/Downloads/TJ's Blackjack.app"</code></pre>

        <p>
          Then open <strong>TJ's Blackjack</strong> normally from Finder.
          Apple Developer ID signing and notarization are currently being
          configured so this extra step will not be required in future builds.
        </p>
      </div>
    </div>
  </div>


  <div class="blackjack-details-grid">
    <div class="blackjack-detail-card">
      <h3>
        <i class="fa-solid fa-code"></i>
        Technologies
      </h3>

      <ul>
        <li>Java</li>
        <li>JavaFX desktop interface</li>
        <li>Maven build system</li>
        <li>Git and GitHub</li>
        <li>GitHub Actions cross-platform builds</li>
        <li>Java <code>jpackage</code> desktop packaging</li>
      </ul>
    </div>


    <div class="blackjack-detail-card">
      <h3>
        <i class="fa-solid fa-diagram-project"></i>
        Architecture & Design
      </h3>

      <ul>
        <li>
          Strategy pattern for player, dealer, and basic-strategy decisions
        </li>

        <li>
          Separate game engines for player-round and dealer play
        </li>

        <li>
          Listener/callback architecture connecting game logic to animation
        </li>

        <li>
          Reusable animation classes for cards, chips, and training signals
        </li>

        <li>
          Shared decision logic between live gameplay and simulation
        </li>

        <li>
          Configurable game rules through a centralized settings model
        </li>
      </ul>
    </div>


    <div class="blackjack-detail-card">
      <h3>
        <i class="fa-solid fa-dice"></i>
        Game Features
      </h3>

      <ul>
        <li>Animated cards, chips, payouts, and split hands</li>
        <li>Multiple table-felt themes</li>
        <li>1, 2, 6, or 8-deck shoes</li>
        <li>Hit, stand, double, split, and surrender</li>
        <li>Double-after-split configuration</li>
        <li>Dealer hits or stands on soft 17</li>
        <li>3:2 and 6:5 blackjack payout rules</li>
        <li>Bankroll and wager management</li>
        <li>Color-up and casino-style table presentation</li>
      </ul>
    </div>


    <div class="blackjack-detail-card">
      <h3>
        <i class="fa-solid fa-graduation-cap"></i>
        Training & Analysis
      </h3>

      <ul>
        <li>Optional basic-strategy recommendations</li>
        <li>Single-, double-, and multi-deck strategy logic</li>
        <li>Decision Help for difficult hands</li>
        <li>Monte Carlo analysis of available actions</li>
        <li>Optional real-casino hand-signal animations</li>
        <li>Training features remain separate from normal gameplay</li>
      </ul>
    </div>
  </div>
</section>
`;
    
});
