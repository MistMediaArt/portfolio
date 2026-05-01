// Data State
let portfolioData = { sections: [], projects: [] };
let activeSection = 'ai'; // Default to AI
let activeSubCategory = null;
let activeProject = null; // Currently featured project

// DOM Elements
const terminalRoot = document.getElementById('terminal-root');
const filtersContainer = document.getElementById('category-filters');
const subFiltersContainer = document.getElementById('sub-filters');

// Initialize Terminal
async function initTerminal() {
    const bootPromise = runBootAnimation();
    
    try {
        const response = await fetch('./projects.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}: DATA NOT FOUND`);
        
        portfolioData = await response.json();
        
        // Initial setup
        if (portfolioData.sections.length > 0) {
            activeSection = portfolioData.sections[0];
            updateStateForSection(activeSection);
        }
        
        renderNav();
        renderContent();
        
        await bootPromise;
    } catch (error) {
        await bootPromise;
        terminalRoot.innerHTML = `
            <div style="padding: 2rem;">
                <h2 class="status-error">CRITICAL FAILURE</h2>
                <p>UNABLE TO PARSE PROJECTS.JSON. <br>${error.message}</p>
            </div>
        `;
    }
}

// State Updates
function updateStateForSection(section) {
    activeSection = section;
    const projectsInSection = portfolioData.projects.filter(p => p.section === section);
    
    // Determine if we have subcategories
    const subCategories = [...new Set(projectsInSection.map(p => p.sub_category).filter(Boolean))];
    
    if (subCategories.length > 0) {
        activeSubCategory = subCategories[0]; // Default to first sub
    } else {
        activeSubCategory = null;
    }
    
    // Set active project
    const filteredProjects = getFilteredProjects();
    activeProject = filteredProjects.length > 0 ? filteredProjects[0] : null;
}

function updateStateForSubCategory(subCat) {
    activeSubCategory = subCat;
    const filteredProjects = getFilteredProjects();
    activeProject = filteredProjects.length > 0 ? filteredProjects[0] : null;
}

function getFilteredProjects() {
    return portfolioData.projects.filter(p => {
        if (p.section !== activeSection) return false;
        if (activeSubCategory && p.sub_category !== activeSubCategory) return false;
        return true;
    });
}

// Render Navigation
function renderNav() {
    // Main Nav
    filtersContainer.innerHTML = portfolioData.sections.map(sec => 
        `<button class="${sec === activeSection ? 'active' : ''}" data-section="${sec}">${sec.replace('_', ' ').toUpperCase()}</button>`
    ).join('');

    filtersContainer.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            updateStateForSection(e.target.dataset.section);
            renderNav();
            renderContent();
        });
    });

    // Sub Nav
    const projectsInSection = portfolioData.projects.filter(p => p.section === activeSection);
    const subCategories = [...new Set(projectsInSection.map(p => p.sub_category).filter(Boolean))];

    if (subCategories.length > 0) {
        subFiltersContainer.style.display = 'flex';
        subFiltersContainer.innerHTML = subCategories.map(sub => 
            `<button class="${sub === activeSubCategory ? 'active' : ''}" data-sub="${sub}">${sub.replace('_', ' ').toUpperCase()}</button>`
        ).join('');

        subFiltersContainer.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                updateStateForSubCategory(e.target.dataset.sub);
                renderNav();
                renderContent();
            });
        });
    } else {
        subFiltersContainer.style.display = 'none';
        subFiltersContainer.innerHTML = '';
    }
}

