
// State
const state = {
    lang: 'en',
    dictionaries: {},
    dictionary: {},
    posts: [],
    view: 'home', // 'home' or 'post'
    postId: null
};

// Elements
const elements = {
    root: document.getElementById('root'),
    main: document.getElementById('main-content'),
    langToggle: document.getElementById('lang-toggle'),
    yearSpan: document.getElementById('year'),
    siteTitle: document.title,
    logo: document.querySelector('.logo'),
    footer: document.querySelector('.site-footer p'),
    aboutNav: document.getElementById('about-nav')
};

// Init
async function init() {
    elements.yearSpan.textContent = new Date().getFullYear();

    // Bind Events
    window.addEventListener('hashchange', handleRoute);
    elements.langToggle.addEventListener('click', toggleLanguage);

    // Initial Load
    await loadPostsIndex();
    await loadDictionary(state.lang);

    handleRoute();
}

// Routing
function handleRoute() {
    const hash = window.location.hash.slice(1) || '/';

    if (hash === '/') {
        state.view = 'home';
        state.postId = null;
        renderHome();
    } else if (hash === "/about") {
        state.view = 'about';
        state.postId = null;
        renderAbout();
    } else if (hash.startsWith('/post/')) {
        state.view = 'post';
        state.postId = hash.split('/post/')[1];
        renderPost(state.postId);
    } else {
        // Default to home
        state.view = 'home';
        renderHome();
    }
}

// Data Fetching
async function loadPostsIndex() {
    try {
        const response = await fetch('content/posts.json');
        state.posts = await response.json();
    } catch (e) {
        console.error('Failed to load posts index', e);
    }
}

async function loadDictionary(lang) {
    if (state.dictionaries[lang]) {
        state.dictionary = state.dictionaries[lang];
        updateStaticText();
        return;
    }

    try {
        const response = await fetch(`locales/${lang}.json`);
        state.dictionaries[lang] = await response.json();
        state.dictionary = state.dictionaries[lang];
        updateStaticText();
    } catch (e) {
        console.error('Failed to load locale', e);
    }
}

// Language Handling
async function toggleLanguage() {
    state.lang = state.lang === 'en' ? 'zh' : 'en';
    await loadDictionary(state.lang);

    // Re-render current view
    if (state.view === 'home') {
        renderHome();
    } else if (state.view === 'post') {
        renderPost(state.postId);
    } else if (state.view === 'about') {
        renderAbout();
    }
}

function t(key) {
    return state.dictionary[key] || key;
}

function updateStaticText() {
    document.title = t('site_title');
    elements.logo.textContent = t('site_title');
    elements.footer.innerHTML = `&copy; <span id="year">${new Date().getFullYear()}</span> ${t('footer_name')}. ${t('footer_text')}`;
    elements.aboutNav.textContent = t('about_nav');
}

// Rendering
function renderHome() {
    elements.main.innerHTML = `
        <section class="hero">
            <p>${t('latest_posts')}</p>
        </section>
        <div class="post-list">
            ${state.posts.map(post => `
                <a href="#/post/${post.id}" class="post-card">
                    <h2>${post.title[state.lang]}</h2>
                    <p>${post.description[state.lang]}</p>
                    <span class="meta">${post.date}</span>
                </a>
            `).join('')}
        </div>
    `;
}

async function renderPost(id) {
    const post = state.posts.find(p => p.id === id);
    if (!post) {
        elements.main.innerHTML = `<p>${t('error_404')}</p>`;
        return;
    }

    elements.main.innerHTML = `<p>${t('loading')}</p>`;

    try {
        const response = await fetch(`content/${state.lang}/${id}.md`);
        if (!response.ok) throw new Error('Post not found');
        const text = await response.text();

        elements.main.innerHTML = `
            <article class="markdown-body">
                <a href="#/" class="back-link">&larr; ${t('home_nav')}</a>
                ${marked.parse(text)}
            </article>
        `;
    } catch (e) {
        elements.main.innerHTML = `<p>${t('error_404')}</p>`;
    }
}

async function renderAbout() {
    elements.main.innerHTML = `<p>${t('loading')}</p>`;

    try {
        const response = await fetch(`content/${state.lang}/about.md`);
        if (!response.ok) throw new Error('About page not found');
        const text = await response.text();

        elements.main.innerHTML = `
            <article class="markdown-body">
                ${marked.parse(text)}
            </article>
        `;
    } catch (e) {
        elements.main.innerHTML = `<p>${t('error_404')}</p>`;
    }
}

// Start
init();
