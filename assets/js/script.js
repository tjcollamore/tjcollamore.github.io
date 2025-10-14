document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

function showTab(tabId) {
  // Sections
  document.querySelectorAll('.tab').forEach(s => s.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');

  // Nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));

  // Title
  const titles = {
    home: 'TJ Collamore',
    experiences: 'Experiences',
    about: 'About Me'
  };
  document.getElementById('page-title').textContent = titles[tabId];
}

// load data & populate
fetch('profile.json')
  .then(r => r.json())
  .then(data => {
    // HOME
    const home = document.getElementById('home');
    home.innerHTML = `
      <div class="home-content">
        <p class="home-intro">${data.home}</p>
        <div class="slideshow-container">
          <img class="slide" src="images/slide1.jpg" alt="">
          <img class="slide" src="images/slide2.jpg" alt="">
          <img class="slide" src="images/slide3.jpg" alt="">
          <img class="slide" src="images/slide4.jpg" alt="">
        </div>
        <div class="slideshow-buttons">
          <button onclick="window.location.href='docs/resume.pdf'">
            <i class="fa-regular fa-file-lines"></i> Resume
          </button>
          <button onclick="window.open('https://www.linkedin.com/in/april-collamore-74b06a2a8/')">
            <i class="fa-brands fa-linkedin"></i> LinkedIn
          </button>
        </div>
      </div>
    `;
    startSlideshow();

    // EXPERIENCES
    const experiencesSection = document.getElementById("experiences");

    const seasonOrder = { Spring: 1, Summer: 2, Fall: 3, Winter: 4, Present: 5 };
    const currentYear = new Date().getFullYear();

    const sortedExperiences = data.experiences.sort((a, b) => {
      // Handle "Present" specially
      const isPresentA = a.season === "Present";
      const isPresentB = b.season === "Present";

      if (isPresentA && !isPresentB) return -1;
      if (!isPresentA && isPresentB) return 1;
      if (isPresentA && isPresentB) return 0;

      // Determine if it's future or past
      const aFuture = a.year > currentYear;
      const bFuture = b.year > currentYear;

      if (aFuture && !bFuture) return -1;
      if (!aFuture && bFuture) return 1;

      if (aFuture && bFuture) {
        // For future events, sort ascending
        return (a.year - b.year) || (seasonOrder[a.season] - seasonOrder[b.season]);
      } else {
        // For past events, sort descending (most recent first)
        return (b.year - a.year) || (seasonOrder[b.season] - seasonOrder[a.season]);
      }
    });

    experiencesSection.innerHTML = `
      <div class="timeline">
        ${sortedExperiences.map((exp, expIdx) => `
          <div class="timeline-entry">
            <img src="${exp.logo}" alt="${exp.title} logo" class="timeline-logo"/>
            <div class="timeline-details">
              <div class="timeline-date">
                ${exp.season} ${exp.year}${exp.end ? ` – ${exp.end}` : ""}
              </div>
              <h3>${exp.title}</h3>
              <p>${exp.shortDescription}</p>

              ${
                // if there are projects, render inline boxes…
                exp.projects && exp.projects.length
                  ? `<div class="project-boxes">
                      ${exp.projects.map((proj, projIdx) => `
                        <div class="project-box">
                          <h4>${proj.title}</h4>
                          <img src="${proj.image}" alt="${proj.title}" class="project-image"/>
                          <button 
                            class="project-read-more-btn" 
                            onclick="openProjectModal(${expIdx}, ${projIdx})">
                            Read More
                          </button>
                        </div>
                      `).join("")}
                    </div>`
                  // …otherwise fallback to the generic Read More
                  : exp.hideReadMore ? "" : `<button class="read-more-btn" onclick="openModal(${expIdx})">
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

    // ABOUT
    fetch(data.about)           // e.g. "about.txt"
      .then(res => res.text())
      .then(text => {
        const aboutEl = document.getElementById('about');
        aboutEl.innerHTML = `
          <div class="about-content">
            <div class="photo-wrapper">
              <img src="images/profile.jpg" class="about-photo" alt="My Photo">
            </div>
            <div class="about-right">
              <p class="about-bio">${text
                .replace(/\n/g, '<br>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')}
              </p>
            </div>
          </div>
        `;
      })
  });

// slideshow
function startSlideshow() {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;
  let i = 0;
  slides[i].style.display = 'block';
  setInterval(() => {
    slides[i].style.display = 'none';
    i = (i+1)%slides.length;
    slides[i].style.display = 'block';
  }, 4000);
}

// modal
function openModal(idx) {
  fetch('profile.json')
    .then(r => r.json())
    .then(data => {
      const proj = data.experiences[idx];
      const body = document.getElementById('modal-body');
      body.innerHTML = `
        <h2>${proj.title}</h2>
        ${proj.projects.map(p=>`
          <div class="modal-project">
            <h3>${p.title}</h3>
            ${p.description.map(d=>`<p>${d}</p>`).join('')}
            <h4>Skills:</h4>
            <ul>${p.skills.map(s=>`<li>${s}</li>`).join('')}</ul>
          </div>
        `).join('')}
      `;
      document.getElementById('modal').style.display = 'flex';
    });
}
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

// new helper for project‑specific modals
function openProjectModal(expIdx, projIdx) {
  fetch("profile.json")
    .then(res => res.json())
    .then(data => {
      const proj = data.experiences[expIdx].projects[projIdx];
      const body = document.getElementById("modal-body");
      body.innerHTML = `
        <h2>${proj.title}</h2>
        ${proj.description.map(p => `<p>${p}</p>`).join("")}
        <h4>Skills:</h4>
        <ul>${proj.skills.map(s => `<li>${s}</li>`).join("")}</ul>
      `;
      document.getElementById("modal").style.display = "flex";
    });
}
