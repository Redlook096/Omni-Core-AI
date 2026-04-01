// Preview runtime for Vibe Coder iframe sandbox
// This file is imported as a raw string and injected into the iframe's srcdoc.

function addPreviewOverlay(message) {
  // UI now lives in the parent (Vibe Coder sidebar). Avoid fullscreen overlays
  // inside the iframe because they look harsh and hide the actual preview area.
  try {
    var el = document.getElementById('__preview_error_overlay');
    if (el) el.style.display = 'none';
  } catch (_) {
    /* ignore */
  }
}

var __lastForwardMsg = '';
var __lastForwardAt = 0;
function forwardPreviewError(msg) {
  var text = String(msg || '');
  if (!text) return;
  var now = Date.now();
  if (text === __lastForwardMsg && now - __lastForwardAt < 900) return;
  __lastForwardMsg = text;
  __lastForwardAt = now;
  try {
    window.parent.postMessage({ type: 'preview_error', error: text }, '*');
  } catch (_) {}
}
// ES module scripts cannot see function declarations; expose for mount script.
window.forwardPreviewError = forwardPreviewError;

window.addEventListener('error', function (event) {
  var msg = event.message || (event.error && event.error.message) || 'Unknown Error';
  addPreviewOverlay('Preview runtime error:\n' + msg);
  forwardPreviewError(msg);
});
window.addEventListener('unhandledrejection', function (event) {
  var msg = (event.reason && event.reason.message) || event.reason || 'Unhandled Promise Rejection';
  addPreviewOverlay('Preview runtime error:\n' + msg);
  forwardPreviewError(msg);
});

