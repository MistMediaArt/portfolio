// Data State
let portfolioData = { sections: [], projects: [] };
let activeSection = 'ai'; // Default to AI
let activeSubCategory = null;
let activeProject = null; // Currently featured project

// Detect iOS devices (including iPads requesting desktop sites)
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isIOSStandalone = isIOS && (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);

// DOM Elements
const terminalRoot = document.getElementById('terminal-root');
const filtersContainer = document.getElementById('category-filters');
const subFiltersContainer = document.getElementById('sub-filters');

// Initialize Terminal
async function initTerminal() {
    const bootPromise = runBootAnimation();
    
    try {
        // Use a cache buster to prevent stubborn browser caching during development
        const response = await fetch(`./projects.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: DATA NOT FOUND`);
        
        portfolioData = await response.json();
        
        // Initial setup
        if (portfolioData.sections.length > 0) {
            activeSection = portfolioData.sections[0];
            updateStateForSection(activeSection);
        }
        
        renderNav();
        renderContent();
        initVideoModal();
        
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
            updateStateForSection(e.currentTarget.dataset.section);
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
                updateStateForSubCategory(e.currentTarget.dataset.sub);
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
    let transitionItemHTML = '';
    if (activeSection === 'ai') {
        if (activeSubCategory === 'cinematic') {
            transitionItemHTML = `
                <div class="carousel-item transition-link" data-target-sub="social_media">
                    <div class="carousel-thumbnail" style="display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--grid-line-color);">
                        <div style="text-align: center; line-height: 1.4; padding: 1rem;">
                            <span style="color: var(--text-muted); font-size: 0.8rem;">[ NEXT CATEGORY ]</span><br>
                            <span style="color: var(--text-main); font-size: 1.1rem; letter-spacing: 1px;">SOCIAL MEDIA</span><br>
                            <span style="color: var(--status-operational);">>>></span>
                        </div>
                    </div>
                    <div class="carousel-meta">
                        CLIENT: <span style="color: var(--status-operational); display: inline;">SYSTEM</span><br>
                        ID: <span style="color: var(--status-operational); display: inline;">REDIRECT</span><br>
                        TYPE: <span style="color: var(--status-operational); display: inline;">NAVIGATION</span>
                    </div>
                </div>
            `;
        } else if (activeSubCategory === 'social_media') {
            transitionItemHTML = `
                <div class="carousel-item transition-link" data-target-sub="cinematic">
                    <div class="carousel-thumbnail" style="display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.02); border: 1px dashed var(--grid-line-color);">
                        <div style="text-align: center; line-height: 1.4; padding: 1rem;">
                            <span style="color: var(--text-muted); font-size: 0.8rem;">[ NEXT CATEGORY ]</span><br>
                            <span style="color: var(--text-main); font-size: 1.1rem; letter-spacing: 1px;">CINEMATIC</span><br>
                            <span style="color: var(--status-operational);"><<<</span>
                        </div>
                    </div>
                    <div class="carousel-meta">
                        CLIENT: <span style="color: var(--status-operational); display: inline;">SYSTEM</span><br>
                        ID: <span style="color: var(--status-operational); display: inline;">REDIRECT</span><br>
                        TYPE: <span style="color: var(--status-operational); display: inline;">NAVIGATION</span>
                    </div>
                </div>
            `;
        }
    }

    const carouselHTML = (projects.length > 1 || transitionItemHTML) ? `
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
                ${transitionItemHTML}
            </div>
        </div>
    ` : '';

    let featuredHTML = '';

    if (activeProject.template === 'case_study') {
        featuredHTML = `
            <div class="featured-layout case-study-layout" data-section="${activeSection}">
                <div class="main-viewer-container">
                    <div class="main-video-wrapper" style="aspect-ratio: auto; background: none; padding: 1rem; position: relative;">
                        ${activeProject.media.gallery && activeProject.media.gallery.length > 1 ? `
                        <button class="cs-gallery-scroll-btn left" id="cs-gallery-left">&lt;</button>
                        <button class="cs-gallery-scroll-btn right" id="cs-gallery-right">&gt;</button>
                        ` : ''}
                        <div class="cs-gallery-container" id="cs-gallery-container">
                            ${activeProject.media.gallery ? activeProject.media.gallery.map(img => `
                                <div class="cs-gallery-item glitch-box"><img src="${img}" alt="Case Study Image"></div>
                            `).join('') : `
                                <div class="cs-gallery-item glitch-box"><img src="${activeProject.media.fallback_image}" alt="Case Study Image"></div>
                            `}
                        </div>
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
                            <a href="${v}" target="_blank" class="cs-link-btn"><span class="btn-arrow">>></span> <span class="btn-text">[ ${k.toUpperCase()} ]</span></a>
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
        const isImage = activeProject.media.type === 'image';
        const isAudio = activeProject.media.type === 'audio_local';
        const isVertical = activeProject.sub_category === 'social_media';
        const wrapperClass = isImage ? 'image-placeholder' : (isVertical ? 'vertical-placeholder' : '');
        
        featuredHTML = `
            <div class="featured-layout" data-section="${activeSection}">
                <div class="main-viewer-container">
                    <div class="main-video-wrapper ${isImage ? 'glitch-box' : ''} ${wrapperClass}" id="main-video-wrapper">
                        ${getMediaHTML(activeProject.media, true)}
                        ${((!isImage || activeSection === 'apps') && !isAudio && !isIOSStandalone) ? '<button class="fullscreen-btn" id="fullscreen-btn">[ FULLSCREEN ]</button>' : ''}
                    </div>
                    <h1 class="main-title title-${activeProject.sub_category || 'default'}" style="margin-top: 2rem;">${activeProject.title}</h1>
                    ${activeProject.metadata ? `
                        <div class="mobile-only-sidebar-content metadata-grid" style="margin-top: 1rem; margin-bottom: 2rem;">
                            ${Object.entries(activeProject.metadata || {}).map(([k, v]) => `
                                <div>${k.toUpperCase().replace('_', ' ')}<span>${v}</span></div>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${activeProject.content && activeProject.content.sidebar_html ? `
                        <div class="mobile-only-sidebar-content sidebar-text-block">
                            ${activeProject.content.sidebar_html}
                        </div>
                    ` : ''}
                    ${activeProject.content && activeProject.content.html_body ? `
                        <div class="project-html-body case-study-content" style="display: block; margin-top: 2rem; max-width: 800px;">
                            ${activeProject.content.html_body}
                        </div>
                    ` : ''}
                </div>
                
                <div class="side-panel">
                    <div>
                        <div class="panel-header">
                            <h2>MEDIA ARTIST /<br>VFX PROFESSIONAL</h2>
                        </div>
                        
                        <div class="system-status">
                            SYSTEM STATUS: <span class="status-operational">${activeProject.status || 'OPERATIONAL'}</span>
                        </div>
                    </div>

                    ${activeProject.content && activeProject.content.links ? `
                    <div class="cs-links" style="margin-top: 1rem;">
                        ${Object.entries(activeProject.content.links).map(([k, v]) => `
                            <a href="${v}" target="_blank" class="cs-link-btn"><span class="btn-arrow">>></span> <span class="btn-text">[ ${k.toUpperCase()} ]</span></a>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${carouselHTML}

                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        ${activeProject.content && activeProject.content.sidebar_html ? `
                            <div class="desktop-only-sidebar-content sidebar-text-block">
                                ${activeProject.content.sidebar_html}
                            </div>
                        ` : ''}

                        ${activeSection === 'music' ? `
                        <div class="cs-links" style="margin-top: 0;">
                            <a href="https://soundcloud.com/low-fi-saints-are-decoded" target="_blank" class="cs-link-btn"><span class="btn-arrow">>></span> <span class="btn-text">[ SOUNDCLOUD ]</span></a>
                        </div>
                        ` : ''}
                        
                        ${activeProject.metadata ? `
                        <div class="desktop-only-sidebar-content metadata-grid">
                            ${Object.entries(activeProject.metadata || {}).map(([k, v]) => `
                                <div>${k.toUpperCase().replace('_', ' ')}<span>${v}</span></div>
                            `).join('')}
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    terminalRoot.innerHTML = featuredHTML;

    // YouTube Mobile Facade Event
    const youtubeFacade = document.querySelector('.youtube-facade');
    if (youtubeFacade) {
        youtubeFacade.addEventListener('click', function() {
            const iframeUrl = this.getAttribute('data-iframe-url');
            this.outerHTML = `<iframe src="${iframeUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%;"></iframe>`;
        });
    }

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
            if (e.currentTarget.classList.contains('transition-link')) {
                const targetSub = e.currentTarget.dataset.targetSub;
                updateStateForSubCategory(targetSub);
                renderNav();
                renderContent();
                return;
            }

            const projectId = e.currentTarget.dataset.id;
            activeProject = projects.find(p => p.id === projectId);
            
            // Save current scroll position
            const wrapper = document.getElementById('carousel-wrapper');
            const savedScroll = wrapper ? wrapper.scrollLeft : 0;
            
            renderContent();
            
            // Restore scroll position
            const newWrapper = document.getElementById('carousel-wrapper');
            if (newWrapper) {
                newWrapper.scrollLeft = savedScroll;
            }
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

    // Case Study Gallery Scroll Logic
    const csGalleryContainer = document.getElementById('cs-gallery-container');
    const csGalleryLeft = document.getElementById('cs-gallery-left');
    const csGalleryRight = document.getElementById('cs-gallery-right');

    if (csGalleryContainer && csGalleryLeft && csGalleryRight) {
        csGalleryLeft.addEventListener('click', () => {
            const container = csGalleryContainer;
            const itemWidth = container.clientWidth + 16; // width + gap
            
            if (container.scrollLeft <= 10) {
                // If at the beginning, jump to the end
                container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: -itemWidth, behavior: 'smooth' });
            }
        });
        csGalleryRight.addEventListener('click', () => {
            const container = csGalleryContainer;
            const itemWidth = container.clientWidth + 16; // width + gap
            
            if (Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 10) {
                // If at the end, jump back to the beginning
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: itemWidth, behavior: 'smooth' });
            }
        });
    }
}

function getMediaHTML(media, isMain) {
    if (media.type === 'video_iframe') {
        let finalUrl = media.url;
        if (finalUrl.includes('vimeo.com')) {
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl += `${separator}title=0&byline=0&portrait=0&badge=0`;
        }

        if (!isMain) {
            // YouTube doesn't support clean background autoplay (forces UI and play button).
            // So we extract the thumbnail image for YouTube.
            if (media.url.includes('youtube.com/embed/')) {
                let thumbUrl = media.fallback_image;
                if (!thumbUrl) {
                    const videoId = media.url.split('embed/')[1].split('?')[0];
                    thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                }
                return `
                    <img src="${thumbUrl}" alt="Thumbnail">
                    <div class="custom-play-icon">▶</div>
                `;
            }
            
            // Vimeo supports clean background autoplay, so we use it for moving thumbnails!
            let thumbIframeUrl = finalUrl;
            if (thumbIframeUrl.includes('vimeo.com')) {
                const separator = thumbIframeUrl.includes('?') ? '&' : '?';
                thumbIframeUrl += `${separator}background=1&muted=1&loop=1&autoplay=1`;
            }
            return `<div style="position: relative; width: 100%; height: 100%; pointer-events: none;"><iframe src="${thumbIframeUrl}" frameborder="0" tabindex="-1" style="width: 100%; height: 100%; pointer-events: none;"></iframe></div>`;
        }
        
        // Main Viewer Iframe
        const allowString = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        
        // On mobile, YouTube injects too much UI that covers the video. 
        // We use a facade pattern (image -> click -> iframe) on mobile to keep it clean.
        const isMobile = window.innerWidth <= 768;
        if (isMain && isMobile && finalUrl.includes('youtube.com/embed/')) {
            let thumbUrl = media.fallback_image;
            if (!thumbUrl) {
                const videoId = finalUrl.split('embed/')[1].split('?')[0];
                thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }
            const separator = finalUrl.includes('?') ? '&' : '?';
            const autoplayUrl = finalUrl + separator + 'autoplay=1';
            
            return `
                <div class="youtube-facade" data-iframe-url="${autoplayUrl}" style="position: relative; width: 100%; height: 100%; cursor: pointer;">
                    <img src="${thumbUrl}" alt="Video Cover" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="custom-play-icon" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 4rem; color: var(--status-operational); text-shadow: 0 0 15px rgba(0,0,0,0.8); pointer-events: none;">▶</div>
                </div>
            `;
        }
        
        return `<iframe src="${finalUrl}" frameborder="0" allow="${allowString}" allowfullscreen></iframe>`;
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
            <div class="audio-player-ui glitch-box-strong">
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

// Generative Video Modal Logic
function initVideoModal() {
    const modal = document.getElementById('video-modal');
    const modalVideo = document.getElementById('modal-video-player');
    const closeBtn = document.getElementById('close-modal-btn');
    
    if (!modal || !modalVideo) return;

    // Listen for clicks on the generative grid videos
    document.body.addEventListener('click', (e) => {
        if (e.target.matches('.generative-video-grid video')) {
            const src = e.target.getAttribute('src');
            if (src) {
                modalVideo.src = src;
                modal.style.display = 'flex';
                modalVideo.play().catch(err => console.error("Autoplay prevented:", err));
            }
        }
    });

    const closeModal = () => {
        modal.style.display = 'none';
        modalVideo.pause();
        modalVideo.src = '';
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(); // Click outside the video
    });
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
