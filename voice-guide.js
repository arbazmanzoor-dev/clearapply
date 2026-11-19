/* ClearApply voice guide
   Speaks what each part of the page is and tells the user what to do next.
   Uses the browser's built-in speech (Web Speech API). No server needed.

   Keys:  Tab / Shift+Tab  move and hear each item
          Alt+R            repeat the instructions for this screen
          Alt+V            turn the voice guide on or off
          Esc              stop talking

   Browsers only let a page speak after the user presses a key or clicks on it.
   A normal link loads a brand-new page and that permission is lost, so the
   guide loads the next ClearApply screen inside the same page instead. The
   new screen is then announced straight away.
*/
(function () {
  'use strict';
  if (window.__clearApplyVoice) return;
  window.__clearApplyVoice = true;

  var synth = window.speechSynthesis;

  /* ---------- What to say when each screen opens ---------- */
  var KEYS = ' Press Tab to move to the next item and Shift Tab to go back. Press Alt R to hear these instructions again.';
  var INTRO = {
    'index.html': 'ClearApply prototype. This start page lists 9 screens in order. Press Tab to move through the list, and press Enter to open a screen. Start with screen 1, the typical job form.',
    'before.html': 'Before. This is a typical job application form, with the voice guide acting like a normal screen reader. Most buttons here have no labels, so you will only hear the word button. Try pressing Tab and notice that you cannot tell what anything does.',
    'welcome.html': 'Apply for Junior Web Developer at BrightPath Tech. This application has 5 short steps and takes about 10 minutes. Your progress is saved as you go. When you are ready, move to the Start application button and press Enter.' + KEYS,
    'step-1-contact.html': 'Step 1 of 5: Contact details. There are 3 fields: full name, email address and phone number. The email address has a mistake that needs fixing. When you are done, move to Continue to step 2 and press Enter.' + KEYS,
    'step-2-experience.html': 'Step 2 of 5: Work experience. There are 5 fields. The first 3 are required and the last 2 are optional. When you are done, move to Continue to step 3 and press Enter.' + KEYS,
    'step-3-education.html': 'Step 3 of 5: Education. There are 4 fields. The first 3 are required and certifications is optional. When you are done, move to Continue to step 4 and press Enter.' + KEYS,
    'step-4-resume.html': 'Step 4 of 5: Upload your resume. Your current file is Priya Sharma Resume dot P D F. To change it, move to the Upload your resume button and press Enter to choose a P D F or Word file, up to 5 megabytes. When you are done, move to Continue to step 5 and press Enter.' + KEYS,
    'step-5-review.html': 'Step 5 of 5: Review and submit. Your answers are shown in 4 sections: contact details, work experience, education and resume. Each section has its own Edit button. When everything is correct, move to Submit my application and press Enter.' + KEYS,
    'submitted.html': 'Success. Your application has been sent to BrightPath Tech. Your application number is B P 2 0 4 8 1. A confirmation has been sent to your email. Press Tab to hear what you can do next.',
    'before-vs-after.html': 'Before versus after. The left side shows what a screen reader says on a typical form: button, button, image. The right side shows what ClearApply says, where every button tells you what it does. Press Tab to move.'
  };

  function pageName(url) {
    var p = new URL(url, location.href).pathname.split('/').pop();
    return p || 'index.html';
  }
  var page = pageName(location.href);
  var PLAIN = false;          // true on the "before" page: acts like a plain screen reader, no hints
  var introDone = false;      // has this screen's intro been spoken?

  /* ---------- Settings (saved per browser; works without it) ---------- */
  function getOn() {
    try { var v = localStorage.getItem('clearapply-voice'); return v === null ? true : v === 'on'; }
    catch (e) { return true; }
  }
  function setOn(v) { try { localStorage.setItem('clearapply-voice', v ? 'on' : 'off'); } catch (e) {} }
  var on = getOn();

  /* ---------- Speaking ---------- */
  var voice = null;
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices();
    function find(re, localOnly) {
      return vs.find(function (v) { return re.test(v.lang) && (!localOnly || v.localService); });
    }
    // Voices installed on the device are preferred: Chrome's online voices can cut long sentences short.
    voice = find(/en[-_]IN/i, true) || find(/^en[-_](GB|US)/i, true) || find(/^en/i, true) ||
            find(/en[-_]IN/i) || find(/^en/i) || null;
  }
  if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }

  var live = [];  // keep utterances referenced so Chrome does not drop them mid-speech
  function chunks(text) {
    // Short pieces avoid a Chrome bug that stops long utterances after about 15 seconds.
    var parts = text.match(/[^.!?]+[.!?]*\s*/g) || [text], out = [], cur = '';
    parts.forEach(function (p) {
      if ((cur + p).length > 180 && cur) { out.push(cur); cur = p; } else { cur += p; }
    });
    if (cur.trim()) out.push(cur);
    return out;
  }
  function say(text, opts) {
    opts = opts || {};
    if (!text) return;
    showCaption(text, opts.queue);
    if (!on || !synth) return;
    if (!opts.queue) { synth.cancel(); live = []; }
    chunks(text.replace(/_/g, ' underscore ')).forEach(function (t) {
      var u = new SpeechSynthesisUtterance(t);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'en-IN';
      u.rate = 1;
      u.onend = u.onerror = function () { var i = live.indexOf(u); if (i > -1) live.splice(i, 1); };
      live.push(u);
      synth.speak(u);
    });
    if (synth.paused) synth.resume();
  }

  /* ---------- Working out what an element is ---------- */
  function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }
  function visibleText(el) {
    var c = el.cloneNode(true);
    c.querySelectorAll('.material-symbols-outlined,[aria-hidden="true"],script,style').forEach(function (n) { n.remove(); });
    var out = [], walk = document.createTreeWalker(c, NodeFilter.SHOW_TEXT);
    while (walk.nextNode()) out.push(walk.currentNode.nodeValue);
    return clean(out.join(' '));
  }
  function byIds(ids) {
    return clean((ids || '').split(/\s+/).map(function (id) {
      var n = id && document.getElementById(id); return n ? visibleText(n) : '';
    }).join('. '));
  }
  function nameOf(el) {
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    if (el.getAttribute('aria-labelledby')) return byIds(el.getAttribute('aria-labelledby'));
    if (el.id) {
      var l = document.querySelector('label[for="' + el.id + '"]');
      if (l) return visibleText(l);
    }
    var wrap = el.closest('label'); if (wrap) return visibleText(wrap);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return clean(el.getAttribute('placeholder'));
    return visibleText(el) || clean(el.getAttribute('title'));
  }
  function roleOf(el) {
    var r = el.getAttribute('role');
    if (r === 'switch') return 'switch';
    if (r === 'button' || el.tagName === 'BUTTON') return 'button';
    if (el.tagName === 'A') return 'link';
    if (el.tagName === 'TEXTAREA') return 'edit text, multi-line';
    if (el.tagName === 'SELECT') return 'combo box';
    if (el.tagName === 'INPUT') {
      var t = (el.type || 'text').toLowerCase();
      if (t === 'checkbox') return 'check box';
      if (t === 'radio') return 'radio button';
      if (t === 'number') return 'spin button';
      if (t === 'file') return 'button';
      return 'edit text';
    }
    return '';
  }
  function hintFor(el, role) {
    if (role === 'switch') return 'Press Space to turn it ' + (el.getAttribute('aria-checked') === 'true' ? 'off.' : 'on.');
    if (role === 'button') return 'Press Enter to activate it.';
    if (role === 'link') {
      var h = el.getAttribute('href') || '';
      if (/^skip/i.test(nameOf(el))) return 'Press Enter to jump past the menu.';
      if (h === 'index.html') return 'Press Enter to go to the list of all screens.';
      if (h && h.charAt(0) !== '#') return 'Press Enter to open it.';
      return 'Press Enter to activate it.';
    }
    if (/edit text|spin button/.test(role)) {
      if (el.type === 'number') return 'Type a number.';
      if (el.type === 'email') return 'Type your email address.';
      if (el.type === 'tel') return 'Type your phone number.';
      if (el.type === 'url') return 'Type the web address.';
      if (el.tagName === 'TEXTAREA') return 'Type your answer. You can write more than one line.';
      return 'Type your answer.';
    }
    return '';
  }
  function describe(el) {
    if (el.tagName === 'MAIN') return 'Main content. Press Tab to move to the first item.';
    var role = roleOf(el);
    var name = nameOf(el);
    if (PLAIN) return clean([name, role].join(', ').replace(/^, /, '')) || role;
    var parts = [];
    if (name) parts.push(name);
    if (role) parts.push(role);
    var req = el.required || el.getAttribute('aria-required') === 'true';
    if (/edit text|spin button/.test(role) && req && !/required/i.test(name)) parts.push('required');
    if (el.getAttribute('aria-invalid') === 'true') parts.push('invalid');
    if (role === 'switch') parts.push(el.getAttribute('aria-checked') === 'true' ? 'on' : 'off');
    if (/^(INPUT|TEXTAREA)$/.test(el.tagName) && el.type !== 'file') {
      parts.push(el.value ? 'current value, ' + el.value : 'blank');
    }
    var desc = byIds(el.getAttribute('aria-describedby'));
    var text = parts.join(', ') + '.';
    if (desc && desc !== name) text += ' ' + desc.replace(/([^.])$/, '$1.');
    var hint = hintFor(el, role);
    if (hint) text += ' ' + hint;
    return text;
  }

  /* ---------- Focus, keys and the email check ---------- */
  var pending = null, focusValue = null, skipJump = false;
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || el === document.body) return;
    if (el.tagName === 'MAIN' && !skipJump) return;
    skipJump = false;
    focusValue = el.value;
    var first = [];
    if (!introDone) { introDone = true; first.push(INTRO[page]); }
    if (pending) { first.push(pending); pending = null; }
    if (first.length) {
      say(first[0]);
      for (var i = 1; i < first.length; i++) say(first[i], { queue: true });
      say(describe(el), { queue: true });
      return;
    }
    say(describe(el));
  });

  function firstAction(e) {
    if (introDone) return;
    if (e.type === 'keydown' && (/^(Alt|Shift|Control|Meta|Tab)$/.test(e.key) || e.altKey)) return;
    introDone = true;
    say(INTRO[page]);
  }
  document.addEventListener('keydown', firstAction, true);
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && (e.target.closest('#vg-widget') || e.target.closest('a[href]'))) return;
    firstAction(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.altKey && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) { e.preventDefault(); introDone = true; say(INTRO[page]); }
    else if (e.altKey && (e.code === 'KeyV' || e.key === 'v' || e.key === 'V')) { e.preventDefault(); toggle(); }
    else if (e.key === 'Escape' && synth) { synth.cancel(); live = []; }
  });

  // Email check on step 1: tell her when the mistake is fixed, or what is still wrong.
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (PLAIN || !el || el.type !== 'email' || el.value === focusValue) return;
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    var box = el.closest('div.flex.flex-col');
    var err = document.getElementById('email-error');
    if (err) err.style.display = ok ? 'none' : '';
    if (box) {
      box.classList.toggle('vg-ok', ok);
      box.querySelectorAll('span').forEach(function (sp) {
        if (/Error: Incomplete/.test(sp.textContent) || sp.textContent.trim() === 'warning') sp.style.display = ok ? 'none' : '';
        if (/aria-invalid=/.test(sp.textContent)) sp.textContent = ok ? 'aria-invalid="false" • the error message is removed' : 'aria-invalid="true" • aria-describedby="email-error"';
      });
    }
    pending = ok ? 'Email address looks correct.' : 'Error: Please enter an email address, like name at example dot com.';
    setTimeout(function () { if (pending) { say(pending); pending = null; } }, 60);
  });

  /* ---------- On-screen control and caption ---------- */
  var css = 'body{padding-bottom:76px!important}' +
    '#vg-widget{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;gap:12px;padding:8px 170px 8px 16px;background:#071c36;color:#ecf1ff;font-family:"Atkinson Hyperlegible Next",system-ui,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.2)}' +
    '#vg-btn{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border-radius:8px;border:2px solid #ecf1ff;background:transparent;color:#ecf1ff;font-weight:700;font-size:15px;cursor:pointer}' +
    '#vg-btn[aria-pressed="true"]{background:#1a4fd6;border-color:#1a4fd6;color:#fff}' +
    '#vg-btn:focus-visible{outline:3px solid #fec300;outline-offset:2px}' +
    '#vg-cap{min-width:0;flex:1;font:500 13px/1.4 "JetBrains Mono",ui-monospace,monospace;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '#vg-cap b{color:#fec300;margin-right:6px}' +
    '#vg-cap[hidden]{display:none}' +
    '@media (max-width:640px){#vg-widget{padding-right:16px;flex-wrap:wrap}#vg-cap{flex-basis:100%}body{padding-bottom:120px!important}}' +
    '.vg-skip{position:absolute;left:16px;top:-80px;z-index:70;padding:10px 16px;border-radius:8px;background:#fec300;color:#071c36;font-weight:700;text-decoration:none}.vg-skip:focus{top:12px;outline:3px solid #071c36}main:focus{outline:none}' +
    '.vg-ok{border-color:#0d6832!important;background:#eaf7ee!important}.vg-ok label{color:#071c36!important}.vg-ok input[type=email]{border-color:#0d6832!important;background:#fff!important}';
  var st = document.createElement('style'); st.id = 'vg-style'; st.textContent = css; document.head.appendChild(st);

  var w = document.createElement('div'); w.id = 'vg-widget';
  w.innerHTML = '<button id="vg-btn" type="button" aria-pressed="false"></button>' +
    '<div id="vg-cap" aria-hidden="true" hidden><b>SAYING:</b><span></span></div>';
  var btn = w.querySelector('#vg-btn'), cap = w.querySelector('#vg-cap'), capText = cap.querySelector('span');

  function showCaption(t, add) {
    if (!on) return;
    capText.textContent = add && capText.textContent ? capText.textContent + ' ' + t : t;
    cap.hidden = false;
  }
  function render() {
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Voice guide: On (Alt+V)' : 'Voice guide: Off (Alt+V)';
    btn.setAttribute('aria-label', on ? 'Voice guide, on. Press to turn it off.' : 'Voice guide, off. Press to turn it on.');
    if (!on) cap.hidden = true;
    syncWelcomeSwitch();
  }
  function toggle() {
    if (on) { say('Voice guide off.'); }
    on = !on; setOn(on);
    render();
    if (on) { introDone = true; say('Voice guide on. ' + INTRO[page]); }
  }
  btn.addEventListener('click', toggle);

  function syncWelcomeSwitch() {
    var sw = document.getElementById('audio-toggle-btn');
    if (!sw) return;
    sw.setAttribute('aria-checked', on ? 'true' : 'false');
    var spans = sw.querySelectorAll('span');
    if (spans.length) spans[spans.length - 1].textContent = on ? 'Audio Guide: ON' : 'Audio Guide: OFF';
    var state = sw.parentElement && sw.parentElement.querySelector('span.inline-block');
    if (state) state.textContent = on ? 'State: ON • Voice guide reads each step aloud' : 'State: OFF';
  }

  /* ---------- Per-screen setup (runs on first load and after every screen change) ---------- */
  function setupScreen() {
    PLAIN = page === 'before.html';
    introDone = false;
    pending = null;
    document.body.appendChild(w);

    // The welcome page's "Audio guide" switch controls the same setting.
    var sw = document.getElementById('audio-toggle-btn');
    if (sw && !sw.__vg) { sw.__vg = true; sw.addEventListener('click', function () { toggle(); }); }

    // "Skip to main content" link, so keyboard users do not Tab through the menu on every screen.
    var hasSkip = Array.prototype.some.call(document.querySelectorAll('a'), function (a) { return /^skip/i.test(clean(a.textContent)); });
    var main = document.querySelector('main');
    if (!PLAIN && !hasSkip && main) {
      if (!main.id) main.id = 'main-content';
      main.setAttribute('tabindex', '-1');
      var sk = document.createElement('a');
      sk.href = '#' + main.id; sk.className = 'vg-skip'; sk.textContent = 'Skip to main content';
      sk.addEventListener('click', function () { skipJump = true; });
      document.body.insertBefore(sk, document.body.firstChild);
    }
    render();
    if (!synth) { btn.textContent = 'Voice guide not supported in this browser'; btn.disabled = true; }
  }

  /* ---------- Changing screens without losing the permission to speak ---------- */
  function isScreenLink(a) {
    if (!a || !a.getAttribute('href')) return false;
    var href = a.getAttribute('href');
    if (/^(#|mailto:|tel:|javascript:)/i.test(href) || a.target === '_blank' || a.hasAttribute('download')) return false;
    var u = new URL(href, location.href);
    if (u.origin !== location.origin) return false;
    var here = location.pathname.replace(/[^/]*$/, ''), there = u.pathname.replace(/[^/]*$/, '');
    return here === there && Object.prototype.hasOwnProperty.call(INTRO, pageName(u.href));
  }

  function runScripts(root) {
    root.querySelectorAll('script').forEach(function (old) {
      if (old.src) { old.remove(); return; }  // shared scripts (this file, Tailwind) are already loaded
      var s = document.createElement('script');
      s.textContent = old.textContent;
      old.replaceWith(s);
    });
  }

  var loading = false;
  function goTo(url, push) {
    if (loading) return;
    loading = true;
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        if (!doc.body) throw new Error('no body');
        // add any stylesheet the next screen needs that this one has not loaded
        doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
          if (!document.head.querySelector('link[href="' + l.getAttribute('href') + '"]')) document.head.appendChild(l.cloneNode(true));
        });
        document.title = doc.title;
        document.body.className = doc.body.className;
        document.body.innerHTML = doc.body.innerHTML;
        if (push) history.pushState({ vg: true }, '', url);
        page = pageName(url);
        window.scrollTo(0, 0);
        runScripts(document.body);
        try { document.dispatchEvent(new Event('DOMContentLoaded')); } catch (e) {}
        setupScreen();
        var hash = new URL(url, location.href).hash;
        if (hash && document.querySelector(hash)) document.querySelector(hash).scrollIntoView();
        introDone = true;
        say(INTRO[page]);   // the click or key press that opened this screen still counts, so this is allowed
        loading = false;
      })
      .catch(function () { loading = false; location.href = url; });  // e.g. opened from a file: fall back to a normal page load
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!isScreenLink(a)) return;
    e.preventDefault();
    if (synth) { synth.cancel(); live = []; }
    goTo(a.href, true);
  });
  window.addEventListener('popstate', function () { goTo(location.href, false); });
  if (history.replaceState) history.replaceState({ vg: true }, '', location.href);

  setupScreen();
})();