// Prevent generated preview apps from navigating the iframe to host routes
// (e.g. <a href="/pricing">) which can load the Lyra app inside preview.
(function guardPreviewNavigation() {
  function isBypass(el) {
    return !!(el && (el.hasAttribute('data-vibe-allow-navigation') || el.getAttribute('target') === '_blank'));
  }

  document.addEventListener(
    'click',
    function (event) {
      if (event.defaultPrevented) return;
      var raw = event.target;
      if (!(raw instanceof Element)) return;
      var link = raw.closest('a[href]');
      if (!link) return;
      if (isBypass(link)) return;

      var href = (link.getAttribute('href') || '').trim();
      if (!href) return;
      if (
        href.indexOf('#') === 0 ||
        href.indexOf('javascript:') === 0 ||
        href.indexOf('mailto:') === 0 ||
        href.indexOf('tel:') === 0
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  document.addEventListener(
    'submit',
    function (event) {
      var form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (isBypass(form)) return;
      // Keep preview isolated; prevent document-level navigations.
      event.preventDefault();
    },
    true
  );
})();

// Only forward genuine console.error calls that look like real runtime failures.
// CDN warnings, React DevTools, and informational logs are NOT forwarded.
(function captureConsole() {
  var originalError = console.error;
  console.error = function () {
    var text = Array.from(arguments).join(' ');
    var isNoise =
      text.indexOf('cdn.tailwindcss.com') !== -1 ||
      text.indexOf('React DevTools') !== -1 ||
      text.indexOf('Download the React DevTools') !== -1 ||
      text.indexOf('should not be used in production') !== -1 ||
      text.indexOf('sandbox') !== -1 ||
      text.indexOf('postMessage') !== -1 ||
      text.indexOf('%c') === 0;
    if (!isNoise) {
      forwardPreviewError(text);
    }
    originalError.apply(console, arguments);
  };
})();

(function setupElementPicker() {
  var pickerActive = false;
  var currentHighlighted = null;
  var previousOutline = '';

  // Lightweight tooltip that follows the cursor while picking elements
  var tooltip = document.createElement('div');
  tooltip.id = '__vibe_picker_tooltip';
  tooltip.style.cssText = [
    'position:fixed',
    'z-index:99998',
    'pointer-events:none',
    'padding:4px 8px',
    'border-radius:6px',
    'background:rgba(0,0,0,0.8)',
    'color:#e5e5e5',
    'font-size:11px',
    "font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
    'max-width:260px',
    'white-space:nowrap',
    'text-overflow:ellipsis',
    'overflow:hidden',
    'opacity:0',
    'transform:translate3d(0,0,0)',
    'transition:opacity 120ms ease-out'
  ].join(';');
  document.body.appendChild(tooltip);

  function hideTooltip() {
    tooltip.style.opacity = '0';
  }

  function showTooltip(text, x, y) {
    tooltip.textContent = text;
    tooltip.style.left = (x + 12) + 'px';
    tooltip.style.top = (y + 12) + 'px';
    tooltip.style.opacity = '1';
  }

  function clearHighlight() {
    if (!currentHighlighted) return;
    currentHighlighted.style.outline = previousOutline;
    currentHighlighted = null;
    previousOutline = '';
  }

  function getDescriptor(el) {
    var tag = (el.tagName || '').toLowerCase();
    var id = el.id ? '#' + el.id : '';
    var classList = Array.from(el.classList || [])
      .slice(0, 2)
      .map(function (cls) { return '.' + cls; })
      .join('');
    var text = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    return [tag + id + classList, text ? '- "' + text + '"' : ''].filter(Boolean).join(' ');
  }

  function getDomPath(el) {
    var segments = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== document.body && node !== document.documentElement) {
      var seg = (node.tagName || '').toLowerCase();
      if (node.id) {
        seg += '#' + node.id;
      }
      if (node.classList && node.classList.length) {
        var cls = Array.prototype.slice.call(node.classList)
          .slice(0, 3)
          .join('.');
        if (cls) seg += '.' + cls;
      }
      segments.unshift(seg);
      node = node.parentElement;
    }
    return segments.join(' > ');
  }

  function ensureElementId(el) {
    var existing = el.getAttribute('data-vibe-element-id');
    if (existing) return existing;
    var id = 'vibe-el-' + Math.random().toString(36).slice(2, 10);
    el.setAttribute('data-vibe-element-id', id);
    return id;
  }

  function applyElementStyle(elementId, stylePatch) {
    if (!elementId || !stylePatch) return;
    var target = document.querySelector('[data-vibe-element-id="' + elementId + '"]');
    if (!(target instanceof HTMLElement)) return;
    var keys = ['color','backgroundColor','borderRadius','fontSize','padding','border','boxShadow','opacity','fontWeight','textAlign'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (typeof stylePatch[k] === 'string' && stylePatch[k]) target.style[k] = stylePatch[k];
    }
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'toggle_element_picker') return;
    pickerActive = Boolean(event.data.active);
    document.body.style.cursor = pickerActive ? 'crosshair' : '';
    if (!pickerActive) {
      clearHighlight();
      hideTooltip();
    }
  });

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'apply_element_style') return;
    applyElementStyle(event.data.elementId, event.data.stylePatch || {});
  });

  /** Walk from SVG/text nodes to a host we can tag (skip #document/body; include SVG roots). */
  function resolvePickTarget(start) {
    if (!(start instanceof Element)) return null;
    var el = start;
    if (el.id === '__preview_error_overlay' || el.closest('#__preview_error_overlay')) return null;
    while (el && el !== document.documentElement) {
      if (el instanceof HTMLElement && el !== document.body && el !== document.documentElement) {
        return el;
      }
      if (typeof SVGSVGElement !== 'undefined' && el instanceof SVGSVGElement) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  document.addEventListener(
    'mousemove',
    function (event) {
      if (!pickerActive) return;
      var target = resolvePickTarget(event.target);
      if (!target) return;
      if (target.id === '__preview_error_overlay' || target.closest('#__preview_error_overlay')) return;
      if (target === currentHighlighted) {
        // Still update tooltip position
        showTooltip(getDescriptor(target), event.clientX, event.clientY);
        return;
      }
      clearHighlight();
      currentHighlighted = target;
      previousOutline = target.style.outline || '';
      target.style.outline = '2px solid rgba(59,130,246,0.9)';
      showTooltip(getDescriptor(target), event.clientX, event.clientY);
    },
    true
  );

  document.addEventListener(
    'click',
    function (event) {
      if (!pickerActive) return;
      var raw = event.target;
      if (!(raw instanceof Element)) return;
      if (raw.id === '__preview_error_overlay' || raw.closest('#__preview_error_overlay')) return;
      var target = resolvePickTarget(raw);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      var descriptor = getDescriptor(target);
      var domPath = getDomPath(target);
      var elementId = ensureElementId(target);
      var rect = target.getBoundingClientRect();
      var htmlSnippet = (target.outerHTML || '').trim().slice(0, 260);
      window.parent.postMessage({
        type: 'preview_element_selected',
        elementId: elementId,
        descriptor: descriptor,
        domPath: domPath,
        bounds: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        },
        html: htmlSnippet
      }, '*');
    },
    true
  );
})();

