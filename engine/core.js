(() => {
  const THEMES = /*__THEMES_PLACEHOLDER__*/{};
  const BOOT_ASSETS = /*__BOOT_ASSETS_PLACEHOLDER__*/{};
  const BUILD_VER = /*__BUILD_VER_PLACEHOLDER__*/"dev";
  const THEME_KEYS = Object.keys(THEMES);
  const DEFAULT_THEME_KEY = THEME_KEYS[0] || 'Default';

  if (window.__AGY_MOD_VER__ !== BUILD_VER) {
    window.__AGY_MOD_VER__ = BUILD_VER;
    window.__AGY_LOADED_MODS__ = {};
  }

  function loadLazyModule(name) {
    const mods = window.__AGY_LOADED_MODS__ || (window.__AGY_LOADED_MODS__ = {});
    const globalKey = `__AGY_LAZY_${name.toUpperCase()}__`;
    if (mods[name] === true && typeof window[globalKey] === 'function') {
      return Promise.resolve(window[globalKey]);
    }
    if (mods[name] && typeof mods[name].then === 'function') {
      return mods[name];
    }
    const base = window.__AGY_MEDIA_BASE_URL__
      ? String(window.__AGY_MEDIA_BASE_URL__).replace(/\/+$/, '')
      : '';
    if (!base) {
      return Promise.reject(new Error(`Media server base unavailable for lazy module: ${name}`));
    }
    const promise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `${base}/engine/${name}.js?v=${encodeURIComponent(BUILD_VER)}`;
      s.async = true;
      s.onload = () => {
        s.remove();
        mods[name] = true;
        resolve(window[globalKey]);
      };
      s.onerror = () => {
        s.remove();
        delete mods[name];
        reject(new Error(`Failed to load lazy module: ${name}`));
      };
      (document.head || document.documentElement).appendChild(s);
    });
    mods[name] = promise;
    return promise;
  }

  const STORAGE_THEME = 'agy_theme_v3';
  const STORAGE_BUBBLE = 'agy_bubble_v3';
  const STORAGE_INPUT = 'agy_input_v3';
  const STORAGE_DIMMING = 'agy_dimming_v3';
  const STORAGE_WP_ENABLED = 'agy_wp_enabled_v3';
  const STORAGE_WP_MODE = 'agy_wp_mode_v3';
  const STORAGE_CUSTOM_WP = 'agy_custom_wp_v3';
  const STORAGE_CUSTOM_VIDEO = 'agy_custom_video_v3';
  const STORAGE_SAVED_IMAGES = 'agy_saved_images_v3';
  const STORAGE_SAVED_VIDEOS = 'agy_saved_videos_v3';
  const STORAGE_TASK_VOICES = 'agy_task_voices_v3';
  const STORAGE_TASK_VOICE_ENABLED = 'agy_task_voice_enabled_v3';
  const STORAGE_TASK_VOICE_VOL = 'agy_task_voice_vol_v3';
  const STORAGE_CUSTOM_GREETINGS = 'agy_custom_greetings_v3';
  const STORAGE_USER_AVATAR = 'agy_user_avatar_v3';
  const STORAGE_AGENT_AVATAR = 'agy_agent_avatar_v3';
  const STORAGE_GLASS_BLUR = 'agy_glass_blur_v3';
  const STORAGE_AVATAR_SIZE = 'agy_avatar_size_v3';
  const STORAGE_AVATAR_RADIUS = 'agy_avatar_radius_v3';
  const STORAGE_BOOT_INTRO = 'agy_boot_intro_v3';
  const STORAGE_SKETCH_REVEAL = 'agy_sketch_reveal_v3';
  const STORAGE_TAWA_GREETING = 'agy_tawa_greeting_v3';
  const GREETING_RX = /^(?:Hey\s+[^,]{1,40},\s+what\s+should\s+we\s+build\s+today\??|Good\s+to\s+see\s+you,\s+[^.]{1,40}\.\s+What'?s\s+next\??|What\s+(?:should|are)\s+we\s+build(?:ing)?\s+today\??|Welcome\s+back[,.!\s]+[^.!?]{0,40}(?:[.!?]\s*(?:Where\s+should\s+we\s+pick\s+up|What'?s\s+next|What\s+should\s+we\s+build)[^.!?]{0,40}[.!?]?)?|Where\s+should\s+we\s+pick\s+up\??|Ready\s+(?:to\s+build|when\s+you\s+are)[,.!\s]*.*)$/i;

  const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const INPUT_STYLES = {
    'sync': {
      label: 'Synced Ornament Frame',
      desc: 'Follows the active theme borders & decorative SVG ornament'
    },
    'double_gold': {
      label: 'Amber Gold Double Border',
      desc: 'Warm metallic double border with corner filigree'
    },
    'glass': {
      label: 'Translucent Crystal Glass',
      desc: 'Lets more of your background artwork shine through'
    },
    'minimal': {
      label: 'Minimal Clean',
      desc: 'Sleek subtle border without top decorative stickers'
    }
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function canonicalMediaKey(urlStr) {
    if (!urlStr) return '';
    const s = String(urlStr).trim();
    if (!s) return '';
    const match = s.match(/(?:^|\/)(user_media\/[^?#]+)/i);
    if (match) {
      try {
        return 'user_media/' + decodeURIComponent(match[1].slice('user_media/'.length));
      } catch (e) {
        return match[1];
      }
    }
    return s;
  }

  function isSameMediaUrl(a, b) {
    const ka = canonicalMediaKey(a);
    const kb = canonicalMediaKey(b);
    return Boolean(ka && kb && ka === kb);
  }

  function deriveMediaName(urlOrName, fallback = 'Custom Media') {
    if (!urlOrName) return fallback;
    const s = String(urlOrName).trim();
    if (!s) return fallback;
    if (s.startsWith('data:')) return fallback;
    const key = canonicalMediaKey(s);
    const tail = key.split('/').pop() || '';
    const cleaned = tail.replace(/^\d{10,}_/, '').trim();
    return cleaned || fallback;
  }

  function normalizeSavedMediaList(list, fallbackLabel) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const raw of list) {
      const url = typeof raw === 'string' ? raw.trim() : (raw && typeof raw.url === 'string' ? raw.url.trim() : '');
      if (!url) continue;
      const key = canonicalMediaKey(url);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const name = (raw && typeof raw.name === 'string' && raw.name.trim())
        ? raw.name.trim()
        : deriveMediaName(url, fallbackLabel);
      const addedAt = (raw && Number.isFinite(Number(raw.addedAt))) ? Number(raw.addedAt) : 0;
      out.push({ url, name, addedAt });
    }
    return out;
  }

  function readStoredMediaList(storageKey, initList, fallbackLabel) {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        return normalizeSavedMediaList(JSON.parse(raw), fallbackLabel);
      }
    } catch (e) {}
    return normalizeSavedMediaList(initList, fallbackLabel);
  }

  function mediaKindMeta(kind) {
    if (kind === 'video') {
      return {
        bucket: 'videos',
        storageKey: STORAGE_SAVED_VIDEOS,
        initListKey: 'savedVideos',
        activeStorageKey: STORAGE_CUSTOM_VIDEO,
        activeInitKey: 'customVideo',
        fallbackLabel: 'Custom Video'
      };
    }
    if (kind === 'audio') {
      return {
        bucket: 'audios',
        storageKey: STORAGE_TASK_VOICES,
        initListKey: 'taskVoices',
        activeStorageKey: '',
        activeInitKey: '',
        fallbackLabel: 'Task Voice'
      };
    }
    return {
      bucket: 'images',
      storageKey: STORAGE_SAVED_IMAGES,
      initListKey: 'savedImages',
      activeStorageKey: STORAGE_CUSTOM_WP,
      activeInitKey: 'customWp',
      fallbackLabel: 'Custom Image'
    };
  }

  function getMediaLibrary(kind, initOverride, activeCustomOverride) {
    const meta = mediaKindMeta(kind);
    const init = initOverride || window.__AGY_INITIAL_CONFIG__ || {};
    const stored = readStoredMediaList(meta.storageKey, init[meta.initListKey], meta.fallbackLabel);

    const serverMedia = window.__AGY_USER_MEDIA__;
    const hasServerList = Boolean(serverMedia && Array.isArray(serverMedia[meta.bucket]));
    const diskList = hasServerList ? normalizeSavedMediaList(serverMedia[meta.bucket], meta.fallbackLabel) : [];

    const byKey = new Map();
    if (hasServerList) {
      const diskByKey = new Map();
      diskList.forEach((it) => diskByKey.set(canonicalMediaKey(it.url), it));
      stored.forEach((it) => {
        const key = canonicalMediaKey(it.url);
        if (key.startsWith('user_media/')) {
          const diskMatch = diskByKey.get(key);
          if (diskMatch) {
            byKey.set(key, {
              url: diskMatch.url,
              name: it.name || diskMatch.name,
              addedAt: Math.max(it.addedAt || 0, diskMatch.addedAt || 0)
            });
          }
        } else {
          byKey.set(key, it);
        }
      });
      diskList.forEach((it) => {
        const key = canonicalMediaKey(it.url);
        if (!byKey.has(key)) {
          byKey.set(key, it);
        }
      });
    } else {
      stored.forEach((it) => byKey.set(canonicalMediaKey(it.url), it));
    }

    const activeUrl = activeCustomOverride !== undefined
      ? activeCustomOverride
      : (meta.activeStorageKey ? (localStorage.getItem(meta.activeStorageKey) ?? init[meta.activeInitKey] ?? '') : '');
    if (activeUrl) {
      const activeKey = canonicalMediaKey(activeUrl);
      if (activeKey && !byKey.has(activeKey)) {
        if (!hasServerList || !activeKey.startsWith('user_media/')) {
          byKey.set(activeKey, {
            url: activeUrl,
            name: deriveMediaName(activeUrl, meta.fallbackLabel),
            addedAt: Date.now()
          });
        }
      }
    }

    return Array.from(byKey.values()).sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }

  function upsertSavedMedia(kind, item) {
    if (!item || !item.url) return getMediaLibrary(kind);
    const meta = mediaKindMeta(kind);
    const current = getMediaLibrary(kind);
    const key = canonicalMediaKey(item.url);
    const filtered = current.filter((it) => canonicalMediaKey(it.url) !== key);
    const nextItem = {
      url: item.url,
      name: (item.name && String(item.name).trim()) || deriveMediaName(item.url, meta.fallbackLabel),
      addedAt: item.addedAt || Date.now()
    };
    const next = [nextItem, ...filtered];
    try {
      localStorage.setItem(meta.storageKey, JSON.stringify(next));
    } catch (e) {}
    if (window.__AGY_USER_MEDIA__ && key.startsWith('user_media/')) {
      const arr = Array.isArray(window.__AGY_USER_MEDIA__[meta.bucket]) ? window.__AGY_USER_MEDIA__[meta.bucket] : [];
      window.__AGY_USER_MEDIA__[meta.bucket] = [nextItem, ...arr.filter((it) => canonicalMediaKey(it.url) !== key)];
    }
    invalidateStateCache();
    return next;
  }

  function removeSavedMediaFromStore(kind, url) {
    const meta = mediaKindMeta(kind);
    const key = canonicalMediaKey(url);
    const next = getMediaLibrary(kind).filter((it) => canonicalMediaKey(it.url) !== key);
    try {
      localStorage.setItem(meta.storageKey, JSON.stringify(next));
    } catch (e) {}
    if (window.__AGY_USER_MEDIA__) {
      if (Array.isArray(window.__AGY_USER_MEDIA__[meta.bucket])) {
        window.__AGY_USER_MEDIA__[meta.bucket] = window.__AGY_USER_MEDIA__[meta.bucket].filter((it) => canonicalMediaKey(it.url) !== key);
      }
    }
    invalidateStateCache();
    return next;
  }

  function normalizeGreetingLines(list) {
    if (!Array.isArray(list)) return [];
    const seen = new Set();
    const out = [];
    for (const item of list) {
      const s = String(item || '').trim();
      if (!s || seen.has(s)) continue;
      seen.add(s);
      out.push(s);
    }
    return out;
  }

  function readCustomGreetings(initOverride) {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_GREETINGS);
      if (raw !== null) {
        return normalizeGreetingLines(JSON.parse(raw));
      }
    } catch (e) {}
    const init = initOverride || window.__AGY_INITIAL_CONFIG__ || {};
    return normalizeGreetingLines(init.customGreetings);
  }

  function invalidateStateCache() {
    window.__AGY_STATE_CACHE__ = null;
  }

  function getState() {
    if (window.__AGY_STATE_CACHE__) {
      return window.__AGY_STATE_CACHE__;
    }
    const init = window.__AGY_INITIAL_CONFIG__ || {};
    const rawTheme = localStorage.getItem(STORAGE_THEME) || init.themeName || DEFAULT_THEME_KEY;
    const themeName = THEMES[rawTheme] ? rawTheme : DEFAULT_THEME_KEY;
    const rawBubble = localStorage.getItem(STORAGE_BUBBLE) || init.bubbleName || themeName;
    const bubbleName = THEMES[rawBubble] ? rawBubble : themeName;
    const inputStyle = localStorage.getItem(STORAGE_INPUT) || init.inputStyle || 'sync';
    const dimming = parseInt(localStorage.getItem(STORAGE_DIMMING) || (init.dimming !== undefined ? init.dimming : '69'), 10);
    const wpEnabled = localStorage.getItem(STORAGE_WP_ENABLED) !== null
      ? localStorage.getItem(STORAGE_WP_ENABLED) !== 'false'
      : (init.wpEnabled !== undefined ? init.wpEnabled : true);
    const activeThObj = THEMES[themeName] || THEMES[DEFAULT_THEME_KEY] || {};
    const storedMode = localStorage.getItem(STORAGE_WP_MODE);
    const wpMode = (storedMode === 'video' || storedMode === 'image')
      ? storedMode
      : ((init.wpMode === 'video' || init.wpMode === 'image') ? init.wpMode : (activeThObj.wallpaperVideo ? 'video' : 'image'));
    const rawCustomWp = localStorage.getItem(STORAGE_CUSTOM_WP);
    const customWp = rawCustomWp !== null ? rawCustomWp : (init.customWp || '');
    const rawCustomVid = localStorage.getItem(STORAGE_CUSTOM_VIDEO);
    const customVideo = rawCustomVid !== null ? rawCustomVid : (init.customVideo || '');
    const savedImages = getMediaLibrary('image', init, customWp);
    const savedVideos = getMediaLibrary('video', init, customVideo);
    const taskVoices = getMediaLibrary('audio', init, '');
    const taskVoiceEnabled = localStorage.getItem(STORAGE_TASK_VOICE_ENABLED) !== null
      ? localStorage.getItem(STORAGE_TASK_VOICE_ENABLED) !== 'false'
      : (init.taskVoiceEnabled !== undefined ? init.taskVoiceEnabled : true);
    const rawTaskVol = localStorage.getItem(STORAGE_TASK_VOICE_VOL) ?? init.taskVoiceVol;
    const taskVoiceVol = rawTaskVol !== undefined && rawTaskVol !== null && rawTaskVol !== ''
      ? Math.max(0, Math.min(100, parseInt(rawTaskVol, 10)))
      : 85;
    const customGreetings = readCustomGreetings(init);
    const userAvatar = localStorage.getItem(STORAGE_USER_AVATAR) ?? init.userAvatar ?? '';
    const agentAvatar = localStorage.getItem(STORAGE_AGENT_AVATAR) ?? init.agentAvatar ?? '';
    const rawBlur = localStorage.getItem(STORAGE_GLASS_BLUR) ?? init.glassBlur;
    const glassBlur = rawBlur !== undefined && rawBlur !== null && rawBlur !== '' ? parseInt(rawBlur, 10) : 3;
    const rawAvSize = localStorage.getItem(STORAGE_AVATAR_SIZE) ?? init.avatarSize;
    const avatarSize = rawAvSize !== undefined && rawAvSize !== null && rawAvSize !== '' ? parseInt(rawAvSize, 10) : 32;
    const rawAvRad = localStorage.getItem(STORAGE_AVATAR_RADIUS) ?? init.avatarRadius;
    const avatarRadius = rawAvRad !== undefined && rawAvRad !== null && rawAvRad !== '' ? parseInt(rawAvRad, 10) : 50;
    const bootIntro = localStorage.getItem(STORAGE_BOOT_INTRO) !== null
      ? localStorage.getItem(STORAGE_BOOT_INTRO) !== 'false'
      : (init.bootIntro !== undefined ? init.bootIntro : true);
    const sketchReveal = localStorage.getItem(STORAGE_SKETCH_REVEAL) !== null
      ? localStorage.getItem(STORAGE_SKETCH_REVEAL) !== 'false'
      : (init.sketchReveal !== undefined ? init.sketchReveal : true);
    const tawaGreeting = localStorage.getItem(STORAGE_TAWA_GREETING) !== null
      ? localStorage.getItem(STORAGE_TAWA_GREETING) !== 'false'
      : (init.tawaGreeting !== undefined ? init.tawaGreeting : true);
    const cached = {
      themeName, bubbleName, inputStyle, dimming, wpEnabled, wpMode,
      customWp, customVideo, savedImages, savedVideos,
      taskVoices, taskVoiceEnabled, taskVoiceVol, customGreetings,
      userAvatar, agentAvatar, glassBlur, avatarSize, avatarRadius,
      bootIntro, sketchReveal, tawaGreeting
    };
    window.__AGY_STATE_CACHE__ = cached;
    return cached;
  }

  function resolveMediaUrl(relOrAbs) {
    if (!relOrAbs) return '';
    const s = String(relOrAbs).trim();
    if (!s) return '';
    const base = (typeof window !== 'undefined' && window.__AGY_MEDIA_BASE_URL__)
      ? String(window.__AGY_MEDIA_BASE_URL__).replace(/\/+$/, '')
      : '';
    const localMediaMatch = s.match(/^https?:\/\/127\.0\.0\.1:\d+\/((?:assets|user_media)\/.+)$/i);
    if (localMediaMatch) {
      return base ? `${base}/${localMediaMatch[1]}` : s;
    }
    if (/^(https?:|data:|blob:|file:)/i.test(s)) return s;
    const cleanRel = s.replace(/^\.\//, '').replace(/^\/+/, '');
    return base ? `${base}/${cleanRel}` : `./${cleanRel}`;
  }

  function sanitizeCssUrl(u) {
    return String(u || '').replace(/["\\()\r\n]/g, (ch) => encodeURIComponent(ch));
  }

  const MAX_BLOB_CACHE = 16;
  const MAX_BLUR_CACHE = 4;

  function toShortBlobUrl(uri) {
    if (!uri || !uri.startsWith('data:') || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
      return uri;
    }
    const cache = window.__AGY_BLOB_CACHE__ instanceof Map
      ? window.__AGY_BLOB_CACHE__
      : (window.__AGY_BLOB_CACHE__ = new Map());
    const key = `${uri.slice(0, 80)}|${uri.length}|${uri.slice(-24)}`;
    const existing = cache.get(key);
    if (existing) {
      cache.delete(key);
      cache.set(key, existing);
      return existing;
    }
    try {
      const comma = uri.indexOf(',');
      if (comma === -1) return uri;
      const meta = uri.slice(5, comma);
      const dataPart = uri.slice(comma + 1);
      const mime = (meta.split(';')[0] || 'application/octet-stream').trim();
      let blob;
      if (meta.includes(';base64')) {
        const bin = atob(dataPart);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        blob = new Blob([bytes], { type: mime });
      } else {
        blob = new Blob([decodeURIComponent(dataPart)], { type: mime });
      }
      const objUrl = URL.createObjectURL(blob);
      cache.set(key, objUrl);
      while (cache.size > MAX_BLOB_CACHE) {
        const oldestKey = cache.keys().next().value;
        const oldUrl = cache.get(oldestKey);
        cache.delete(oldestKey);
        if (oldUrl && oldUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(oldUrl); } catch (e) {}
        }
      }
      return objUrl;
    } catch (e) {
      return uri;
    }
  }

  function revokeAllAgyBlobs() {
    if (window.__AGY_BLOB_CACHE__ instanceof Map) {
      for (const u of window.__AGY_BLOB_CACHE__.values()) {
        if (typeof u === 'string' && u.startsWith('blob:')) {
          try { URL.revokeObjectURL(u); } catch (e) {}
        }
      }
      window.__AGY_BLOB_CACHE__.clear();
    }
    if (window.__AGY_BLUR_CACHE__ instanceof Map) {
      for (const u of window.__AGY_BLUR_CACHE__.values()) {
        if (typeof u === 'string' && u.startsWith('blob:')) {
          try { URL.revokeObjectURL(u); } catch (e) {}
        }
      }
      window.__AGY_BLUR_CACHE__.clear();
    } else {
      window.__AGY_BLUR_CACHE__ = new Map();
    }
  }

  function persistThemeConfig(st, debounce = false) {
    if (window.__AGY_SAVE_TIMER__) {
      clearTimeout(window.__AGY_SAVE_TIMER__);
      window.__AGY_SAVE_TIMER__ = 0;
    }
    const flush = () => {
      if (window.agySaveThemeConfig) {
        try {
          window.agySaveThemeConfig(JSON.stringify(st));
        } catch (e) {}
      }
    };
    if (debounce) {
      window.__AGY_SAVE_TIMER__ = setTimeout(() => {
        window.__AGY_SAVE_TIMER__ = 0;
        flush();
      }, 200);
    } else {
      flush();
    }
  }

  function findActiveShell() {
    const all = Array.from(document.querySelectorAll('.agy-shell'));
    if (all.length <= 1) return all[0] || null;
    let best = all[0];
    let bestArea = 0;
    for (const el of all) {
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      if (area > bestArea) {
        bestArea = area;
        best = el;
      }
    }
    return best;
  }

  function flushMetricsStyle() {
    const ms = window.__AGY_METRICS_STATE__ || (window.__AGY_METRICS_STATE__ = {
      glassBg: '',
      beforeClip: '',
      holeClip: ''
    });
    let css = '';
    if (ms.glassBg || ms.beforeClip) {
      css += '.agy-shell::before{';
      if (ms.glassBg) css += `background-image:${ms.glassBg}!important;`;
      if (ms.beforeClip) css += `clip-path:${ms.beforeClip}!important;`;
      css += '}';
    }
    if (ms.holeClip) {
      css += `body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"]::after,body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > #agy-live-bg-layer{clip-path:${ms.holeClip}!important;}`;
    }
    if (css === window.__AGY_LAST_METRICS_CSS__) return;
    window.__AGY_LAST_METRICS_CSS__ = css;
    let el = document.getElementById('antigravity-custom-theme-metrics');
    if (!el) {
      el = document.createElement('style');
      el.id = 'antigravity-custom-theme-metrics';
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = css;
  }

  function putBlurCache(key, val) {
    if (!(window.__AGY_BLUR_CACHE__ instanceof Map)) {
      window.__AGY_BLUR_CACHE__ = new Map();
    }
    const cache = window.__AGY_BLUR_CACHE__;
    if (cache.has(key)) cache.delete(key);
    cache.set(key, val);
    while (cache.size > MAX_BLUR_CACHE) {
      const oldestKey = cache.keys().next().value;
      const oldVal = cache.get(oldestKey);
      cache.delete(oldestKey);
      if (typeof oldVal === 'string' && oldVal.startsWith('blob:')) {
        try { URL.revokeObjectURL(oldVal); } catch (e) {}
      }
    }
  }

  // Pre-bake L-shaped header/sidebar glass blur (debounced + LRU-capped + direct toBlob + generation token)
  function syncPrebakedGlass(wpUrl, overlayRgb, overlayAlpha, tintBg, blurStr, deferMs = 0) {
    if (window.__AGY_BLUR_TIMER__) {
      clearTimeout(window.__AGY_BLUR_TIMER__);
      window.__AGY_BLUR_TIMER__ = 0;
    }
    const ms = window.__AGY_METRICS_STATE__ || (window.__AGY_METRICS_STATE__ = { glassBg: '', beforeClip: '', holeClip: '' });
    const pxMatch = String(blurStr !== undefined ? blurStr : '3px').match(/(\d+(?:\.\d+)?)/);
    const blurVal = pxMatch ? parseFloat(pxMatch[1]) : 3;
    if (!wpUrl || !(blurVal > 0)) {
      window.__AGY_BLUR_GEN__ = (window.__AGY_BLUR_GEN__ || 0) + 1;
      ms.glassBg = '';
      flushMetricsStyle();
      return;
    }
    if (!(window.__AGY_BLUR_CACHE__ instanceof Map)) {
      window.__AGY_BLUR_CACHE__ = new Map();
    }
    const cache = window.__AGY_BLUR_CACHE__;
    const key = `${wpUrl.slice(0, 64)}|${wpUrl.length}|${overlayRgb}|${overlayAlpha.toFixed(3)}|${tintBg}|${blurStr}`;
    const cached = cache.get(key);
    if (cached) {
      putBlurCache(key, cached);
      ms.glassBg = `url("${cached}")`;
      flushMetricsStyle();
      return;
    }
    const gen = (window.__AGY_BLUR_GEN__ = (window.__AGY_BLUR_GEN__ || 0) + 1);
    const runBake = () => {
      if (window.__AGY_BLUR_GEN__ !== gen) return;
      const img = new Image();
      if (!/^(?:data|blob|file):/i.test(wpUrl)) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        if (window.__AGY_BLUR_GEN__ !== gen) return;
        try {
          const w = 640;
          const h = Math.max(180, Math.round((img.naturalHeight || 1440) * (w / (img.naturalWidth || 2560))));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const scaledBlur = Math.max(1, Math.min(16, Math.round(blurVal * 0.75)));
          ctx.filter = `blur(${scaledBlur}px)`;
          ctx.drawImage(img, -12, -12, w + 24, h + 24);
          ctx.filter = 'none';
          ctx.fillStyle = `rgba(${overlayRgb}, ${overlayAlpha})`;
          ctx.fillRect(0, 0, w, h);
          if (tintBg) {
            ctx.fillStyle = tintBg;
            ctx.fillRect(0, 0, w, h);
          }
          const applyBakedUrl = (bakedUrl) => {
            canvas.width = 0;
            canvas.height = 0;
            if (window.__AGY_BLUR_GEN__ !== gen) {
              if (typeof bakedUrl === 'string' && bakedUrl.startsWith('blob:')) {
                try { URL.revokeObjectURL(bakedUrl); } catch (e) {}
              }
              return;
            }
            putBlurCache(key, bakedUrl);
            const curMs = window.__AGY_METRICS_STATE__ || (window.__AGY_METRICS_STATE__ = { glassBg: '', beforeClip: '', holeClip: '' });
            curMs.glassBg = `url("${bakedUrl}")`;
            flushMetricsStyle();
          };
          if (typeof canvas.toBlob === 'function' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            canvas.toBlob((blob) => {
              if (blob) applyBakedUrl(URL.createObjectURL(blob));
              else applyBakedUrl(toShortBlobUrl(canvas.toDataURL('image/webp', 0.85)));
            }, 'image/webp', 0.85);
          } else {
            applyBakedUrl(toShortBlobUrl(canvas.toDataURL('image/webp', 0.85)));
          }
        } catch (e) {}
      };
      img.src = wpUrl;
    };
    if (deferMs > 0) {
      window.__AGY_BLUR_TIMER__ = setTimeout(() => {
        window.__AGY_BLUR_TIMER__ = 0;
        runBake();
      }, deferMs);
    } else {
      runBake();
    }
  }

  function clearRevealRaf() {
    if (window.__AGY_REVEAL_RAF__) {
      cancelAnimationFrame(window.__AGY_REVEAL_RAF__);
      window.__AGY_REVEAL_RAF__ = null;
    }
    if (typeof window.__AGY_REVEAL_CLEANUP__ === 'function') {
      try { window.__AGY_REVEAL_CLEANUP__(); } catch (e) {}
      window.__AGY_REVEAL_CLEANUP__ = null;
    }
    document.querySelectorAll('.agy-shell.agy-revealing').forEach((el) => el.classList.remove('agy-revealing'));
  }

  function triggerSketchBloomReveal(instant = false) {
    clearRevealRaf();
    const st = getState();
    const layer = document.getElementById('agy-live-bg-layer');
    const mediaWrap = document.getElementById('agy-live-media-wrap');
    const canvas = document.getElementById('agy-sketch-reveal-canvas');
    const videoEl = document.getElementById('agy-live-bg-video');
    if (!layer || !mediaWrap || !canvas) return;

    const isVideoMode = st.wpMode === 'video';
    if (!st.wpEnabled) {
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.display = 'none';
      layer.classList.add('agy-bg-hidden');
      return;
    }

    if (instant || !st.sketchReveal) {
      canvas.width = 0;
      canvas.height = 0;
      canvas.style.display = 'none';
      mediaWrap.style.webkitMaskImage = 'none';
      mediaWrap.style.maskImage = 'none';
      layer.style.background = 'transparent';
      if (isVideoMode && videoEl && videoEl.getAttribute('data-src')) {
        layer.classList.remove('agy-bg-hidden');
        if (videoEl.paused && videoEl.src && !document.hidden) {
          videoEl.play().catch(() => {});
        }
      } else {
        layer.classList.add('agy-bg-hidden');
      }
      return;
    }

    loadLazyModule('reveal')
      .then((fn) => { if (typeof fn === 'function') fn(window.__AGY_INTERNAL__, false); })
      .catch(() => triggerSketchBloomReveal(true));
  }
  window.__ANTIGRAVITY_REPLAY_REVEAL__ = () => triggerSketchBloomReveal(false);

  function scheduleRevealWhenReady(allowInstant = false) {
    window.__AGY_BOOT_FINISHED__ = true;
    const shell = findActiveShell();
    if (shell) {
      const liveLayer = document.getElementById('agy-live-bg-layer');
      if (!liveLayer || liveLayer.tagName !== 'AGY-LIVE-BG' || liveLayer.parentElement !== shell) {
        applyTheme();
      }
    }
    const st = getState();
    const shouldInstant = allowInstant || !st.sketchReveal;
    if (shouldInstant) {
      window.__AGY_REVEAL_DONE_ONCE__ = true;
      triggerSketchBloomReveal(true);
      return;
    }
    const vidEl = document.getElementById('agy-live-bg-video');
    const imgEl = document.getElementById('agy-live-bg-img');
    const isVideoMode = st.wpMode === 'video' && Boolean(vidEl && vidEl.getAttribute('data-src'));
    if (isVideoMode && vidEl && vidEl.readyState < 2) {
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        window.__AGY_REVEAL_DONE_ONCE__ = true;
        triggerSketchBloomReveal(false);
      };
      vidEl.addEventListener('loadeddata', fire, { once: true });
      setTimeout(fire, 650);
    } else if (!isVideoMode && imgEl && imgEl.getAttribute('data-src') && !imgEl.complete) {
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        window.__AGY_REVEAL_DONE_ONCE__ = true;
        triggerSketchBloomReveal(false);
      };
      imgEl.addEventListener('load', fire, { once: true });
      setTimeout(fire, 500);
    } else {
      window.__AGY_REVEAL_DONE_ONCE__ = true;
      triggerSketchBloomReveal(false);
    }
  }

  function releaseVideoDecoder(videoEl) {
    if (!videoEl) return;
    videoEl.pause();
    videoEl.style.opacity = '0';
    videoEl.style.display = 'none';
    if (videoEl.getAttribute('src') || videoEl.getAttribute('data-src')) {
      videoEl.removeAttribute('src');
      videoEl.removeAttribute('data-src');
      videoEl.removeAttribute('poster');
      videoEl.load();
    }
  }

  function syncVideoAndRevealLayer(st, mainTheme, wpImageUrl, wpVideoUrl, isVideoMode, overlayRgb, overlayAlpha, bgPosition, blurStr) {
    const shell = findActiveShell();
    if (!shell) return;

    let layer = document.getElementById('agy-live-bg-layer');
    if (layer && (layer.tagName !== 'AGY-LIVE-BG' || layer.parentElement !== shell)) {
      layer.remove();
      layer = null;
    }
    if (!st.wpEnabled) {
      clearRevealRaf();
      releaseVideoDecoder(document.getElementById('agy-live-bg-video'));
      if (layer) layer.classList.add('agy-bg-hidden');
      return;
    }

    if (!layer) {
      layer = document.createElement('agy-live-bg');
      layer.id = 'agy-live-bg-layer';
      layer.style.cssText = 'display:block;position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;background:transparent;';
      layer.innerHTML = `
        <div id="agy-live-media-wrap" style="position:absolute;inset:0;overflow:hidden;">
          <video id="agy-live-bg-video" autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;opacity:0;transition:opacity 0.3s ease;"></video>
          <img id="agy-live-bg-img" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:none;" />
          <div id="agy-live-scrim" style="position:absolute;inset:0;pointer-events:none;z-index:2;opacity:0;transition:opacity 0.25s ease;"></div>
        </div>
        <canvas id="agy-sketch-reveal-canvas" style="position:absolute;inset:0;width:100%;height:100%;z-index:3;pointer-events:none;display:none;"></canvas>
      `;
      shell.insertBefore(layer, shell.firstChild);
    }

    const mediaWrap = document.getElementById('agy-live-media-wrap');
    const videoEl = document.getElementById('agy-live-bg-video');
    const imgEl = document.getElementById('agy-live-bg-img');
    const scrimEl = document.getElementById('agy-live-scrim');

    const secondaryGlowStop = mainTheme.secondaryGlow
      ? `, radial-gradient(circle at 22% 72%, ${mainTheme.secondaryGlow} 0%, transparent 55%)`
      : '';
    scrimEl.style.background = mainTheme.clearBackdrop
      ? `linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%)`
      : `radial-gradient(circle at 75% 40%, ${mainTheme.glow} 0%, transparent 65%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.85}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%)`;

    if (videoEl) {
      videoEl.style.objectPosition = bgPosition || 'center center';
    }
    if (imgEl) {
      imgEl.style.objectPosition = bgPosition || 'center center';
    }

    if (isVideoMode && wpVideoUrl) {
      layer.classList.remove('agy-bg-hidden');
      if (imgEl) imgEl.style.display = 'none';
      if (videoEl) {
        videoEl.style.display = 'block';
        if (!/^(?:data|blob|file):/i.test(wpVideoUrl)) {
          videoEl.crossOrigin = 'anonymous';
        } else {
          videoEl.removeAttribute('crossorigin');
        }
        if (!st.customVideo && wpImageUrl) {
          videoEl.poster = wpImageUrl;
        } else {
          videoEl.removeAttribute('poster');
        }
        const markVideoReady = () => {
          videoEl.style.opacity = '1';
          if (scrimEl) scrimEl.style.opacity = '1';
        };
        if (videoEl.readyState >= 2) {
          markVideoReady();
        }
        if (videoEl.getAttribute('data-src') !== wpVideoUrl) {
          videoEl.removeAttribute('data-fallback-tried');
          videoEl.style.opacity = '0';
          if (scrimEl) scrimEl.style.opacity = '0';
          videoEl.setAttribute('data-src', wpVideoUrl);
          videoEl.onloadeddata = () => {
            markVideoReady();
            if (!wpImageUrl || Boolean(st.customVideo)) {
              try {
                const c = document.createElement('canvas');
                c.width = 480;
                c.height = Math.max(240, Math.round(480 * ((videoEl.videoHeight || 1080) / Math.max(1, videoEl.videoWidth || 1920))));
                const gctx = c.getContext('2d');
                if (gctx) {
                  gctx.drawImage(videoEl, 0, 0, c.width, c.height);
                  const frameUrl = c.toDataURL('image/webp', 0.82);
                  c.width = 0;
                  c.height = 0;
                  syncPrebakedGlass(frameUrl, overlayRgb, overlayAlpha, mainTheme.headerBg || '', blurStr);
                } else {
                  c.width = 0;
                  c.height = 0;
                }
              } catch (e) {}
            }
          };
          videoEl.onplaying = markVideoReady;
          videoEl.onerror = () => {
            const fallbackVid = resolveMediaUrl(mainTheme.wallpaperVideo || '');
            if (fallbackVid && wpVideoUrl !== fallbackVid && !videoEl.getAttribute('data-fallback-tried')) {
              videoEl.setAttribute('data-fallback-tried', '1');
              videoEl.removeAttribute('crossorigin');
              videoEl.setAttribute('data-src', fallbackVid);
              videoEl.src = fallbackVid;
              videoEl.load();
              if (!document.hidden) {
                delete videoEl.dataset.agyPausedByHidden;
                videoEl.play().catch(() => {});
              } else {
                videoEl.dataset.agyPausedByHidden = '1';
              }
              return;
            }
            videoEl.style.opacity = '0';
            if (scrimEl) scrimEl.style.opacity = '0';
          };
          videoEl.src = wpVideoUrl;
          videoEl.load();
          if (!document.hidden) {
            delete videoEl.dataset.agyPausedByHidden;
            videoEl.play().catch(() => {});
          } else {
            videoEl.dataset.agyPausedByHidden = '1';
          }
        } else if (videoEl.paused) {
          if (!document.hidden) {
            delete videoEl.dataset.agyPausedByHidden;
            videoEl.play().catch(() => {});
          } else {
            videoEl.dataset.agyPausedByHidden = '1';
          }
        }
      }
      if (!window.__AGY_REVEAL_DONE_ONCE__ && (!st.bootIntro || window.__AGY_BOOT_FINISHED__)) {
        scheduleRevealWhenReady(false);
      } else if (!window.__AGY_REVEAL_RAF__ && mediaWrap) {
        mediaWrap.style.webkitMaskImage = 'none';
        mediaWrap.style.maskImage = 'none';
      }
    } else {
      if (scrimEl) scrimEl.style.opacity = '0';
      releaseVideoDecoder(videoEl);
      if (imgEl && wpImageUrl) {
        if (!/^(?:data|blob|file):/i.test(wpImageUrl)) {
          imgEl.crossOrigin = 'anonymous';
        } else {
          imgEl.removeAttribute('crossorigin');
        }
        imgEl.style.display = 'block';
        if (imgEl.getAttribute('data-src') !== wpImageUrl) {
          imgEl.setAttribute('data-src', wpImageUrl);
          imgEl.src = wpImageUrl;
        }
      }
      if (!window.__AGY_REVEAL_DONE_ONCE__ && (!st.bootIntro || window.__AGY_BOOT_FINISHED__)) {
        scheduleRevealWhenReady(false);
      } else if (!window.__AGY_REVEAL_RAF__) {
        layer.classList.add('agy-bg-hidden');
      }
    }
  }

  // ==================== MONOCHROME STARFIELD BOOT HUD + ARISU-TAWA VOICE ====================
  function clearBootTimers() {
    if (Array.isArray(window.__AGY_BOOT_TIMERS__)) {
      window.__AGY_BOOT_TIMERS__.forEach((id) => clearTimeout(id));
    }
    window.__AGY_BOOT_TIMERS__ = [];
    if (window.__AGY_BOOT_CLOCK__) {
      clearInterval(window.__AGY_BOOT_CLOCK__);
      window.__AGY_BOOT_CLOCK__ = null;
    }
    if (window.__AGY_BOOT_HEX__) {
      clearInterval(window.__AGY_BOOT_HEX__);
      window.__AGY_BOOT_HEX__ = null;
    }
    if (window.__AGY_BOOT_KEYDOWN__) {
      window.removeEventListener('keydown', window.__AGY_BOOT_KEYDOWN__, true);
      window.__AGY_BOOT_KEYDOWN__ = null;
    }
  }

  function stopBootAudio() {
    if (window.__AGY_BOOT_AUDIO__) {
      try {
        window.__AGY_BOOT_AUDIO__.pause();
        window.__AGY_BOOT_AUDIO__.currentTime = 0;
      } catch (e) {}
      window.__AGY_BOOT_AUDIO__ = null;
    }
    try {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } catch (e) {}
  }

  function teardownBootOverlay() {
    clearBootTimers();
    stopBootAudio();
    const ov = document.getElementById('agy-boot-overlay');
    if (ov) ov.remove();
    const fl = document.getElementById('agy-flash-curtain');
    if (fl) fl.remove();
    const st = document.getElementById('agy-boot-styles');
    if (st) st.remove();
  }

  function mountBootSequence(forceReplay = false) {
    const st = getState();
    if (!forceReplay && (!st.bootIntro || window.__AGY_BOOT_PLAYED__)) {
      return;
    }
    window.__AGY_BOOT_PLAYED__ = true;
    loadLazyModule('boot')
      .then((fn) => { if (typeof fn === 'function') fn(window.__AGY_INTERNAL__, forceReplay); })
      .catch(() => {
        window.__AGY_BOOT_FINISHED__ = true;
        scheduleRevealWhenReady(true);
      });
  }
  window.__ANTIGRAVITY_REPLAY_BOOT__ = () => mountBootSequence(true);

  function ensureGreetingFonts() {
    if (document.getElementById('agy-greeting-font-style')) return;
    const host = document.head || document.documentElement;
    if (!host) return;
    const subsets = [
      {
        src: resolveMediaUrl(BOOT_ASSETS.greetingFontVi || 'assets/fonts/mali-500-vi.woff2'),
        range: 'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB'
      },
      {
        src: resolveMediaUrl(BOOT_ASSETS.greetingFontLatinExt || 'assets/fonts/mali-500-latin-ext.woff2'),
        range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF'
      },
      {
        src: resolveMediaUrl(BOOT_ASSETS.greetingFontLatin || 'assets/fonts/mali-500-latin.woff2'),
        range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
      }
    ];
    const fontEl = document.createElement('style');
    fontEl.id = 'agy-greeting-font-style';
    fontEl.textContent = subsets.map((s) => `
      @font-face {
        font-family: 'AgyTawaMali';
        font-style: normal;
        font-weight: 500;
        font-display: swap;
        src: url("${sanitizeCssUrl(s.src)}") format('woff2');
        unicode-range: ${s.range};
      }`).join('\n');
    host.appendChild(fontEl);
  }

  function applyTheme(overrides = {}, opts = {}) {
    const st = { ...getState(), ...overrides };
    if (st.tawaGreeting) ensureGreetingFonts();
    try {
      localStorage.setItem(STORAGE_THEME, st.themeName);
      localStorage.setItem(STORAGE_BUBBLE, st.bubbleName);
      localStorage.setItem(STORAGE_INPUT, st.inputStyle);
      localStorage.setItem(STORAGE_DIMMING, String(st.dimming));
      localStorage.setItem(STORAGE_WP_ENABLED, String(st.wpEnabled));
      localStorage.setItem(STORAGE_WP_MODE, st.wpMode);
      if (overrides.customWp !== undefined) {
        localStorage.setItem(STORAGE_CUSTOM_WP, overrides.customWp);
      }
      if (overrides.customVideo !== undefined) {
        localStorage.setItem(STORAGE_CUSTOM_VIDEO, overrides.customVideo);
      }
      if (overrides.savedImages !== undefined) {
        localStorage.setItem(STORAGE_SAVED_IMAGES, JSON.stringify(st.savedImages));
      }
      if (overrides.savedVideos !== undefined) {
        localStorage.setItem(STORAGE_SAVED_VIDEOS, JSON.stringify(st.savedVideos));
      }
      if (overrides.taskVoices !== undefined) {
        localStorage.setItem(STORAGE_TASK_VOICES, JSON.stringify(st.taskVoices));
      }
      if (overrides.taskVoiceEnabled !== undefined) {
        localStorage.setItem(STORAGE_TASK_VOICE_ENABLED, String(st.taskVoiceEnabled));
      }
      if (overrides.taskVoiceVol !== undefined) {
        localStorage.setItem(STORAGE_TASK_VOICE_VOL, String(st.taskVoiceVol));
      }
      if (overrides.customGreetings !== undefined) {
        localStorage.setItem(STORAGE_CUSTOM_GREETINGS, JSON.stringify(st.customGreetings));
      }
      if (overrides.bootIntro !== undefined) {
        localStorage.setItem(STORAGE_BOOT_INTRO, String(st.bootIntro));
      }
      if (overrides.sketchReveal !== undefined) {
        localStorage.setItem(STORAGE_SKETCH_REVEAL, String(st.sketchReveal));
      }
      if (overrides.tawaGreeting !== undefined) {
        localStorage.setItem(STORAGE_TAWA_GREETING, String(st.tawaGreeting));
      }
      if (overrides.userAvatar !== undefined) {
        localStorage.setItem(STORAGE_USER_AVATAR, overrides.userAvatar);
      }
      if (overrides.agentAvatar !== undefined) {
        localStorage.setItem(STORAGE_AGENT_AVATAR, overrides.agentAvatar);
      }
      if (overrides.glassBlur !== undefined) {
        localStorage.setItem(STORAGE_GLASS_BLUR, String(overrides.glassBlur));
      }
      if (overrides.avatarSize !== undefined) {
        localStorage.setItem(STORAGE_AVATAR_SIZE, String(overrides.avatarSize));
      }
      if (overrides.avatarRadius !== undefined) {
        localStorage.setItem(STORAGE_AVATAR_RADIUS, String(overrides.avatarRadius));
      }
    } catch (e) {}
    window.__AGY_STATE_CACHE__ = st;

    if (!opts.skipSave) {
      persistThemeConfig(st, Boolean(opts.debounceSave));
    }

    const mainTheme = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY];
    const bubbleTheme = THEMES[st.bubbleName] || mainTheme;
    const wpUrl = toShortBlobUrl(resolveMediaUrl(st.customWp || mainTheme.wallpaper || ''));
    const wpVideoUrl = resolveMediaUrl(st.customVideo || mainTheme.wallpaperVideo || '');
    const isVideoMode = Boolean(st.wpEnabled && st.wpMode === 'video' && wpVideoUrl);

    let styleEl = document.getElementById('antigravity-custom-theme-active');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'antigravity-custom-theme-active';
      document.head.appendChild(styleEl);
    }

    const overlayAlpha = mainTheme.clearBackdrop
      ? Math.min(0.92, Math.max(0.0, ((st.dimming - 10) / 82) * 0.85))
      : Math.min(0.92, Math.max(0.12, (st.dimming / 100) * 0.78));
    const overlayRgb = mainTheme.overlayRgb || '10, 7, 6';
    const bgPosition = mainTheme.bgPosition || 'center center';
    const secondaryGlowStop = mainTheme.secondaryGlow
      ? `, radial-gradient(circle at 22% 72%, ${mainTheme.secondaryGlow} 0%, transparent 55%)`
      : '';

    let bgLayers = '';
    if (wpUrl) {
      bgLayers = mainTheme.clearBackdrop
        ? `linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`
        : `radial-gradient(circle at 75% 40%, ${mainTheme.glow} 0%, transparent 65%)${secondaryGlowStop}, linear-gradient(180deg, rgba(${overlayRgb}, ${overlayAlpha * 0.85}) 0%, rgba(${overlayRgb}, ${overlayAlpha}) 100%), url("${wpUrl}")`;
    } else {
      bgLayers = mainTheme.pureBg || `radial-gradient(circle at 75% 30%, ${mainTheme.glow} 0%, transparent 60%), linear-gradient(160deg, rgba(${overlayRgb}, 0.96) 0%, #070910 100%)`;
    }

    const wpCss = st.wpEnabled ? `
      .agy-shell {
        background-image: ${bgLayers} !important;
        background-size: cover !important;
        background-position: ${bgPosition} !important;
        background-repeat: no-repeat !important;
        image-rendering: auto !important;
      }
      .agy-shell > :not(#agy-live-bg-layer):not([data-has-browser-hole="true"]) {
        position: relative;
        z-index: 1;
      }
      /* Keep transparent scrollers on GPU composited-scrolling layers */
      .agy-shell .overflow-y-auto {
        will-change: scroll-position;
      }
      .agy-sheet,
      .agy-inset-shell,
      .browser-hole-opaque,
      [data-main-content-body="true"],
      [data-side-panel-body="true"],
      [class*="agy-inset-shell"],
      [class*="--shell-canvas"],
      .agy-shell div.absolute.bottom-0.pointer-events-none,
      .agy-shell [class*="z-50"] .pointer-events-none.right-full,
      .agy-shell .bg-background:not(.settings-modal-container):not(.settings-modal-container *):not(#agy-custom-theme-modal-backdrop *) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      /* Browser split-pane hole cutout: keep wallpaper & L-glass visible outside [data-browser-hole] without covering live BrowserView */
      ${isVideoMode ? '' : `
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"]::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: ${bgLayers};
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        clip-path: var(--agy-hole-clip, none);
        will-change: transform;
      }
      `}
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > :not([data-has-browser-hole="true"]):not([data-browser-hole]:not([data-browser-hole="false"])):not(.settings-modal-container),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] .browser-hole-opaque:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-pane-id]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-tiling-pane]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-main-content-header]:not([data-has-browser-hole="true"]),
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-side-panel-strip]:not([data-has-browser-hole="true"]) {
        background: transparent !important;
        background-color: transparent !important;
        background-image: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] :is([data-main-content-body], [data-side-panel-body]):not([data-has-browser-hole="true"]) {
        box-shadow: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] [data-split-sash] {
        background: rgba(56, 189, 248, 0.14) !important;
        background-image: none !important;
      }
    ` : `
      .agy-shell {
        background: #111113 !important;
      }
    `;

    const defaultCornerSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M2 20 L2 6 Q2 2 6 2 L20 2' stroke='%23fbbf24' stroke-width='1.5' fill='none' opacity='0.65'/%3E%3Ccircle cx='6' cy='6' r='2' fill='%23fbbf24' opacity='0.75'/%3E%3C/svg%3E";
    const cornerFiligreeUrl = bubbleTheme.cornerSvg ? resolveMediaUrl(bubbleTheme.cornerSvg) : defaultCornerSvg;
    const stickerUrl = bubbleTheme.sticker ? resolveMediaUrl(bubbleTheme.sticker) : '';

    const bubbleStickerCss = stickerUrl ? (bubbleTheme.isOrnament ? `
      .group\\/user-input-step {
        padding-top: 18px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${stickerUrl}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    ` : `
      .group\\/user-input-step {
        padding-top: ${Math.max(36, Math.abs(bubbleTheme.stickerTop) + 8)}px !important;
      }
      .agy-user-bubble-frame::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: ${bubbleTheme.stickerRight}px;
        width: ${bubbleTheme.stickerW}px;
        height: ${bubbleTheme.stickerH}px;
        background-image: url("${stickerUrl}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 25;
        pointer-events: none;
        transition: transform 0.2s ease;
      }
    `) : `
      .agy-user-bubble-frame::before { display: none !important; }
    `;

    const showInputSticker = st.inputStyle !== 'minimal' && stickerUrl;
    const inputStickerCss = showInputSticker ? (bubbleTheme.isOrnament ? `
      .surface-composer {
        margin-top: 16px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 8}px;
        height: ${bubbleTheme.stickerH + 2}px;
        background-image: url("${stickerUrl}");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after {
        content: "";
        position: absolute;
        bottom: 3px;
        left: 4px;
        width: 16px;
        height: 16px;
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        transform: rotate(180deg);
        z-index: 25;
        pointer-events: none;
        opacity: 0.78;
      }
    ` : `
      .surface-composer {
        margin-top: 28px !important;
        overflow: visible !important;
      }
      .surface-composer::before {
        content: "";
        position: absolute;
        top: ${bubbleTheme.stickerTop - 4}px;
        right: 16px;
        width: ${bubbleTheme.stickerW + 6}px;
        height: ${bubbleTheme.stickerH + 6}px;
        background-image: url("${stickerUrl}");
        background-size: contain;
        background-position: bottom center;
        background-repeat: no-repeat;
        z-index: 30;
        pointer-events: none;
      }
      .surface-composer::after { display: none !important; }
    `) : `
      .surface-composer::before,
      .surface-composer::after { display: none !important; }
    `;

    const inputCardBg =
      st.inputStyle === 'glass'
        ? (bubbleTheme.inputGlassBg || 'rgba(20, 15, 13, 0.52)')
        : st.inputStyle === 'double_gold'
        ? 'linear-gradient(145deg, rgba(44, 28, 20, 0.90) 0%, rgba(24, 15, 12, 0.92) 100%)'
        : (bubbleTheme.inputCardBg || 'rgba(28, 19, 16, 0.88)');

    const inputOuterBorder =
      st.inputStyle === 'double_gold'
        ? 'linear-gradient(135deg, #f59e0b 0%, rgba(217, 119, 6, 0.35) 50%, #fbbf24 100%)'
        : bubbleTheme.frameBg;

    const sidebarBg = mainTheme.sidebarBg || 'rgba(14, 10, 8, 0.68)';
    const sidebarHoverBg = mainTheme.sidebarHoverBg || 'rgba(255, 255, 255, 0.08)';
    const btnBg = mainTheme.btnBg || 'rgba(48, 30, 22, 0.62)';
    const modalBg = mainTheme.modalBg || 'rgba(14, 12, 12, 0.96)';
    const innerBubbleBorder = bubbleTheme.isScroll
      ? '2px solid #78350f'
      : (bubbleTheme.innerBorder || '1px solid rgba(255, 255, 255, 0.06)');

    const isLight = Boolean(mainTheme.isLight);
    const uiInk = mainTheme.uiTextColor || (isLight ? '#0f172a' : 'rgba(248, 250, 252, 0.96)');
    const uiMutedInk = mainTheme.uiMutedColor || (isLight ? '#334155' : 'rgba(241, 245, 249, 0.92)');
    const uiShadow = isLight ? 'none' : '0 1px 4px rgba(0, 0, 0, 0.92), 0 0 8px rgba(0, 0, 0, 0.68)';
    const pillBg = mainTheme.pillBg || (isLight ? 'rgba(255, 255, 255, 0.78)' : 'rgba(6, 11, 24, 0.78)');
    const pillHoverBg = mainTheme.pillHoverBg || (isLight ? 'rgba(255, 255, 255, 0.94)' : 'rgba(10, 18, 38, 0.92)');
    const pillText = mainTheme.pillTextColor || (isLight ? '#0f172a' : '#f8fafc');
    const pillBorder = mainTheme.pillBorder || (isLight ? 'rgba(15, 23, 42, 0.16)' : 'rgba(255, 255, 255, 0.16)');
    const preCodeBg = isLight ? `rgba(${overlayRgb}, 0.72)` : `rgba(${overlayRgb}, 0.56)`;

    const rawUserAv = st.userAvatar === 'none' ? '' : (st.userAvatar || mainTheme.userAvatar || '');
    const rawAgentAv = st.agentAvatar === 'none' ? '' : (st.agentAvatar || mainTheme.agentAvatar || '');
    const effectiveUserAvatar = rawUserAv ? toShortBlobUrl(resolveMediaUrl(rawUserAv)) : '';
    const effectiveAgentAvatar = rawAgentAv ? toShortBlobUrl(resolveMediaUrl(rawAgentAv)) : '';
    const avSize = Math.min(52, Math.max(22, Number(st.avatarSize) || 32));
    const avAgentSize = Math.max(22, avSize - 2);
    const avRadius = Math.min(50, Math.max(0, Number.isFinite(Number(st.avatarRadius)) ? Number(st.avatarRadius) : 50));

    const avatarCss = `
      ${effectiveUserAvatar ? `
      .agy-shell [data-testid="user-message"] {
        position: relative !important;
        padding-right: ${avSize + 10}px !important;
      }
      .agy-shell [data-testid="user-message"]::after {
        content: "";
        position: absolute;
        right: 0;
        bottom: 6px;
        width: ${avSize}px;
        height: ${avSize}px;
        border-radius: ${avRadius}%;
        background-image: url("${effectiveUserAvatar}");
        background-size: cover;
        background-position: center;
        border: 1.5px solid ${mainTheme.primary};
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 8px ${mainTheme.glow};
        pointer-events: none;
      }
      ` : ''}
      ${effectiveAgentAvatar ? `
      .agy-shell [data-testid="agent-response"] {
        position: relative !important;
        padding-left: ${avAgentSize + 22}px !important;
        min-height: ${avAgentSize + 20}px !important;
      }
      .agy-shell [data-testid="agent-response"]::before {
        content: "";
        position: absolute;
        top: 12px;
        left: 12px;
        width: ${avAgentSize}px;
        height: ${avAgentSize}px;
        border-radius: ${avRadius}%;
        background-image: url("${effectiveAgentAvatar}");
        background-size: cover;
        background-position: center;
        border: 1.5px solid ${mainTheme.secondary || mainTheme.primary};
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4), 0 0 8px ${mainTheme.secondaryGlow || mainTheme.glow};
        pointer-events: none;
      }
      ` : ''}
    `;

    const sidebarEnhanceCss = (mainTheme.sidebarEnhanceText || isLight) ? `
      .agy-shell .bg-sidebar a,
      .agy-shell .bg-sidebar span,
      .agy-shell .bg-sidebar button {
        color: ${isLight ? uiInk : 'inherit'};
        text-shadow: ${isLight ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.88)'};
      }
      .agy-shell .bg-sidebar .text-muted-foreground,
      .agy-shell .bg-sidebar .text-secondary-foreground {
        color: ${uiMutedInk} !important;
      }
    ` : '';

    const aiCardCss = mainTheme.aiCardBg ? `
      /* Translucent reading card for AI responses (zero live backdrop-filter for max 120fps scroll) */
      .agy-shell [data-testid="agent-response"] {
        background: ${mainTheme.aiCardBg} !important;
        ${isLight ? `color: ${uiInk} !important;` : ''}
        backdrop-filter: none !important;
        border: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.1)')} !important;
        border-radius: 14px !important;
        padding: 12px 16px !important;
        box-shadow: ${isLight ? '0 4px 14px rgba(15, 23, 42, 0.08)' : '0 4px 14px rgba(0, 0, 0, 0.28)'} !important;
        box-sizing: border-box !important;
        overflow: hidden !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-bleed,
      .agy-shell [data-testid="agent-response"] .md-table-host {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        margin-inline: 0 !important;
        left: auto !important;
        right: auto !important;
        transform: none !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll,
      .agy-shell [data-testid="agent-response"] .agy-table-scroll-wrap {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        padding-bottom: 2px !important;
        box-sizing: border-box !important;
        /* Keep standard scrollbar-width: auto so Chromium does not disable ::-webkit-scrollbar */
        scrollbar-width: auto !important;
        scrollbar-color: auto !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-frame {
        /* .md-table-frame sits INSIDE .md-table-scroll; forcing width:100% + overflow:hidden hid overflow from .md-table-scroll */
        width: fit-content !important;
        min-width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        transform: none !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll::-webkit-scrollbar,
      .agy-shell [data-testid="agent-response"] .agy-table-scroll-wrap::-webkit-scrollbar {
        height: 8px !important;
        display: block !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll::-webkit-scrollbar-track,
      .agy-shell [data-testid="agent-response"] .agy-table-scroll-wrap::-webkit-scrollbar-track {
        background: ${isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.06)'} !important;
        border-radius: 9999px !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll::-webkit-scrollbar-thumb,
      .agy-shell [data-testid="agent-response"] .agy-table-scroll-wrap::-webkit-scrollbar-thumb {
        background: ${isLight ? 'rgba(15, 23, 42, 0.34)' : 'rgba(148, 163, 184, 0.48)'} !important;
        border-radius: 9999px !important;
      }
      .agy-shell [data-testid="agent-response"] .md-table-scroll::-webkit-scrollbar-thumb:hover,
      .agy-shell [data-testid="agent-response"] .agy-table-scroll-wrap::-webkit-scrollbar-thumb:hover {
        background: ${isLight ? 'rgba(15, 23, 42, 0.54)' : 'rgba(148, 163, 184, 0.72)'} !important;
      }
      .agy-shell [data-testid="agent-response"] table {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        table-layout: auto !important;
        box-sizing: border-box !important;
      }
      .agy-shell [data-testid="agent-response"] :is(th, td) {
        max-width: none !important;
        white-space: normal !important;
        word-break: normal !important;
        overflow-wrap: break-word !important;
        padding: 8px 12px !important;
      }
      .agy-shell [data-testid="agent-response"] :is(td, th) .inline-pill-wrap {
        min-width: 0 !important;
      }
      ${isLight ? `
      .agy-shell [data-main-content-body="true"],
      .agy-shell [data-testid="agent-response"] :is(p, li, span, code, h1, h2, h3, h4, strong, td, th) {
        color: ${uiInk};
      }
      ` : ''}
      .agy-shell [data-main-content-body="true"] h1,
      .agy-shell [data-main-content-body="true"] h2 {
        text-shadow: ${isLight ? 'none' : '0 2px 10px rgba(0, 0, 0, 0.85)'};
      }
    ` : '';

    const rawBlurPx = Number.isFinite(st.glassBlur)
      ? st.glassBlur
      : (parseFloat(String(mainTheme.headerBlur || '3')) || 0);
    const effectiveBlurPx = Math.max(0, Math.min(16, rawBlurPx));
    const effectiveBlur = `${effectiveBlurPx}px`;
    const useUnifiedGlass = Boolean(st.wpEnabled && wpUrl && mainTheme.unifiedGlass);
    const useBakedGlass = Boolean(useUnifiedGlass && !isVideoMode && effectiveBlurPx > 0);
    window.__AGY_USE_BAKED_GLASS__ = useBakedGlass;
    if (useBakedGlass) {
      syncPrebakedGlass(wpUrl, overlayRgb, overlayAlpha, mainTheme.headerBg || '', effectiveBlur, opts.debounceSave ? 80 : 0);
    } else {
      syncPrebakedGlass(null);
    }
    if (useUnifiedGlass && typeof hookShellMetrics === 'function') {
      hookShellMetrics(true);
    }
    syncVideoAndRevealLayer(st, mainTheme, wpUrl, wpVideoUrl, isVideoMode, overlayRgb, overlayAlpha, bgPosition, effectiveBlur);

    const sidePanelCss = st.wpEnabled ? `
      /* Frosted pre-baked glass + dark/light reading scrim for right-side Artifact / Text / Diff split panels */
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not([data-agy-has-hole="1"]) {
        background: ${mainTheme.aiCardBg || `rgba(${overlayRgb}, 0.72)`} !important;
        ${isLight ? `color: ${uiInk} !important;` : ''}
        backdrop-filter: none !important;
        border-left: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)')} !important;
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
      }
      body:not([data-has-browser-hole="true"]) .agy-shell [data-side-panel-body="true"]:not([data-has-browser-hole="true"]):not([data-agy-has-hole="1"]) pre {
        background: ${preCodeBg} !important;
        border: 1px solid ${mainTheme.aiCardBorder || (isLight ? 'rgba(15, 23, 42, 0.14)' : 'rgba(255, 255, 255, 0.14)')} !important;
        border-radius: 10px !important;
      }
      .agy-shell [data-side-panel-body="true"] :is(h1, h2, h3, h4) {
        ${isLight ? `color: ${uiInk} !important;` : ''}
        text-shadow: ${isLight ? 'none' : '0 1px 6px rgba(0, 0, 0, 0.85)'};
      }
    ` : '';

    const headerCss = mainTheme.headerBg ? `
      /* Frosted top titlebar & seamless L-shaped unified glass (zero live backdrop-filter) */
      ${useUnifiedGlass ? `
      .agy-shell {
        position: relative !important;
      }
      .agy-shell > div:first-of-type {
        position: relative !important;
        z-index: 3 !important;
      }
      .agy-shell > div:not(:first-of-type) {
        position: relative !important;
        z-index: 2 !important;
      }
      .agy-shell::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        ${(!useBakedGlass) ? `
        background-color: ${mainTheme.sidebarBg || mainTheme.headerBg || 'rgba(7, 10, 18, 0.34)'};
        background-image: none;
        ` : `
        background-color: ${mainTheme.headerBg};
        background-size: cover;
        background-position: ${bgPosition};
        background-repeat: no-repeat;
        `}
        backdrop-filter: none !important;
        transition: opacity 0.28s ease;
        will-change: transform;
      }
      .agy-shell.agy-revealing::before {
        opacity: 0 !important;
      }
      .agy-shell [data-main-content-header] {
        background: transparent !important;
        backdrop-filter: none !important;
      }
      .agy-shell [class*="@container/titlebar"] {
        background: transparent !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || 'rgba(56, 189, 248, 0.10)'} !important;
      }
      ` : `
      .agy-shell [class*="@container/titlebar"] {
        background: ${mainTheme.headerBg} !important;
        backdrop-filter: none !important;
        border-bottom: 1px solid ${mainTheme.headerBorder || 'rgba(56, 189, 248, 0.15)'} !important;
      }
      `}
      .agy-shell [class*="@container/titlebar"] [data-testid="breadcrumb-segment"],
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button,
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] span {
        color: ${uiInk} !important;
        text-shadow: ${uiShadow};
      }
      .agy-shell [class*="@container/titlebar"] [data-testid="pane-titlebar-toolbar"] button.border {
        background: ${isLight ? 'rgba(255, 255, 255, 0.56)' : 'rgba(6, 11, 24, 0.36)'} !important;
        border-color: ${pillBorder} !important;
      }
    ` : '';

    const sidebarOuterCss = useUnifiedGlass ? `
      .agy-shell aside,
      .agy-shell [data-sidebar="true"],
      .agy-shell .bg-sidebar {
        background: transparent !important;
        backdrop-filter: none !important;
      }
    ` : `
      .agy-shell aside,
      .agy-shell [data-sidebar="true"],
      .agy-shell .bg-sidebar {
        background: ${sidebarBg} !important;
        backdrop-filter: none !important;
      }
    `;

    styleEl.textContent = `
      ${wpCss}

      /* Translucent themed sidebar (unified via ::before when unifiedGlass is active) */
      ${sidebarOuterCss}
      .agy-shell .bg-sidebar .bg-sidebar,
      .agy-shell [data-sidebar="true"] .bg-sidebar,
      .agy-shell .bg-sidebar [class*="group/headerbtn"],
      .agy-shell .bg-sidebar [class*="group/section-header"] {
        background: transparent !important;
        backdrop-filter: none !important;
      }
      /* Preserve virtual list positioning; hide sticky headers only while scrolled */
      .agy-shell .bg-sidebar .agy-scrolled > .w-full.relative > .bg-sidebar[style*="position: sticky"] {
        opacity: 0 !important;
        pointer-events: none !important;
        transition: opacity 0.14s ease !important;
      }
      .agy-shell .bg-sidebar [class*="group/headerbtn"]:hover,
      .agy-shell .bg-sidebar a:hover {
        background: ${sidebarHoverBg} !important;
      }
      ${sidebarEnhanceCss}
      ${aiCardCss}
      ${sidePanelCss}
      ${avatarCss}
      ${headerCss}

      /* "+ New Conversation" button glow */
      .agy-button-custom.border.border-border {
        background: ${btnBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3) !important;
      }

      /* User Chat Bubble Double-Border Frame & Ornament */
      .agy-user-bubble-frame {
        background: ${bubbleTheme.frameBg} !important;
        border-radius: ${bubbleTheme.isScroll ? '6px' : '14px'} !important;
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45), 0 0 12px ${bubbleTheme.glow} !important;
        position: relative !important;
        overflow: visible !important;
        padding: 1.2px !important;
      }

      .agy-user-bubble-frame::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: ${bubbleTheme.isOrnament ? '16px' : '14px'};
        height: ${bubbleTheme.isOrnament ? '16px' : '14px'};
        background-image: url("${cornerFiligreeUrl}");
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        opacity: ${bubbleTheme.isOrnament ? '0.85' : '0.65'};
      }

      .agy-user-bubble {
        background: ${bubbleTheme.bg} !important;
        border-radius: ${bubbleTheme.isScroll ? '5px' : '13px'} !important;
        padding: 8px 16px !important;
        color: ${bubbleTheme.textColor} !important;
        border: ${innerBubbleBorder} !important;
        overflow: visible !important;
        font-weight: 450 !important;
      }

      .agy-user-bubble * {
        color: ${bubbleTheme.textColor} !important;
      }

      /* Double-Border Input Composer */
      .surface-composer {
        background: ${inputOuterBorder} !important;
        border-radius: 16px !important;
        padding: 1.5px !important;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5), 0 0 14px ${bubbleTheme.glow} !important;
        position: relative !important;
      }

      .surface-composer-card {
        background: ${inputCardBg} !important;
        backdrop-filter: none !important;
        border-radius: 14.5px !important;
        border: ${bubbleTheme.innerBorder || '1px solid rgba(255, 255, 255, 0.07)'} !important;
      }

      /* High-contrast pill badges for top composer bar (adaptive light/dark theme) */
      .surface-composer [data-testid="project-selector-trigger"],
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] {
        background: ${pillBg} !important;
        color: ${pillText} !important;
        border: 1px solid ${pillBorder} !important;
        border-radius: 9999px !important;
        font-weight: 500 !important;
        box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25) !important;
        margin: 1px 2px !important;
        transition: background-color 0.15s ease, border-color 0.15s ease !important;
      }
      .surface-composer [data-testid="branch-pill-trigger"],
      .surface-composer [aria-label="Select Environment"],
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:not([data-testid="project-selector-trigger"]),
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:not([data-testid="project-selector-trigger"]) {
        padding-left: 8px !important;
        padding-right: 7px !important;
        gap: 4px !important;
      }
      .surface-composer [data-testid="project-selector-trigger"]:hover,
      .surface-composer [data-testid="branch-pill-trigger"]:hover,
      .surface-composer [aria-label="Select Environment"]:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button:hover,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"]:hover {
        background: ${pillHoverBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        color: ${pillText} !important;
      }
      .surface-composer [data-testid="project-selector-trigger"] *,
      .surface-composer [data-testid="branch-pill-trigger"] *,
      .surface-composer [aria-label="Select Environment"] *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] button *,
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] [role="button"] * {
        color: ${pillText} !important;
      }
      .surface-composer > :not(.surface-composer-card) [data-testid="input-box-bottom-toolbar"] .ml-auto > * {
        background: ${pillBg} !important;
        color: ${pillText} !important;
        border-radius: 9999px !important;
        padding: 2px 8px !important;
      }

      ${bubbleStickerCss}
      ${inputStickerCss}

      @media (max-width: 640px) {
        .agy-user-bubble-frame::before,
        .surface-composer::before {
          transform: scale(0.78);
          transform-origin: bottom right;
        }
      }

      .settings-modal-container {
        background: ${modalBg} !important;
        border: 1px solid ${mainTheme.borderColor} !important;
        box-shadow: 0 12px 48px rgba(0, 0, 0, 0.75), 0 0 24px ${mainTheme.glow} !important;
        backdrop-filter: none !important;
      }

      #agy-custom-theme-modal-dialog {
        background: ${modalBg} !important;
        border-color: ${mainTheme.borderColor} !important;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.9), 0 0 32px ${mainTheme.glow} !important;
      }
      #agy-custom-theme-modal-header {
        background: ${mainTheme.modalHeaderBg || 'rgba(22, 16, 14, 0.85)'} !important;
      }
      #agy-custom-theme-badge {
        color: ${mainTheme.primary} !important;
        border-color: ${mainTheme.borderColor} !important;
        background: ${mainTheme.glow} !important;
      }
      #agy-custom-theme-sidebar-btn svg {
        color: ${mainTheme.primary} !important;
      }
      .agy-shell > #agy-live-bg-layer,
      #agy-live-bg-layer {
        display: block !important;
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        z-index: 0 !important;
        pointer-events: none !important;
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      #agy-live-bg-layer.agy-bg-hidden {
        display: none !important;
      }
      body[data-has-browser-hole="true"] .agy-shell[data-agy-hole-active="1"] > #agy-live-bg-layer {
        clip-path: var(--agy-hole-clip, none) !important;
      }
      .agy-shell [data-agy-greeting] {
        font-size: 0 !important;
        line-height: 0 !important;
        color: transparent !important;
        text-shadow: none !important;
      }
      .agy-shell [data-agy-greeting]::after {
        content: attr(data-agy-greeting);
        font-family: 'AgyTawaMali', 'Mali', 'Segoe Print', 'Comic Sans MS', cursive !important;
        font-size: clamp(22px, 2.15vw, 29px) !important;
        line-height: 1.44 !important;
        font-weight: 500 !important;
        color: ${isLight ? '#0f172a' : '#f8fafc'} !important;
        text-shadow: ${isLight ? '0 1px 2px rgba(255, 255, 255, 0.55)' : '0 2px 15px rgba(0, 0, 0, 0.85), 0 1px 4px rgba(0, 0, 0, 0.65)'} !important;
        display: block !important;
        text-align: center !important;
        letter-spacing: 0.01em !important;
        max-width: 820px;
        margin: 0 auto;
        white-space: normal !important;
      }
    `;

    syncTitleBarOverlay(st);
    scheduleTitleBarSync(st);
    syncEmptyGreeting(st);
  }

  function syncTitleBarOverlay(stOverride) {
    const st = stOverride || getState();
    const activeTh = THEMES[st.themeName] || THEMES[DEFAULT_THEME_KEY] || {};
    if (window.electronNative && typeof window.electronNative.setTitleBarOverlay === 'function') {
      try {
        window.electronNative.setTitleBarOverlay({
          color: st.wpEnabled ? '#00000000' : '#111114',
          symbolColor: (st.wpEnabled && activeTh.isLight) ? '#0f172a' : '#f8fafc'
        });
      } catch (e) {}
    }
  }

  function clearTitleBarTimers() {
    if (Array.isArray(window.__AGY_TBO_TIMERS__)) {
      window.__AGY_TBO_TIMERS__.forEach(id => clearTimeout(id));
    }
    window.__AGY_TBO_TIMERS__ = [];
  }

  function scheduleTitleBarSync(stOverride) {
    clearTitleBarTimers();
    const st = stOverride || getState();
    syncTitleBarOverlay(st);
    [300, 900, 2000, 4000, 7000].forEach(ms => {
      window.__AGY_TBO_TIMERS__.push(setTimeout(() => syncTitleBarOverlay(), ms));
    });
  }

  function removeCustomTheme() {
    clearTitleBarTimers();
    clearRevealRaf();
    teardownBootOverlay();
    stopTaskAudio();
    if (window.__AGY_TASK_COMPLETE_TIMER__) {
      clearTimeout(window.__AGY_TASK_COMPLETE_TIMER__);
      window.__AGY_TASK_COMPLETE_TIMER__ = null;
    }
    if (window.__AGY_SAVE_TIMER__) {
      clearTimeout(window.__AGY_SAVE_TIMER__);
      window.__AGY_SAVE_TIMER__ = 0;
    }
    if (window.__AGY_BLUR_TIMER__) {
      clearTimeout(window.__AGY_BLUR_TIMER__);
      window.__AGY_BLUR_TIMER__ = 0;
    }
    if (window.__AGY_MODAL_OBSERVER__) {
      try { window.__AGY_MODAL_OBSERVER__.disconnect(); } catch (e) {}
      window.__AGY_MODAL_OBSERVER__ = null;
    }
    if (window.__AGY_TICK_RAF__) {
      cancelAnimationFrame(window.__AGY_TICK_RAF__);
      window.__AGY_TICK_RAF__ = 0;
    }
    if (window.__AGY_TICK_TIMER__) {
      clearTimeout(window.__AGY_TICK_TIMER__);
      window.__AGY_TICK_TIMER__ = 0;
    }
    if (window.__AGY_SHELL_RO__) {
      try { window.__AGY_SHELL_RO__.disconnect(); } catch (e) {}
      window.__AGY_SHELL_RO__ = null;
    }
    window.__AGY_HOLE_EL__ = null;
    window.__AGY_SIDE_EL__ = null;
    window.__AGY_SIDE_WRAP_EL__ = null;
    window.__AGY_SIDEBAR_EL__ = null;
    window.__AGY_TITLEBAR_EL__ = null;
    window.__AGY_TOPBAR_EL__ = null;
    window.__AGY_LAST_SIDEBAR_EL__ = null;
    window.__AGY_LAST_TITLEBAR_EL__ = null;
    window.__AGY_LAST_TOPBAR_EL__ = null;
    window.__AGY_LAST_SIDE_OPEN__ = null;
    window.__AGY_USE_BAKED_GLASS__ = false;
    if (window.__AGY_SCROLL_AC__) {
      try { window.__AGY_SCROLL_AC__.abort(); } catch (e) {}
    }
    if (window.__AGY_MODAL_AC__) {
      try { window.__AGY_MODAL_AC__.abort(); } catch (e) {}
      window.__AGY_MODAL_AC__ = null;
    }
    revokeAllAgyBlobs();
    invalidateStateCache();
    window.__AGY_METRICS_STATE__ = null;
    window.__AGY_LAST_METRICS_CSS__ = '';
    document.querySelectorAll('.agy-table-scroll-wrap').forEach((el) => el.classList.remove('agy-table-scroll-wrap'));
    document.querySelectorAll('[data-agy-tbl-wrapped]').forEach((el) => delete el.dataset.agyTblWrapped);
    document.querySelectorAll('[data-agy-has-hole]').forEach((el) => delete el.dataset.agyHasHole);
    const liveBgLayer = document.getElementById('agy-live-bg-layer');
    if (liveBgLayer) liveBgLayer.remove();
    const styleEl = document.getElementById('antigravity-custom-theme-active');
    if (styleEl) styleEl.remove();
    const metricsEl = document.getElementById('antigravity-custom-theme-metrics');
    if (metricsEl) metricsEl.remove();
    const fontStyleEl = document.getElementById('agy-greeting-font-style');
    if (fontStyleEl) fontStyleEl.remove();
    const navBtn = document.getElementById('agy-custom-theme-sidebar-btn');
    if (navBtn) navBtn.remove();
    const settingsBtn = document.getElementById('agy-custom-theme-settings-btn');
    if (settingsBtn) settingsBtn.remove();
    const modal = document.getElementById('agy-custom-theme-modal-backdrop');
    if (modal) modal.remove();
    document.querySelectorAll('[data-agy-greeting]').forEach((el) => {
      el.removeAttribute('data-agy-greeting');
      delete el.dataset.agyGreetingOrig;
    });
    const shell = findActiveShell();
    if (shell) {
      shell.classList.remove('agy-revealing');
      delete shell.dataset.agyHoleActive;
      delete shell.dataset.agySideGlass;
      ['--agy-hole-clip', '--agy-l-glass-bg', '--agy-sidebar-w', '--agy-hdr-h', '--agy-side-l', '--agy-side-t', '--agy-side-r', '--agy-side-b'].forEach((p) => {
        shell.style.removeProperty(p);
      });
    }
    if (window.electronNative && typeof window.electronNative.setTitleBarOverlay === 'function') {
      try {
        window.electronNative.setTitleBarOverlay({ color: '#111114', symbolColor: '#f8fafc' });
      } catch (e) {}
    }
  }

  window.__ANTIGRAVITY_APPLY_CUSTOM_THEME__ = applyTheme;
  window.__ANTIGRAVITY_REMOVE_CUSTOM_THEME__ = removeCustomTheme;
  window.__ANTIGRAVITY_OPEN_THEME_MODAL__ = openCustomThemeModal;

  function bootstrapEngineDom() {
    applyTheme();
    mountBootSequence(false);
  }
  if (document.body && document.head) {
    bootstrapEngineDom();
  } else {
    document.addEventListener('DOMContentLoaded', bootstrapEngineDom, { once: true });
  }

  function openCustomThemeModal() {
    loadLazyModule('studio')
      .then((fn) => { if (typeof fn === 'function') fn(window.__AGY_INTERNAL__); })
      .catch(() => {});
  }

  function injectMainSidebarButton() {
    if (document.getElementById('agy-custom-theme-sidebar-btn')) return;

    const navRoot = document.querySelector('[data-testid="sidebar-navigation-items"]');
    let customSpan = null;
    if (navRoot) {
      customSpan = Array.from(navRoot.querySelectorAll('span')).find(s => s.textContent?.trim() === 'Customizations') || null;
    }
    if (!customSpan) {
      const sidebars = document.querySelectorAll('.bg-sidebar');
      for (let i = 0; i < sidebars.length; i++) {
        const found = Array.from(sidebars[i].querySelectorAll('span')).find(s => s.textContent?.trim() === 'Customizations');
        if (found) {
          customSpan = found;
          break;
        }
      }
    }
    if (!customSpan) return;

    const row = customSpan.closest('a, button, div[role="button"], .group\\/headerbtn') || customSpan.parentElement;
    if (!row || !row.parentNode) return;

    const btn = document.createElement('button');
    btn.id = 'agy-custom-theme-sidebar-btn';
    btn.type = 'button';
    btn.className = 'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer select-none';
    btn.style.cssText = 'text-align: left;';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Custom theme</span>
    `;

    row.parentNode.insertBefore(btn, row.nextSibling);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
    });
  }

  function injectSettingsModalButton() {
    const modal = document.querySelector('.settings-modal-container');
    if (!modal || document.getElementById('agy-custom-theme-settings-btn')) return;

    const headers = Array.from(modal.querySelectorAll('h2, h3'));
    const appearanceHeader = headers.find(h => h.textContent?.trim() === 'Appearance');
    if (!appearanceHeader) return;

    let targetContainer = appearanceHeader.parentElement;
    while (targetContainer && !targetContainer.className.includes('justify-between') && targetContainer !== modal) {
      targetContainer = targetContainer.parentElement;
    }

    if (!targetContainer || !targetContainer.parentNode) return;

    Array.from(targetContainer.parentNode.children).forEach(child => {
      if (child.id === 'agy-custom-theme-settings-btn') child.remove();
    });

    const btn = document.createElement('button');
    btn.id = 'agy-custom-theme-settings-btn';
    btn.type = 'button';
    btn.className = 'select-none rounded px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer text-white';
    btn.style.cssText = 'background: linear-gradient(135deg, #e08e55 0%, #b45309 100%); border: 1px solid rgba(251, 191, 36, 0.4); box-shadow: 0 2px 10px rgba(224, 142, 85, 0.3); margin-top: 8px; margin-bottom: 8px; display: inline-flex; align-items: center; gap: 6px;';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      <span>Open Custom Theme Studio</span>
    `;

    targetContainer.parentNode.insertBefore(btn, targetContainer.nextSibling);

    btn.addEventListener('click', () => {
      window.__ANTIGRAVITY_OPEN_THEME_MODAL__();
    });
  }

  function hookSidebarScroll() {
    if (!window.__AGY_SCROLL_AC__) return;
    const scrollers = document.querySelectorAll('.agy-shell .bg-sidebar .overflow-y-auto');
    scrollers.forEach(sc => {
      if (sc.dataset.agyScrollBound) return;
      sc.dataset.agyScrollBound = '1';
      const sync = () => sc.classList.toggle('agy-scrolled', sc.scrollTop > 2);
      sync();
      sc.addEventListener('scroll', sync, { passive: true, signal: window.__AGY_SCROLL_AC__.signal });
    });
  }

  function isSidePanelVisible(sideBody) {
    if (!sideBody || sideBody.children.length === 0) return false;
    if (sideBody.closest('[data-side-panel-open="false"], [data-aux-pane-open="false"]')) return false;
    const cs = getComputedStyle(sideBody);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    return true;
  }

  function findSidePanelWrap(sideBody) {
    if (!sideBody) return null;
    const sized = sideBody.closest('[data-split-sized]');
    return (sized && sized.parentElement) || sideBody.parentElement;
  }

  function syncShellMetrics() {
    const shell = findActiveShell();
    if (!shell) return;
    const split = shell.querySelector('[data-testid="sidebar-split"]');
    const sidebarPane = split ? split.firstElementChild : null;
    const titleBar = shell.querySelector('[class*="@container/titlebar"], [data-main-content-header]');
    const topBar = shell.querySelector(':scope > div:first-of-type');
    if (window.__AGY_SHELL_RO__) {
      if (sidebarPane && window.__AGY_SIDEBAR_EL__ !== sidebarPane) {
        try { window.__AGY_SHELL_RO__.observe(sidebarPane); } catch (e) {}
        window.__AGY_SIDEBAR_EL__ = sidebarPane;
      }
      if (titleBar && window.__AGY_TITLEBAR_EL__ !== titleBar) {
        try { window.__AGY_SHELL_RO__.observe(titleBar); } catch (e) {}
        window.__AGY_TITLEBAR_EL__ = titleBar;
      }
      if (topBar && window.__AGY_TOPBAR_EL__ !== topBar) {
        try { window.__AGY_SHELL_RO__.observe(topBar); } catch (e) {}
        window.__AGY_TOPBAR_EL__ = topBar;
      }
    }
    const sw = sidebarPane ? Math.round(sidebarPane.getBoundingClientRect().width) : 0;
    const shellRect = shell.getBoundingClientRect();
    let hdrBottom = 35;
    const hdrEl = titleBar || topBar;
    if (hdrEl) {
      const hRect = hdrEl.getBoundingClientRect();
      if (hRect.height > 0) {
        hdrBottom = Math.max(0, Math.round(hRect.bottom - shellRect.top));
      } else if (topBar) {
        const tRect = topBar.getBoundingClientRect();
        if (tRect.height > 0) hdrBottom = Math.max(0, Math.round(tRect.bottom - shellRect.top));
      }
    }

    const ms = window.__AGY_METRICS_STATE__ || (window.__AGY_METRICS_STATE__ = {
      glassBg: '',
      beforeClip: '',
      holeClip: ''
    });
    const baseClip = `polygon(0 0, 100% 0, 100% ${hdrBottom}px, ${sw}px ${hdrBottom}px, ${sw}px 100%, 0 100%)`;

    const hasHoleAttr = document.body.getAttribute('data-has-browser-hole') === 'true';
    const holeEl = hasHoleAttr ? shell.querySelector('[data-browser-hole]:not([data-browser-hole="false"])') : null;
    if (holeEl) {
      if (window.__AGY_SHELL_RO__ && window.__AGY_HOLE_EL__ !== holeEl) {
        try { window.__AGY_SHELL_RO__.observe(holeEl); } catch (e) {}
        window.__AGY_HOLE_EL__ = holeEl;
      }
      const hRect = holeEl.getBoundingClientRect();
      if (hRect.width > 1 && hRect.height > 1) {
        const l = Math.max(0, Math.round(hRect.left - shellRect.left));
        const t = Math.max(0, Math.round(hRect.top - shellRect.top));
        const r = Math.max(l, Math.round(hRect.right - shellRect.left));
        const b = Math.max(t, Math.round(hRect.bottom - shellRect.top));
        ms.holeClip = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px ${t}px)`;
        ms.beforeClip = baseClip;
        shell.dataset.agyHoleActive = '1';
        flushMetricsStyle();
        return;
      }
    }
    window.__AGY_HOLE_EL__ = null;
    delete shell.dataset.agyHoleActive;
    ms.holeClip = '';

    const sideBody = shell.querySelector('[data-side-panel-body="true"]');
    const sideWrap = findSidePanelWrap(sideBody);
    if (sideBody) {
      if (sideBody.querySelector('[data-browser-hole]:not([data-browser-hole="false"])')) {
        sideBody.dataset.agyHasHole = '1';
      } else {
        delete sideBody.dataset.agyHasHole;
      }
      if (window.__AGY_SHELL_RO__ && window.__AGY_SIDE_EL__ !== sideBody) {
        try { window.__AGY_SHELL_RO__.observe(sideBody); } catch (e) {}
        window.__AGY_SIDE_EL__ = sideBody;
      }
      if (window.__AGY_SHELL_RO__ && sideWrap && window.__AGY_SIDE_WRAP_EL__ !== sideWrap) {
        try { window.__AGY_SHELL_RO__.observe(sideWrap); } catch (e) {}
        window.__AGY_SIDE_WRAP_EL__ = sideWrap;
      }
      if (window.__AGY_USE_BAKED_GLASS__ && isSidePanelVisible(sideBody)) {
        const sRect = sideBody.getBoundingClientRect();
        const wRect = sideWrap ? sideWrap.getBoundingClientRect() : sRect;
        const visLeft = Math.max(sRect.left, wRect.left);
        const visRight = Math.min(sRect.right, wRect.right);
        const visTop = Math.max(sRect.top, wRect.top);
        const visBottom = Math.min(sRect.bottom, wRect.bottom);
        if (visRight - visLeft > 24 && visBottom - visTop > 24 && visLeft < shellRect.right - 8 && visRight > shellRect.left + 8) {
          const sl = Math.max(sw, Math.round(visLeft - shellRect.left));
          const st = Math.max(hdrBottom, Math.round(visTop - shellRect.top));
          const sr = Math.min(Math.round(shellRect.width), Math.max(sl, Math.round(visRight - shellRect.left)));
          const sb = Math.min(Math.round(shellRect.height), Math.max(st, Math.round(visBottom - shellRect.top)));
          if (sr - sl > 20 && sb - st > 20) {
            ms.beforeClip = `polygon(evenodd, 0 0, 100% 0, 100% ${hdrBottom}px, ${sw}px ${hdrBottom}px, ${sw}px 100%, 0 100%, 0 0, ${sl}px ${st}px, ${sr}px ${st}px, ${sr}px ${sb}px, ${sl}px ${sb}px, ${sl}px ${st}px)`;
            flushMetricsStyle();
            return;
          }
        }
      }
    }
    ms.beforeClip = baseClip;
    flushMetricsStyle();
  }

  function syncMarkdownTableWrappers() {
    const tables = document.querySelectorAll('.agy-shell [data-testid="agent-response"] table:not([data-agy-tbl-wrapped])');
    for (let i = 0; i < tables.length; i++) {
      const tbl = tables[i];
      tbl.dataset.agyTblWrapped = '1';
      const parent = tbl.parentElement;
      if (parent && !parent.classList.contains('md-table-frame') && !parent.classList.contains('md-table-scroll')) {
        parent.classList.add('agy-table-scroll-wrap');
      }
    }
  }

  function hookShellMetrics(force = false) {
    const shell = findActiveShell();
    if (!shell) return;
    if (!shell.dataset.agyTboMounted) {
      shell.dataset.agyTboMounted = '1';
      if (shell.dataset.agySideGlass) delete shell.dataset.agySideGlass;
      ['--agy-hole-clip', '--agy-l-glass-bg', '--agy-sidebar-w', '--agy-hdr-h', '--agy-side-l', '--agy-side-t', '--agy-side-r', '--agy-side-b'].forEach((p) => {
        if (shell.style.getPropertyValue(p)) shell.style.removeProperty(p);
      });
      scheduleTitleBarSync();
    }
    const shellChanged = window.__AGY_METRICS_SHELL__ !== shell;
    if (shellChanged && window.__AGY_SHELL_RO__) {
      try { window.__AGY_SHELL_RO__.disconnect(); } catch (e) {}
      window.__AGY_SHELL_RO__ = null;
      window.__AGY_HOLE_EL__ = null;
      window.__AGY_SIDE_EL__ = null;
      window.__AGY_SIDE_WRAP_EL__ = null;
      window.__AGY_SIDEBAR_EL__ = null;
      window.__AGY_TITLEBAR_EL__ = null;
      window.__AGY_TOPBAR_EL__ = null;
    }
    window.__AGY_METRICS_SHELL__ = shell;
    const sidebarPane = shell.querySelector('[data-testid="sidebar-split"]')?.firstElementChild || null;
    const titleBar = shell.querySelector('[class*="@container/titlebar"], [data-main-content-header]');
    const topBar = shell.querySelector(':scope > div:first-of-type');
    if (!window.__AGY_SHELL_RO__ && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(syncShellMetrics);
      ro.observe(shell);
      if (sidebarPane) {
        ro.observe(sidebarPane);
        window.__AGY_SIDEBAR_EL__ = sidebarPane;
      }
      if (titleBar) {
        ro.observe(titleBar);
        window.__AGY_TITLEBAR_EL__ = titleBar;
      }
      if (topBar) {
        ro.observe(topBar);
        window.__AGY_TOPBAR_EL__ = topBar;
      }
      window.__AGY_SHELL_RO__ = ro;
    }
    const holeAttr = document.body ? (document.body.getAttribute('data-has-browser-hole') || '') : '';
    const holeAttrChanged = window.__AGY_LAST_HOLE_ATTR__ !== holeAttr;
    window.__AGY_LAST_HOLE_ATTR__ = holeAttr;
    const sidebarChanged = window.__AGY_LAST_SIDEBAR_EL__ !== sidebarPane;
    const titleBarChanged = window.__AGY_LAST_TITLEBAR_EL__ !== titleBar;
    const topBarChanged = window.__AGY_LAST_TOPBAR_EL__ !== topBar;
    window.__AGY_LAST_SIDEBAR_EL__ = sidebarPane;
    window.__AGY_LAST_TITLEBAR_EL__ = titleBar;
    window.__AGY_LAST_TOPBAR_EL__ = topBar;
    const sideBody = shell.querySelector('[data-side-panel-body="true"]');
    const sideHasChild = sideBody ? (sideBody.children.length > 0) : false;
    const sideOpen = isSidePanelVisible(sideBody);
    const sideChanged = window.__AGY_LAST_SIDE_EL__ !== sideBody || window.__AGY_LAST_SIDE_HAS_CHILD__ !== sideHasChild || window.__AGY_LAST_SIDE_OPEN__ !== sideOpen;
    window.__AGY_LAST_SIDE_EL__ = sideBody;
    window.__AGY_LAST_SIDE_HAS_CHILD__ = sideHasChild;
    window.__AGY_LAST_SIDE_OPEN__ = sideOpen;
    if (force || shellChanged || holeAttrChanged || sideChanged || sidebarChanged || titleBarChanged || topBarChanged) {
      syncShellMetrics();
    }
  }

  function pickTawaGreeting() {
    const st = getState();
    const pool = Array.isArray(st.customGreetings) ? st.customGreetings.filter(Boolean) : [];
    if (!pool.length) return '';
    const prev = window.__AGY_LAST_GREETING__;
    const choices = pool.length > 1 ? pool.filter(s => s !== prev) : pool;
    const picked = choices[Math.floor(Math.random() * choices.length)] || pool[0];
    window.__AGY_LAST_GREETING__ = picked;
    return picked;
  }

  function syncEmptyGreeting(stOverride) {
    const st = stOverride || getState();
    const hasCustom = Array.isArray(st.customGreetings) && st.customGreetings.some(Boolean);
    if (!st.tawaGreeting || (!hasCustom)) {
      if (window.__AGY_GREETING_ACTIVE__) {
        window.__AGY_GREETING_ACTIVE__ = false;
        document.querySelectorAll('[data-agy-greeting]').forEach((el) => {
          el.removeAttribute('data-agy-greeting');
          delete el.dataset.agyGreetingOrig;
        });
      }
      return;
    }
    const shell = findActiveShell();
    if (!shell) return;
    const root = shell.querySelector('[data-main-content-body="true"]') || shell;
    const hasChat = Boolean(root.querySelector('[data-testid="agent-response"], .agy-user-bubble-frame'));
    if (hasChat) {
      window.__AGY_GREETING_NEED_FRESH__ = true;
      return;
    }
    const candidates = root.querySelectorAll('h1, h2, h3, p, div, span');
    for (let i = 0; i < candidates.length; i++) {
      const el = candidates[i];
      if (el.children.length > 0) continue;
      if (el.closest('.surface-composer, [data-testid="agent-response"], .agy-user-bubble-frame, .settings-modal-container, #agy-custom-theme-modal-backdrop, .bg-sidebar, [class*="@container/titlebar"], pre, code, button, input, textarea')) {
        continue;
      }
      const txt = (el.textContent || '').trim();
      if (!txt || txt.length > 85) continue;
      if (!GREETING_RX.test(txt)) continue;
      if (!el.hasAttribute('data-agy-greeting') || window.__AGY_GREETING_NEED_FRESH__ || el.dataset.agyGreetingOrig !== txt) {
        el.dataset.agyGreetingOrig = txt;
        el.setAttribute('data-agy-greeting', pickTawaGreeting());
        window.__AGY_GREETING_NEED_FRESH__ = false;
      }
      window.__AGY_GREETING_ACTIVE__ = true;
      break;
    }
  }

  const taskVoiceState = {
    wasRunning: false,
    lastUrl: location.href,
    urlChangedAt: 0,
    userCancelledAt: 0,
    lastPlayedUrl: ''
  };

  function stopTaskAudio() {
    const audio = window.__AGY_TASK_AUDIO__;
    if (audio) {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch (e) {}
      window.__AGY_TASK_AUDIO__ = null;
    }
  }

  function playOneShotTaskAudio(rawUrl, volPercent = 85) {
    const resolved = resolveMediaUrl(rawUrl);
    if (!resolved) return;
    stopTaskAudio();
    try {
      const audio = new Audio(resolved);
      audio.volume = Math.max(0, Math.min(1, (Number.isFinite(Number(volPercent)) ? Number(volPercent) : 85) / 100));
      window.__AGY_TASK_AUDIO__ = audio;
      const cleanup = () => {
        try {
          audio.pause();
          audio.removeAttribute('src');
          audio.load();
        } catch (e) {}
        if (window.__AGY_TASK_AUDIO__ === audio) {
          window.__AGY_TASK_AUDIO__ = null;
        }
      };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      audio.play().catch(cleanup);
    } catch (e) {}
  }

  function playRandomTaskVoice(ignoreEnabled = false) {
    const st = getState();
    if (!ignoreEnabled && !st.taskVoiceEnabled) return;
    const pool = getMediaLibrary('audio');
    if (pool.length === 0) return;
    const choices = pool.length > 1
      ? pool.filter((item) => !isSameMediaUrl(item.url, taskVoiceState.lastPlayedUrl))
      : pool;
    const picked = choices[Math.floor(Math.random() * choices.length)] || pool[0];
    if (!picked || !picked.url) return;
    taskVoiceState.lastPlayedUrl = picked.url;
    playOneShotTaskAudio(picked.url, st.taskVoiceVol);
  }
  window.__ANTIGRAVITY_TEST_TASK_VOICE__ = () => playRandomTaskVoice(true);

  function syncTaskCompletionVoice() {
    if (location.href !== taskVoiceState.lastUrl) {
      taskVoiceState.lastUrl = location.href;
      taskVoiceState.urlChangedAt = Date.now();
      taskVoiceState.wasRunning = false;
      if (window.__AGY_TASK_COMPLETE_TIMER__) {
        clearTimeout(window.__AGY_TASK_COMPLETE_TIMER__);
        window.__AGY_TASK_COMPLETE_TIMER__ = null;
      }
      return;
    }
    const shell = findActiveShell();
    if (!shell) return;
    const isRunning = Boolean(shell.querySelector('[data-testid="input-cancel-button"]'));
    if (isRunning) {
      if (window.__AGY_TASK_COMPLETE_TIMER__) {
        clearTimeout(window.__AGY_TASK_COMPLETE_TIMER__);
        window.__AGY_TASK_COMPLETE_TIMER__ = null;
      }
      taskVoiceState.wasRunning = true;
      return;
    }
    if (!taskVoiceState.wasRunning || window.__AGY_TASK_COMPLETE_TIMER__) return;
    window.__AGY_TASK_COMPLETE_TIMER__ = setTimeout(() => {
      window.__AGY_TASK_COMPLETE_TIMER__ = null;
      const curShell = findActiveShell();
      if (!curShell || curShell.querySelector('[data-testid="input-cancel-button"]')) {
        return;
      }
      taskVoiceState.wasRunning = false;
      const now = Date.now();
      if (location.href !== taskVoiceState.lastUrl) return;
      if (now - taskVoiceState.urlChangedAt < 1200) return;
      if (now - taskVoiceState.userCancelledAt < 1800) return;
      if (!curShell.querySelector('[data-testid="agent-response"]')) return;
      playRandomTaskVoice(false);
    }, 450);
  }

  function tick(forceMetrics = false) {
    const activeShell = findActiveShell();
    if (activeShell) {
      const liveLayer = document.getElementById('agy-live-bg-layer');
      if (!liveLayer || liveLayer.tagName !== 'AGY-LIVE-BG' || liveLayer.parentElement !== activeShell) {
        applyTheme({}, { skipSave: true });
      }
    }
    injectMainSidebarButton();
    injectSettingsModalButton();
    hookSidebarScroll();
    hookShellMetrics(forceMetrics);
    syncMarkdownTableWrappers();
    syncEmptyGreeting();
    syncTaskCompletionVoice();
  }

  function scheduleTick(mutations) {
    const attrChanged = Array.isArray(mutations) && mutations.some((m) => m.type === 'attributes');
    if (attrChanged) {
      window.__AGY_FORCE_METRICS__ = true;
      if (window.__AGY_TICK_TIMER__) {
        clearTimeout(window.__AGY_TICK_TIMER__);
        window.__AGY_TICK_TIMER__ = 0;
      }
      if (!window.__AGY_TICK_RAF__) {
        window.__AGY_TICK_RAF__ = requestAnimationFrame(() => {
          window.__AGY_TICK_RAF__ = 0;
          const force = Boolean(window.__AGY_FORCE_METRICS__);
          window.__AGY_FORCE_METRICS__ = false;
          tick(force);
        });
      }
      return;
    }
    if (window.__AGY_TICK_RAF__ || window.__AGY_TICK_TIMER__) return;
    if (!document.getElementById('agy-custom-theme-sidebar-btn')) {
      window.__AGY_TICK_RAF__ = requestAnimationFrame(() => {
        window.__AGY_TICK_RAF__ = 0;
        tick(false);
      });
    } else {
      window.__AGY_TICK_TIMER__ = setTimeout(() => {
        window.__AGY_TICK_TIMER__ = 0;
        tick(false);
      }, 180);
    }
  }

  window.__AGY_INTERNAL__ = {
    THEMES, BOOT_ASSETS, THEME_KEYS, DEFAULT_THEME_KEY,
    STORAGE_THEME, STORAGE_BUBBLE, STORAGE_INPUT, STORAGE_DIMMING,
    STORAGE_WP_ENABLED, STORAGE_WP_MODE, STORAGE_CUSTOM_WP, STORAGE_CUSTOM_VIDEO,
    STORAGE_TASK_VOICE_ENABLED, STORAGE_TASK_VOICE_VOL, STORAGE_CUSTOM_GREETINGS,
    STORAGE_USER_AVATAR, STORAGE_AGENT_AVATAR, STORAGE_GLASS_BLUR,
    STORAGE_AVATAR_SIZE, STORAGE_AVATAR_RADIUS, STORAGE_BOOT_INTRO,
    STORAGE_SKETCH_REVEAL, STORAGE_TAWA_GREETING,
    CHECK_SVG, INPUT_STYLES,
    escapeHtml, canonicalMediaKey, isSameMediaUrl, deriveMediaName,
    getMediaLibrary, upsertSavedMedia, removeSavedMediaFromStore,
    normalizeGreetingLines, getState, resolveMediaUrl, sanitizeCssUrl,
    findActiveShell, clearRevealRaf, clearBootTimers, stopBootAudio,
    teardownBootOverlay, scheduleRevealWhenReady, applyTheme,
    syncEmptyGreeting, playOneShotTaskAudio, playRandomTaskVoice,
    mountBootSequence, triggerSketchBloomReveal
  };

  invalidateStateCache();
  clearTitleBarTimers();
  if (window.__AGY_TICK_RAF__) {
    cancelAnimationFrame(window.__AGY_TICK_RAF__);
    window.__AGY_TICK_RAF__ = 0;
  }
  if (window.__AGY_TICK_TIMER__) {
    clearTimeout(window.__AGY_TICK_TIMER__);
    window.__AGY_TICK_TIMER__ = 0;
  }
  if (window.__AGY_SHELL_RO__) {
    try { window.__AGY_SHELL_RO__.disconnect(); } catch (e) {}
    window.__AGY_SHELL_RO__ = null;
  }
  if (window.__AGY_SCROLL_AC__) {
    try { window.__AGY_SCROLL_AC__.abort(); } catch (e) {}
  }
  if (window.__AGY_MODAL_AC__) {
    try { window.__AGY_MODAL_AC__.abort(); } catch (e) {}
    window.__AGY_MODAL_AC__ = null;
  }
  if (window.__AGY_SAVE_TIMER__) {
    clearTimeout(window.__AGY_SAVE_TIMER__);
    window.__AGY_SAVE_TIMER__ = 0;
  }
  if (window.__AGY_BLUR_TIMER__) {
    clearTimeout(window.__AGY_BLUR_TIMER__);
    window.__AGY_BLUR_TIMER__ = 0;
  }
  if (window.__AGY_TASK_COMPLETE_TIMER__) {
    clearTimeout(window.__AGY_TASK_COMPLETE_TIMER__);
    window.__AGY_TASK_COMPLETE_TIMER__ = null;
  }
  window.__AGY_SCROLL_AC__ = new AbortController();
  window.addEventListener('storage', invalidateStateCache, { signal: window.__AGY_SCROLL_AC__.signal });
  document.addEventListener('click', (e) => {
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('[data-testid="input-cancel-button"]')) {
      taskVoiceState.userCancelledAt = Date.now();
    }
  }, { capture: true, signal: window.__AGY_SCROLL_AC__.signal });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && String(e.key || '').toLowerCase() === 'd') {
      taskVoiceState.userCancelledAt = Date.now();
    }
  }, { capture: true, signal: window.__AGY_SCROLL_AC__.signal });
  window.addEventListener('load', () => scheduleTitleBarSync(), { signal: window.__AGY_SCROLL_AC__.signal });
  window.addEventListener('focus', () => syncTitleBarOverlay(), { signal: window.__AGY_SCROLL_AC__.signal });
  document.addEventListener('visibilitychange', () => {
    const vid = document.getElementById('agy-live-bg-video');
    if (document.hidden) {
      if (vid && !vid.paused) {
        vid.dataset.agyPausedByHidden = '1';
        vid.pause();
      }
      return;
    }
    syncTitleBarOverlay();
    if (vid && vid.dataset.agyPausedByHidden === '1') {
      delete vid.dataset.agyPausedByHidden;
      const cur = getState();
      if (cur.wpEnabled && cur.wpMode === 'video' && vid.getAttribute('data-src')) {
        vid.play().catch(() => {});
      }
    }
  }, { signal: window.__AGY_SCROLL_AC__.signal });
  document.querySelectorAll('[data-agy-scroll-bound]').forEach(el => delete el.dataset.agyScrollBound);
  document.querySelectorAll('[data-agy-tbo-mounted]').forEach(el => delete el.dataset.agyTboMounted);
  const staleBackdrop = document.getElementById('agy-custom-theme-modal-backdrop');
  if (staleBackdrop) staleBackdrop.remove();
  const staleSidebarBtn = document.getElementById('agy-custom-theme-sidebar-btn');
  if (staleSidebarBtn) staleSidebarBtn.remove();
  const staleSettingsBtn = document.getElementById('agy-custom-theme-settings-btn');
  if (staleSettingsBtn) staleSettingsBtn.remove();

  window.__AGY_HOLE_EL__ = null;
  window.__AGY_SIDE_EL__ = null;
  window.__AGY_SIDE_WRAP_EL__ = null;
  window.__AGY_SIDEBAR_EL__ = null;
  window.__AGY_TITLEBAR_EL__ = null;
  window.__AGY_TOPBAR_EL__ = null;
  window.__AGY_LAST_SIDEBAR_EL__ = null;
  window.__AGY_LAST_TITLEBAR_EL__ = null;
  window.__AGY_LAST_TOPBAR_EL__ = null;
  window.__AGY_LAST_SIDE_OPEN__ = null;
  window.__AGY_METRICS_SHELL__ = null;
  if (window.__AGY_MODAL_OBSERVER__) {
    window.__AGY_MODAL_OBSERVER__.disconnect();
  }
  window.__AGY_MODAL_OBSERVER__ = new MutationObserver(scheduleTick);
  const observeRoot = document.body || document.documentElement;
  if (observeRoot) {
    window.__AGY_MODAL_OBSERVER__.observe(observeRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-has-browser-hole', 'data-browser-hole', 'data-side-panel-open', 'data-aux-pane-open']
    });
  }
  tick(true);

  return 'Antigravity Custom Theme Engine Ready!';
})();