// Render Content
function renderContent() {
    const projects = getFilteredProjects();

    if (projects.length === 0) {
        terminalRoot.innerHTML = `<div style="padding: 2rem; color: var(--text-muted);">NO RECORDS FOUND FOR CURRENT SELECTION</div>`;
        return;
    }

    if (!activeProject) activeProject = projects[0];

    // Reusable Carousel HTML
    const carouselHTML = projects.length > 1 ? `
        <div class="carousel-container">
            <button class="scroll-btn scroll-left" id="scroll-left">&lt;</button>
            <button class="scroll-btn scroll-right" id="scroll-right">&gt;</button>
            <div class="side-carousel-wrapper" id="carousel-wrapper">
                ${projects.map(p => `
                    <div class="carousel-item ${p.id === activeProject.id ? 'active' : ''}" data-id="${p.id}">
                        <div class="carousel-thumbnail">
                            ${getMediaHTML(p.media, false)}
                        </div>
                        <div class="carousel-meta">
                            CLIENT: <span style="color: var(--text-main); display: inline;">${p.client || 'INTERNAL'}</span><br>
                            ID: <span style="color: var(--text-main); display: inline;">${p.id}</span><br>
                            TYPE: <span style="color: var(--text-main); display: inline;">${p.type || 'SIMULATION'}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    let featuredHTML = '';

    if (activeProject.template === 'case_study') {
        featuredHTML = `
            <div class="featured-layout case-study-layout">
                <div class="main-viewer-container">
                    <div class="main-video-wrapper" style="aspect-ratio: auto; min-height: 400px; background: none;">
                        <img src="${activeProject.media.fallback_image}" alt="Case Study Image" style="width: 100%; height: auto; object-fit: contain; border: 1px solid var(--grid-line-color);">
                    </div>
                    <h1 class="main-title" style="margin-top: 2rem;">${activeProject.title}</h1>
                    
                    <div class="case-study-content">
                        <div class="cs-block">
                            <h3 class="cs-heading">[ WHAT IT IS ]</h3>
                            <p>${activeProject.content.what_it_is}</p>
                        </div>
                        
                        <div class="cs-block">
                            <h3 class="cs-heading">[ KEY FEATURES ]</h3>
                            <ul class="cs-list">
                                ${Object.entries(activeProject.content.features || {}).map(([k, v]) => `
                                    <li><strong>${k}</strong>: ${v}</li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <div class="cs-block">
                            <h3 class="cs-heading">[ WHO IT'S FOR ]</h3>
                            <ul class="cs-list">
                                ${(activeProject.content.who_its_for || []).map(i => `<li>${i}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="side-panel">
                    <div class="panel-header">
                        <h2>MEDIA ARTIST /<br>VFX PROFESSIONAL</h2>
                    </div>
                    
                    <div class="system-status">
                        SYSTEM STATUS: <span class="status-operational">${activeProject.status || 'OPERATIONAL'}</span>
                    </div>

                    <div class="cs-links">
                        ${Object.entries(activeProject.content.links || {}).map(([k, v]) => `
                            <a href="${v}" target="_blank" class="cs-link-btn">>> [ ${k.toUpperCase()} ]</a>
                        `).join('')}
                    </div>
                    
                    ${carouselHTML}
                    
                    <div class="metadata-grid">
                        ${(activeProject.content.tech_stack || []).map(tech => `
                            <div>TECH<span>${tech}</span></div>
                        `).join('')}
                        ${Object.entries(activeProject.metadata || {}).map(([k, v]) => `
                            <div>${k.toUpperCase().replace('_', ' ')}<span>${v}</span></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Standard Layout
        featuredHTML = `
            <div class="featured-layout">
                <div class="main-viewer-container">
                    <div class="main-video-wrapper" id="main-video-wrapper">
                        ${getMediaHTML(activeProject.media, true)}
                        <button class="fullscreen-btn" id="fullscreen-btn">[ FULLSCREEN ]</button>
                    </div>
                    <h1 class="main-title">${activeProject.title}</h1>
                </div>
                
                <div class="side-panel">
                    <div class="panel-header">
                        <h2>MEDIA ARTIST /<br>VFX PROFESSIONAL</h2>
                    </div>
                    
                    <div class="system-status">
                        SYSTEM STATUS: <span class="status-operational">${activeProject.status || 'OPERATIONAL'}</span>
                    </div>
                    
                    ${carouselHTML}
                    
                    <div class="metadata-grid">
                        ${Object.entries(activeProject.metadata || {}).map(([k, v]) => `
                            <div>${k.toUpperCase().replace('_', ' ')}<span>${v}</span></div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    terminalRoot.innerHTML = featuredHTML;

    // Attach Fullscreen Event
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const videoWrapper = document.getElementById('main-video-wrapper');
    
    if (fullscreenBtn && videoWrapper) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                videoWrapper.requestFullscreen().catch(err => {
                    console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        });
    }

    // Audio Player Logic
    const audioEl = document.getElementById('custom-audio');
    const playBtn = document.getElementById('audio-play-btn');
    const progressContainer = document.getElementById('audio-progress-container');
    const progressFill = document.getElementById('audio-progress-fill');
    const timeDisplay = document.getElementById('audio-time');

    if (audioEl && playBtn && progressContainer) {
        playBtn.addEventListener('click', () => {
            if (audioEl.paused) {
                audioEl.play();
                playBtn.innerText = '[ PAUSE ]';
            } else {
                audioEl.pause();
                playBtn.innerText = '[ PLAY ]';
            }
        });

        audioEl.addEventListener('timeupdate', () => {
            const percent = (audioEl.currentTime / audioEl.duration) * 100;
            progressFill.style.width = `${percent}%`;
            
            const formatTime = (time) => {
                if (isNaN(time)) return "00:00";
                const m = Math.floor(time / 60).toString().padStart(2, '0');
                const s = Math.floor(time % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };
            timeDisplay.innerText = `${formatTime(audioEl.currentTime)} // ${formatTime(audioEl.duration)}`;
        });

        progressContainer.addEventListener('click', (e) => {
            const rect = progressContainer.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            audioEl.currentTime = pos * audioEl.duration;
        });
        
        // When audio ends, reset play button
        audioEl.addEventListener('ended', () => {
            playBtn.innerText = '[ PLAY ]';
            progressFill.style.width = '0%';
        });
    }

    // Attach Carousel Events
    terminalRoot.querySelectorAll('.carousel-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const projectId = e.currentTarget.dataset.id;
            activeProject = projects.find(p => p.id === projectId);
            renderContent();
        });
    });

    // Scroll Logic
    const carouselWrapper = document.getElementById('carousel-wrapper');
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');

    if (scrollLeftBtn && scrollRightBtn && carouselWrapper) {
        scrollLeftBtn.addEventListener('click', () => {
            carouselWrapper.scrollBy({ left: -250, behavior: 'smooth' });
        });
        scrollRightBtn.addEventListener('click', () => {
            carouselWrapper.scrollBy({ left: 250, behavior: 'smooth' });
        });

        // Drag to scroll
        let isDown = false;
        let startX;
        let scrollLeft;

        carouselWrapper.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - carouselWrapper.offsetLeft;
            scrollLeft = carouselWrapper.scrollLeft;
            carouselWrapper.style.cursor = 'grabbing';
        });
        carouselWrapper.addEventListener('mouseleave', () => {
            isDown = false;
            carouselWrapper.style.cursor = 'grab';
        });
        carouselWrapper.addEventListener('mouseup', () => {
            isDown = false;
            carouselWrapper.style.cursor = 'grab';
        });
        carouselWrapper.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - carouselWrapper.offsetLeft;
            const walk = (x - startX) * 2; // Scroll speed multiplier
            carouselWrapper.scrollLeft = scrollLeft - walk;
        });
        carouselWrapper.style.cursor = 'grab';
    }
}