// --- Virtual File System ---
var filesNode = document.getElementById('__vibe_files');
var files = filesNode ? JSON.parse(filesNode.textContent || '{}') : {};

(async function run() {
  try {
    if (typeof Babel === 'undefined') {
      await new Promise(function (resolve) { setTimeout(resolve, 2000); });
      if (typeof Babel === 'undefined') {
        forwardPreviewError('Preview failed: Babel compiler failed to load. Check your network connection.');
        return;
      }
    }

    function normalizePath(value) {
      return value.replace(/\\/g, '/').replace(/^\.\//, '');
    }
    function toFileNoExt(name) {
      return normalizePath(name).replace(/\.(js|jsx|ts|tsx)$/, '');
    }

    var jsFiles = Object.keys(files).filter(function (name) {
      return /\.(js|jsx|ts|tsx)$/.test(name);
    });

    var entryCandidates = [
      'main.tsx', 'main.jsx', 'main.ts', 'main.js',
      'index.tsx', 'index.jsx', 'index.ts', 'index.js',
      'app.tsx', 'app.jsx', 'app.ts', 'app.js',
      'src/main.tsx', 'src/main.jsx', 'src/main.ts', 'src/main.js',
      'src/index.tsx', 'src/index.jsx', 'src/index.ts', 'src/index.js',
      'src/app.tsx', 'src/app.jsx', 'src/app.ts', 'src/app.js'
    ];

    var normalizedByFile = {};
    jsFiles.forEach(function (file) {
      normalizedByFile[file] = normalizePath(file);
    });

    var entryFile = null;
    for (var i = 0; i < entryCandidates.length; i++) {
      var candidate = entryCandidates[i];
      for (var j = 0; j < jsFiles.length; j++) {
        if (normalizedByFile[jsFiles[j]].toLowerCase().endsWith(candidate)) {
          entryFile = jsFiles[j];
          break;
        }
      }
      if (entryFile) break;
    }
    if (!entryFile) entryFile = jsFiles[0] || null;

    if (!entryFile) {
      var rootFallback = document.getElementById('root') || document.getElementById('app');
      if (!rootFallback) {
        addPreviewOverlay('Preview failed:\nNo JS/TS entry file found.');
      }
      return;
    }

    // Transform with Babel
    var transformedFiles = {};
    var fileNames = Object.keys(files);
    for (var fi = 0; fi < fileNames.length; fi++) {
      var name = fileNames[fi];
      var code = files[name];

      if (name.endsWith('.css')) {
        var style = document.createElement('style');
        style.textContent = code;
        document.head.appendChild(style);
        continue;
      }

      if (/\.(js|jsx|ts|tsx)$/.test(name)) {
        try {
          var result = Babel.transform(code, {
            presets: [
              ['env', { targets: { esmodules: true }, modules: false }],
              ['react', { runtime: 'automatic' }],
              'typescript'
            ],
            filename: name,
            sourceType: 'module'
          });
          transformedFiles[name] = result.code || '';
        } catch (babelErr) {
          addPreviewOverlay('Babel Error in ' + name + ':\n' + (babelErr.message || babelErr));
          forwardPreviewError('Babel Error in ' + name + ': ' + (babelErr.message || babelErr));
          return;
        }
      }
    }

    // Read the importmap so we can rewrite bare specifiers inside blob modules
    var importMapNode = document.querySelector('script[type="importmap"]');
    var importMapImports = {};
    try {
      if (importMapNode) {
        importMapImports = JSON.parse(importMapNode.textContent || '{}').imports || {};
      }
    } catch (_) {}

    var fileLookup = {};
    var tfNames = Object.keys(transformedFiles);
    for (var li = 0; li < tfNames.length; li++) {
      var fk = tfNames[li];
      fileLookup[normalizePath(fk)] = fk;
      fileLookup[toFileNoExt(fk)] = fk;
    }

    function resolveRelativeImport(fromFile, specifier) {
      var from = normalizePath(fromFile).split('/');
      from.pop();
      var segments = specifier.split('/');
      for (var si = 0; si < segments.length; si++) {
        var seg = segments[si];
        if (!seg || seg === '.') continue;
        if (seg === '..') from.pop();
        else from.push(seg);
      }
      var resolved = normalizePath(from.join('/'));
      function tryLookup(path) {
        var p = normalizePath(path);
        return (
          fileLookup[p] ||
          fileLookup[p + '.ts'] ||
          fileLookup[p + '.tsx'] ||
          fileLookup[p + '.js'] ||
          fileLookup[p + '.jsx'] ||
          fileLookup[p + '/index.ts'] ||
          fileLookup[p + '/index.tsx'] ||
          fileLookup[p + '/index.js'] ||
          fileLookup[p + '/index.jsx'] ||
          null
        );
      }
      var hit = tryLookup(resolved);
      if (hit) return hit;
      // Extensionless import e.g. ./components/Keypad — try basename match
      var base = resolved.split('/').pop();
      if (base) {
        for (var fi = 0; fi < tfNames.length; fi++) {
          var fn = normalizePath(tfNames[fi]);
          if (fn === resolved || fn.endsWith('/' + resolved) || fn.endsWith('/' + base)) {
            return tfNames[fi];
          }
          if (fn.split('/').pop() === base || toFileNoExt(fn) === toFileNoExt(base)) {
            return tfNames[fi];
          }
        }
      }
      return null;
    }

    function resolveImportUrl(fromFile, specifier) {
      if (specifier.startsWith('http://') || specifier.startsWith('https://') || specifier.startsWith('blob:')) {
        return specifier;
      }
      if (specifier.startsWith('.')) {
        return null;
      }
      if (importMapImports[specifier]) {
        return importMapImports[specifier];
      }
      var keys = Object.keys(importMapImports);
      for (var k = 0; k < keys.length; k++) {
        if (keys[k].endsWith('/') && specifier.startsWith(keys[k])) {
          return importMapImports[keys[k]] + specifier.slice(keys[k].length);
        }
      }
      return 'https://esm.sh/' + specifier + '?deps=react@18,react-dom@18';
    }

    // Use placeholder tokens for local file references, then replace with final blob URLs.
    // Keep token slash-based so it is always a valid module specifier while rewriting.
    var PLACEHOLDER_TOKEN = '__VIBE_LOCAL_FILE__';
    var PLACEHOLDER_PREFIX = PLACEHOLDER_TOKEN + '/';

    function rewriteSpecifier(fromFile, specifier) {
      if (specifier.indexOf(PLACEHOLDER_TOKEN) === 0) {
        var rawLocal = specifier
          .replace(PLACEHOLDER_TOKEN + ':', '')
          .replace(PLACEHOLDER_TOKEN + '/', '');
        return PLACEHOLDER_PREFIX + normalizePath(rawLocal);
      }
      if (specifier.startsWith('.') && specifier.endsWith('.css')) return null;
      if (specifier.startsWith('.')) {
        var localTarget = resolveRelativeImport(fromFile, specifier);
        if (localTarget) return PLACEHOLDER_PREFIX + localTarget;
        return null;
      }
      return resolveImportUrl(fromFile, specifier);
    }

    var rewrittenFiles = {};
    for (var ri = 0; ri < tfNames.length; ri++) {
      var rName = tfNames[ri];
      var rewritten = transformedFiles[rName];

      rewritten = rewritten.replace(/from\s*['"]([^'"]+)['"]/g, function (full, specifier) {
        var url = rewriteSpecifier(rName, specifier);
        if (!url) return full;
        return full.replace(specifier, url);
      });

      rewritten = rewritten.replace(/import\s*['"]([^'"]+)['"]\s*;?/g, function (full, specifier) {
        if (typeof specifier !== 'string') return full;
        if (specifier.startsWith('.') && specifier.endsWith('.css')) return '';
        var url = rewriteSpecifier(rName, specifier);
        if (!url) return full;
        return "import '" + url + "';";
      });

      rewritten = rewritten.replace(/import\(\s*['"]([^'"]+)['"]\s*\)/g, function (full, specifier) {
        var url = rewriteSpecifier(rName, specifier);
        if (!url) return full;
        return "import('" + url + "')";
      });

      rewritten = rewritten.replace(/export\s+\{[^}]*\}\s+from\s*['"]([^'"]+)['"]/g, function (full, specifier) {
        var url = rewriteSpecifier(rName, specifier);
        if (!url) return full;
        return full.replace(specifier, url);
      });

      rewritten = rewritten.replace(/export\s+\*\s+from\s*['"]([^'"]+)['"]/g, function (full, specifier) {
        var url = rewriteSpecifier(rName, specifier);
        if (!url) return full;
        return full.replace(specifier, url);
      });

      rewrittenFiles[rName] = rewritten;
    }

    // Create initial blob URLs, then iteratively rewire local references.
    // Multiple passes ensure nested module chains no longer point to placeholder modules.
    var rwNames = Object.keys(rewrittenFiles);
    var blobUrls = {};
    for (var rbi = 0; rbi < rwNames.length; rbi++) {
      var rwName = rwNames[rbi];
      blobUrls[rwName] = URL.createObjectURL(new Blob([rewrittenFiles[rwName]], { type: 'application/javascript' }));
    }

    function normalizeKey(value) {
      return normalizePath(String(value || '')).replace(/^\.\//, '');
    }

    var placeholderRegex = new RegExp(PLACEHOLDER_TOKEN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[:/]([^"\'\\s]+)', 'g');
    var finalFiles = {};

    function buildBlobLookup(currentBlobUrls) {
      var lookup = {};
      for (var li = 0; li < rwNames.length; li++) {
        var k = rwNames[li];
        var nk = normalizeKey(k);
        lookup[k] = currentBlobUrls[k];
        lookup[nk] = currentBlobUrls[k];
        lookup[toFileNoExt(k)] = currentBlobUrls[k];
        lookup[toFileNoExt(nk)] = currentBlobUrls[k];
        var base = nk.split('/').pop();
        if (base) {
          lookup[base] = currentBlobUrls[k];
          lookup[toFileNoExt(base)] = currentBlobUrls[k];
        }
      }
      return lookup;
    }

    for (var pass = 0; pass < 8; pass++) {
      var blobUrlLookup = buildBlobLookup(blobUrls);
      finalFiles = {};
      for (var pi = 0; pi < rwNames.length; pi++) {
        var pName = rwNames[pi];
        var code = rewrittenFiles[pName];
        code = code.replace(placeholderRegex, function (_match, fileName) {
          var norm = normalizeKey(String(fileName || '').replace(/^\.\//, ''));
          var base = norm.split('/').pop();

          var resolved =
            blobUrlLookup[fileName] ||
            blobUrlLookup[norm] ||
            (base ? blobUrlLookup[base] : null) ||
            blobUrlLookup[toFileNoExt(norm)];

          if (!resolved && base) {
            for (var fb = 0; fb < rwNames.length; fb++) {
              var candidate = normalizeKey(rwNames[fb]);
              if (candidate === norm || candidate.endsWith('/' + base) || candidate.endsWith(base)) {
                resolved = blobUrls[rwNames[fb]];
                break;
              }
            }
          }
          return resolved || _match;
        });
        finalFiles[pName] = code;
      }

      var nextBlobUrls = {};
      for (var ni = 0; ni < rwNames.length; ni++) {
        var nextName = rwNames[ni];
        nextBlobUrls[nextName] = URL.createObjectURL(new Blob([finalFiles[nextName]], { type: 'application/javascript' }));
      }
      blobUrls = nextBlobUrls;
    }

    var entryUrl = blobUrls[entryFile];
    if (!entryUrl) {
      throw new Error('Unable to resolve preview entry file. entryFile=' + entryFile);
    }

    // Mount the app via a self-contained module script (all URLs are absolute)
    var reactUrl = importMapImports['react'] || 'https://esm.sh/react@18';
    var reactDomClientUrl = importMapImports['react-dom/client'] || 'https://esm.sh/react-dom@18/client';

    var mountScript = document.createElement('script');
    mountScript.type = 'module';
    mountScript.textContent = [
      "import React from '" + reactUrl + "';",
      "import { createRoot } from '" + reactDomClientUrl + "';",
      "function __isReactType(t) {",
      "  return typeof t === 'function' || (t && typeof t === 'object' && typeof t.$$typeof === 'symbol');",
      "}",
      "function __tryCreate(React, t) {",
      "  if (t == null) return null;",
      "  if (React.isValidElement(t)) return t;",
      "  if (__isReactType(t)) return React.createElement(t);",
      "  return null;",
      "}",
      "function __resolveRoot(React, mod) {",
      "  if (!mod) return null;",
      "  var candidates = [];",
      "  try { candidates.push(mod.default); } catch (_) {}",
      "  // Scan module namespace values (covers named exports with arbitrary names)",
      "  try {",
      "    for (var k in mod) {",
      "      if (k === '__esModule') continue;",
      "      candidates.push(mod[k]);",
      "    }",
      "  } catch (_) {}",
      "  // If default export is an object (e.g. { App: ... }), scan its properties too",
      "  try {",
      "    if (mod.default && typeof mod.default === 'object') {",
      "      for (var dk in mod.default) {",
      "        if (dk === '__esModule') continue;",
      "        candidates.push(mod.default[dk]);",
      "      }",
      "    }",
      "  } catch (_) {}",
      "  var seen = new Set();",
      "  for (var i = 0; i < candidates.length; i++) {",
      "    var t = candidates[i];",
      "    if (!t) continue;",
      "    try {",
      "      if (seen.has(t)) continue;",
      "      seen.add(t);",
      "    } catch (_) { /* ignore */ }",
      "    var el = __tryCreate(React, t);",
      "    if (el) return el;",
      "  }",
      "  return null;",
      "}",
      "async function __vibeMount() {",
      "  try {",
      "    var EntryModule = await import('" + entryUrl + "');",
      "    var rootElement = document.getElementById('root') || document.getElementById('app');",
      "    if (!rootElement) {",
      "      rootElement = document.createElement('div');",
      "      rootElement.id = 'root';",
      "      document.body.appendChild(rootElement);",
      "    }",
      "    if (typeof EntryModule.render === 'function') {",
      "      EntryModule.render(rootElement);",
      "    } else {",
      "      var renderValue = __resolveRoot(React, EntryModule);",
      "      if (!renderValue) {",
      "        var msg = 'Preview: no usable root export. Use export default function App(), export default <App />, or export function render(root).';",
      "        // If the entry module mounted itself via side-effects, consider preview ready even without an export.",
      "        if (rootElement && rootElement.childNodes && rootElement.childNodes.length > 0) {",
      "          window.parent.postMessage({ type: 'preview_ready' }, '*');",
      "          return;",
      "        }",
      "        if (typeof window.forwardPreviewError === 'function') window.forwardPreviewError(msg);",
      "        else window.parent.postMessage({ type: 'preview_error', error: msg }, '*');",
      "        return;",
      "      }",
      "      createRoot(rootElement).render(renderValue);",
      "    }",
      "    window.parent.postMessage({ type: 'preview_ready' }, '*');",
      "  } catch (error) {",
      "    var msg = (error && error.message) ? error.message : String(error);",
      "    if (typeof window.forwardPreviewError === 'function') window.forwardPreviewError(msg);",
      "    else window.parent.postMessage({ type: 'preview_error', error: msg }, '*');",
      "    throw error;",
      "  }",
      "}",
      "__vibeMount();"
    ].join('\n');
    document.body.appendChild(mountScript);
  } catch (err) {
    console.error('Preview Error:', err);
    addPreviewOverlay('Preview failed:\n' + ((err && err.message) ? err.message : String(err)));
    forwardPreviewError((err && err.message) ? err.message : String(err));
  }
})();