function getMediaHTML(media, isMain) {
    if (media.type === 'video_iframe') {
        if (!isMain) {
            // Generate thumbnail for YouTube automatically, or use fallback
            let thumbUrl = media.fallback_image;
            if (!thumbUrl && media.url.includes('youtube.com/embed/')) {
                const videoId = media.url.split('embed/')[1].split('?')[0];
                thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
            if (thumbUrl) {
                return `
                    <img src="${thumbUrl}" alt="Thumbnail">
                    <div class="custom-play-icon">▶</div>
                `;
            }
            // Fallback if no thumbnail is possible
            return `<iframe src="${media.url}" frameborder="0" tabindex="-1"></iframe>`;
        }
        
        // Main Viewer Iframe
        const allowString = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        return `<iframe src="${media.url}" frameborder="0" allow="${allowString}" allowfullscreen></iframe>`;
    } 
    else if (media.type === 'video_local') {
        if (!isMain) {
            return `
                <img src="${media.fallback_image || ''}" alt="Thumbnail">
                <div class="custom-play-icon">▶</div>
            `;
        }
        return `
            <video muted playsinline autoplay loop poster="${media.fallback_image || ''}">
                <source src="${media.url}" type="video/mp4">
            </video>`;
    } 
    else if (media.type === 'audio_local') {
        if (!isMain) {
            return `
                <img src="${media.fallback_image || ''}" alt="Thumbnail">
                <div class="custom-play-icon" style="font-size: 1.2rem; font-family: var(--font-mono); letter-spacing: -2px;">ılıılı</div>
            `;
        }
        return `
            <div class="audio-player-ui">
                <img class="audio-cover" src="${media.fallback_image || ''}" alt="Cover">
                <div class="audio-controls">
                    <button class="audio-play-btn" id="audio-play-btn">[ PLAY ]</button>
                    <div class="audio-time" id="audio-time">00:00 // 00:00</div>
                </div>
                <div class="audio-progress-container" id="audio-progress-container">
                    <div class="audio-progress-fill" id="audio-progress-fill"></div>
                </div>
                <audio id="custom-audio" src="${media.url}" preload="metadata"></audio>
            </div>
        `;
    }
    else {
        return `<img src="${media.fallback_image || ''}" alt="Media">`;
    }
}

// Boot Sequence Animation
async function runBootAnimation() {
    const bootSequence = document.getElementById('boot-sequence');
    const bootText = document.getElementById('boot-text');
    if (!bootSequence) return;
    
    const bootMessages = [
        "INIT SYSTEM CORE... OK",
        "LOADING NEURAL WEIGHTS... 99%",
        "ESTABLISHING SECURE CONNECTION...",
        "ACCESS GRANTED."
    ];

    for (let msg of bootMessages) {
        bootText.innerHTML += `<div>> ${msg}</div>`;
        await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
    }
    
    await new Promise(r => setTimeout(r, 400));
    
    bootSequence.classList.add('hidden');
    setTimeout(() => {
        if (bootSequence) bootSequence.remove();
    }, 500);
}

// Boot
document.addEventListener('DOMContentLoaded', initTerminal);
