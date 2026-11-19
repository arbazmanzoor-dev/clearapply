/* ClearApply voice guide
   Speaks what each part of the page is and tells the user what to do next.
   Uses the browser's built-in speech (Web Speech API). No server needed.

   Keys:  Tab / Shift+Tab  move and hear each item
          Alt+R            repeat the instructions for this screen
          Alt+V            turn the voice guide on or off
          Alt+W            where am I? (which step, what is left)
          Esc              stop talking
   Also: a Speak button next to every field (voice typing), Read all my answers
   aloud on the review page, Slower/Faster speech, and short sound cues.

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
  var KEYS = ' Press Tab to move to the next item and Shift Tab to go back. Press Alt R to hear these instructions again, or Alt W to find out where you are.';
  var INTRO = {
    'index.html': 'ClearApply home. Job applications that talk you through every step. There is 1 open job: Junior Web Developer at BrightPath Tech. To apply, move to View job and apply and press Enter.' + KEYS,
    'index.html#jobs': 'Open jobs. There is 1 open job: Junior Web Developer at BrightPath Tech, in Bengaluru, hybrid, full-time. To apply, move to View job and apply and press Enter. 2 more jobs open next month.' + KEYS,
    'about.html': 'About this project. ClearApply is a Design Thinking prototype that redesigns an online job application for blind people who use a screen reader. This page explains the problem and links to a typical job form and a before versus after comparison.' + KEYS,
    'before.html': 'Before. This is a typical job application form, with the voice guide acting like a normal screen reader. Most buttons here have no labels, so you will only hear the word button. Try pressing Tab and notice that you cannot tell what anything does.',
    'welcome.html': 'Apply for Junior Web Developer at BrightPath Tech. This application has 5 short steps and takes about 10 minutes. Your progress is saved as you go. When you are ready, move to the Start application button and press Enter.' + KEYS,
    'step-1-contact.html': 'Step 1 of 5: Contact details. There are 3 fields: full name, email address and phone number. The email address has a mistake that needs fixing. When you are done, move to Continue to step 2 and press Enter. Every field has a Speak button next to it if you want to say your answer instead of typing.' + KEYS,
    'step-2-experience.html': 'Step 2 of 5: Work experience. There are 5 fields. The first 3 are required and the last 2 are optional. When you are done, move to Continue to step 3 and press Enter. Every field has a Speak button next to it if you want to say your answer instead of typing.' + KEYS,
    'step-3-education.html': 'Step 3 of 5: Education. There are 4 fields. The first 3 are required and certifications is optional. When you are done, move to Continue to step 4 and press Enter. Every field has a Speak button next to it if you want to say your answer instead of typing.' + KEYS,
    'step-4-resume.html': 'Step 4 of 5: Upload your resume. Your current file is Priya Sharma Resume dot P D F. To change it, move to the Upload your resume button and press Enter to choose a P D F or Word file, up to 5 megabytes. When you are done, move to Continue to step 5 and press Enter.' + KEYS,
    'step-5-review.html': 'Step 5 of 5: Review and submit. Your answers are shown in 4 sections: contact details, work experience, education and resume. Each section has its own Edit button. To hear all your answers in one go, use the Read all my answers aloud button. When everything is correct, move to Submit my application and press Enter.' + KEYS,
    'submitted.html': 'Success. Your application has been sent to BrightPath Tech. Your application number is B P 2 0 4 8 1. A confirmation has been sent to your email. Press Tab to hear what you can do next.',
    'before-vs-after.html': 'Before versus after. The left side shows what a screen reader says on a typical form: button, button, image. The right side shows what ClearApply says, where every button tells you what it does. Press Tab to move.'
  };

  function pageName(url) {
    var p = new URL(url, location.href).pathname.split('/').pop();
    return p || 'index.html';
  }
  var page = pageName(location.href);
  function intro() { return (location.hash === '#jobs' && INTRO['index.html#jobs'] && page === 'index.html') ? INTRO['index.html#jobs'] : INTRO[page]; }
  var PLAIN = false;          // true on the "before" page: acts like a plain screen reader, no hints
  var introDone = false;      // has this screen's intro been spoken?

  /* ---------- Settings (saved per browser; works without it) ---------- */
  function getOn() {
    try { var v = localStorage.getItem('clearapply-voice'); return v === null ? true : v === 'on'; }
    catch (e) { return true; }
  }
  function setOn(v) { try { localStorage.setItem('clearapply-voice', v ? 'on' : 'off'); } catch (e) {} }
  var on = getOn();

  var RATES = [0.8, 1, 1.25, 1.5, 1.75, 2], rateIx = 1;
  try { var sr = RATES.indexOf(parseFloat(localStorage.getItem('clearapply-rate'))); if (sr > -1) rateIx = sr; } catch (e) {}
  function rateName() { return RATES[rateIx] === 1 ? 'normal' : RATES[rateIx] + ' times'; }

  /* ---------- Sound cues ---------- */
  var actx = null;
  var TONES = {
    ok:     { type: 'sine',     notes: [[660, 0, 0.12], [880, 0.12, 0.18]] },   // rising: success
    error:  { type: 'triangle', notes: [[262, 0, 0.18], [196, 0.2, 0.26]] },   // falling: problem
    listen: { type: 'sine',     notes: [[988, 0, 0.12]] },                     // high blip: start speaking
    page:   { type: 'sine',     notes: [[523, 0, 0.07], [659, 0.07, 0.09]] }    // soft: new page
  };
  function chime(kind) {
    if (!on) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t0 = actx.currentTime, tone = TONES[kind];
      tone.notes.forEach(function (n) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = tone.type; o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, t0 + n[1]);
        g.gain.exponentialRampToValueAtTime(0.2, t0 + n[1] + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + n[1] + n[2]);
        o.connect(g); g.connect(actx.destination);
        o.start(t0 + n[1]); o.stop(t0 + n[1] + n[2] + 0.03);
      });
    } catch (e) {}
  }

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
      u.rate = RATES[rateIx];
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
      if (h === 'index.html') return 'Press Enter to go to the home page.';
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
    if (!introDone) { introDone = true; first.push(intro()); }
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
    say(intro());
  }
  document.addEventListener('keydown', firstAction, true);
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && (e.target.closest('#vg-widget') || e.target.closest('a[href]'))) return;
    firstAction(e);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.altKey && (e.code === 'KeyR' || e.key === 'r' || e.key === 'R')) { e.preventDefault(); introDone = true; say(intro()); }
    else if (e.altKey && (e.code === 'KeyV' || e.key === 'v' || e.key === 'V')) { e.preventDefault(); toggle(); }
    else if (e.altKey && (e.code === 'KeyW' || e.key === 'w' || e.key === 'W')) { e.preventDefault(); introDone = true; whereAmI(); }
    else if (e.key === 'Escape') { if (synth) { synth.cancel(); live = []; } if (rec) { try { rec.abort(); } catch (x) {} } }
  });

  // Email check on step 1: tell her when the mistake is fixed, or what is still wrong.
  function checkEmail(el) {
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    var box = el.closest('div.flex.flex-col');
    var err = document.getElementById('email-error');
    if (err) err.style.display = ok ? 'none' : '';
    if (box) {
      box.classList.toggle('vg-ok', ok);
      box.querySelectorAll('span').forEach(function (sp) {
        if (/Error: Incomplete/.test(sp.textContent) || sp.textContent.trim() === 'warning') sp.style.display = ok ? 'none' : '';
      });
    }
    chime(ok ? 'ok' : 'error');
    return ok ? 'Email address looks correct.' : 'Error: Please enter an email address, like name at example dot com.';
  }
  document.addEventListener('focusout', function (e) {
    var el = e.target;
    if (PLAIN || !el || el.type !== 'email' || el.value === focusValue) return;
    pending = checkEmail(el);
    setTimeout(function () { if (pending) { say(pending); pending = null; } }, 60);
  });

  /* ---------- Where am I? ---------- */
  var STEP_NO = { 'welcome.html': 0, 'step-1-contact.html': 1, 'step-2-experience.html': 2, 'step-3-education.html': 3,
                  'step-4-resume.html': 4, 'step-5-review.html': 5, 'submitted.html': 6 };
  var STEP_NAMES = ['contact details', 'work experience', 'education', 'upload resume', 'review and submit'];
  function whereAmI() {
    var n = STEP_NO[page], t;
    if (n === undefined) {
      t = { 'index.html': 'You are on the ClearApply home page.', 'about.html': 'You are on the About this project page.',
            'before.html': 'You are on the typical job form, part of About this project.',
            'before-vs-after.html': 'You are on the Before versus after page, part of About this project.' }[page] || 'You are on ClearApply.';
    } else if (n === 0) {
      t = 'You are on the job page for Junior Web Developer at BrightPath Tech. You have not started the application yet. It has 5 steps.';
    } else if (n === 6) {
      t = 'Your application has been sent. All 5 steps are done.';
    } else {
      t = 'You are on step ' + n + ' of 5: ' + STEP_NAMES[n - 1] + '.';
      if (n > 1) t += ' Done: ' + STEP_NAMES.slice(0, n - 1).join(', ') + '.';
      t += n < 5 ? ' Still to do: ' + STEP_NAMES.slice(n).join(', ') + '.' : ' This is the last step.';
    }
    var a = document.activeElement;
    if (a && a !== document.body && a.tagName !== 'MAIN' && !(a.closest && a.closest('#vg-widget'))) {
      t += ' You are on: ' + clean([nameOf(a), roleOf(a)].join(', ')) + '.';
    }
    say(t);
  }

  /* ---------- Voice typing ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var rec = null;
  function spokenToValue(t, el) {
    t = clean(t);
    if (el.type === 'email') {
      t = t.toLowerCase().replace(/\s+at the rate( of)?\s+/g, '@').replace(/\s+at\s+/g, '@')
           .replace(/\s*\bdot\b\s*/g, '.').replace(/\s*\bunderscore\b\s*/g, '_').replace(/\s*\b(dash|hyphen)\b\s*/g, '-')
           .replace(/\s+/g, '');
    } else if (el.type === 'tel') {
      t = t.replace(/\bplus\b/gi, '+').replace(/[^\d+ ]/g, '').replace(/\s+/g, ' ').replace(/\+\s+/g, '+').trim();
    } else if (el.type === 'number') {
      t = t.replace(/[^\d]/g, '');
    } else if (el.type === 'url') {
      t = t.toLowerCase().replace(/\s*\bdot\b\s*/g, '.').replace(/\s*\bslash\b\s*/g, '/').replace(/\s*\bcolon\b\s*/g, ':').replace(/\s+/g, '');
    } else if (t) {
      t = t.charAt(0).toUpperCase() + t.slice(1);
    }
    return t;
  }
  function fieldLabel(el) { return clean(nameOf(el).replace(/\((required|optional)\)/ig, '')); }
  function listen(el, btn) {
    if (!SR) return;
    if (rec) { try { rec.abort(); } catch (e) {} rec = null; }
    if (synth) { synth.cancel(); live = []; }
    var label = btn.querySelector('.vg-mic-text');
    btn.setAttribute('aria-pressed', 'true'); label.textContent = 'Listening…';
    showCaption('Listening for ' + fieldLabel(el) + '…');
    chime('listen');
    var got = false;
    setTimeout(function () {
      try {
        rec = new SR();
        rec.lang = 'en-IN'; rec.interimResults = false; rec.maxAlternatives = 1;
        rec.onresult = function (e) {
          got = true;
          var heard = e.results[0][0].transcript, v = spokenToValue(heard, el);
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          var msg = fieldLabel(el) + ' is now: ' + v + '.';
          if (el.type === 'email') { msg += ' ' + checkEmail(el); }
          else chime('ok');
          say(msg + ' If this is wrong, press Speak again. Press Tab to move on.');
        };
        rec.onerror = function (e) {
          got = true;
          chime('error');
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') say('The microphone is blocked. Allow microphone access for this site in your browser settings, then press Speak again.');
          else if (e.error === 'no-speech') say('I did not hear anything. Press Speak and say your answer after the tone.');
          else if (e.error === 'network') say('Voice typing needs an internet connection. Please type your answer instead.');
          else if (e.error !== 'aborted') say('Voice typing did not work this time. Press Speak to try again, or type your answer.');
        };
        rec.onend = function () {
          btn.setAttribute('aria-pressed', 'false'); label.textContent = 'Speak';
          if (!got) { chime('error'); say('I did not hear anything. Press Speak and say your answer after the tone.'); }
          rec = null;
        };
        rec.start();
      } catch (err) {
        btn.setAttribute('aria-pressed', 'false'); label.textContent = 'Speak';
        say('Voice typing is not available in this browser. Please type your answer.');
      }
    }, 250);
  }
  function addMics() {
    if (PLAIN || !SR) return;
    var main = document.querySelector('main'); if (!main) return;
    main.querySelectorAll('input:not([type]),input[type=text],input[type=email],input[type=tel],input[type=url],input[type=number],textarea').forEach(function (el) {
      if (el.__vgMic || el.closest('.sr-only') || el.readOnly) return;
      el.__vgMic = true;
      var target = el.parentElement && el.parentElement.classList.contains('relative') ? el.parentElement : el;
      var row = document.createElement('div');
      row.className = 'vg-mic-row' + (el.tagName === 'TEXTAREA' ? ' vg-top' : '');
      target.parentNode.insertBefore(row, target);
      row.appendChild(target);
      target.classList.add('vg-grow');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'vg-mic'; b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Speak your answer for ' + fieldLabel(el));
      b.innerHTML = '<span aria-hidden="true" class="material-symbols-outlined">mic</span><span class="vg-mic-text">Speak</span>';
      b.addEventListener('click', function () { listen(el, b); });
      row.appendChild(b);
    });
  }

  /* ---------- Read all my answers aloud (review page) ---------- */
  function answersText() {
    var out = [];
    document.querySelectorAll('main article').forEach(function (art) {
      var h = art.querySelector('h2'); if (!h) return;
      var part = [visibleText(h) + '.'];
      art.querySelectorAll('dl > div').forEach(function (row) {
        var dt = row.querySelector('dt'), dd = row.querySelector('dd');
        if (dt && dd) part.push(visibleText(dt).replace(/:$/, '') + ': ' + visibleText(dd) + '.');
      });
      if (!art.querySelector('dl')) {
        var f = Array.prototype.find.call(art.querySelectorAll('span'), function (x) { return !x.querySelector('span') && /\.(pdf|docx?)\b/i.test(x.textContent); });
        if (f) part.push('File: ' + clean(f.textContent).replace(/_/g, ' ') + '.');
      }
      out.push(part.join(' '));
    });
    return out.length ? 'Here are your answers. ' + out.join(' ') + ' That is everything. If something is wrong, use the Edit button for that section. If it is all correct, press Submit my application.' : '';
  }
  function addReadAnswers() {
    if (page !== 'step-5-review.html' || document.getElementById('vg-read')) return;
    var h1 = document.querySelector('main h1'); if (!h1) return;
    var anchor = h1.closest('header') || h1.parentElement;
    var wrap = document.createElement('div'); wrap.className = 'vg-read-wrap';
    wrap.innerHTML = '<button id="vg-read" type="button" class="vg-read"><span aria-hidden="true" class="material-symbols-outlined">volume_up</span><span>Read all my answers aloud</span></button>';
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    wrap.querySelector('button').addEventListener('click', function () {
      var t = answersText();
      if (!on) { on = true; setOn(true); render(); }
      chime('page'); say(t);
    });
  }

  /* ---------- On-screen control and caption ---------- */
  var css = 'body{padding-bottom:76px!important}' +
    '#vg-widget{position:fixed;left:0;right:0;bottom:0;z-index:40;display:flex;align-items:center;gap:12px;padding:8px 170px 8px 16px;background:#071c36;color:#ecf1ff;font-family:"Atkinson Hyperlegible Next",system-ui,sans-serif;box-shadow:0 -2px 10px rgba(0,0,0,.2)}' +
    '#vg-btn{flex:none;display:inline-flex;align-items:center;min-height:44px;padding:8px 14px;border-radius:8px;border:2px solid #ecf1ff;background:transparent;color:#ecf1ff;font-weight:700;font-size:15px;cursor:pointer}' +
    '#vg-btn[aria-pressed="true"]{background:#1a4fd6;border-color:#1a4fd6;color:#fff}' +
    '#vg-btn:focus-visible{outline:3px solid #fec300;outline-offset:2px}' +
    '#vg-cap{min-width:0;flex:1;font:500 13px/1.4 "JetBrains Mono",ui-monospace,monospace;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
    '#vg-cap b{color:#fec300;margin-right:6px}' +
    '#vg-cap[hidden]{display:none}' +
    '#vg-speed{flex:none;display:inline-flex;align-items:center;gap:6px}#vg-speed[hidden]{display:none}' +
    '#vg-speed button{min-height:44px;padding:6px 12px;border-radius:8px;border:2px solid #ecf1ff;background:transparent;color:#ecf1ff;font-weight:700;font-size:14px;cursor:pointer}' +
    '#vg-speed button:focus-visible{outline:3px solid #fec300;outline-offset:2px}#vg-rate{min-width:3ch;text-align:center;font:700 14px "JetBrains Mono",monospace}' +
    '.vg-mic-row{display:flex;gap:8px;align-items:stretch}.vg-mic-row.vg-top{align-items:flex-start}.vg-grow{flex:1;min-width:0}' +
    '.vg-mic{flex:none;display:inline-flex;align-items:center;gap:6px;min-height:52px;padding:0 14px;border-radius:8px;border:2px solid #071c36;background:#fff;color:#071c36;font-weight:700;font-size:16px;cursor:pointer}' +
    '.vg-mic:hover{background:#e7eeff}.vg-mic:focus-visible{outline:3px solid #fec300;outline-offset:2px}.vg-mic[aria-pressed="true"]{background:#ba1a1a;border-color:#ba1a1a;color:#fff}' +
    '.vg-read-wrap{margin:0 0 24px}.vg-read{display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:0 20px;border-radius:8px;border:2px solid #071c36;background:#fff;color:#071c36;font-weight:700;font-size:17px;cursor:pointer}' +
    '.vg-read:hover{background:#e7eeff}.vg-read:focus-visible{outline:3px solid #fec300;outline-offset:2px}' +
    '@media (max-width:640px){#vg-widget{padding-right:16px;flex-wrap:wrap}#vg-cap{flex-basis:100%}body{padding-bottom:130px!important}.vg-mic .vg-mic-text{display:none}}' +
    '.vg-skip{position:absolute;left:16px;top:-80px;z-index:70;padding:10px 16px;border-radius:8px;background:#fec300;color:#071c36;font-weight:700;text-decoration:none}.vg-skip:focus{top:12px;outline:3px solid #071c36}main:focus{outline:none}' +
    '.vg-ok{border-color:#0d6832!important;background:#eaf7ee!important}.vg-ok label{color:#071c36!important}.vg-ok input[type=email]{border-color:#0d6832!important;background:#fff!important}';
  var st = document.createElement('style'); st.id = 'vg-style'; st.textContent = css; document.head.appendChild(st);

  var w = document.createElement('div'); w.id = 'vg-widget';
  w.innerHTML = '<button id="vg-btn" type="button" aria-pressed="false"></button>' +
    '<div id="vg-speed" role="group" aria-label="Speech speed"><button type="button" id="vg-slower" aria-label="Speak slower">Slower</button>' +
    '<span id="vg-rate" aria-hidden="true"></span><button type="button" id="vg-faster" aria-label="Speak faster">Faster</button></div>' +
    '<div id="vg-cap" aria-hidden="true" hidden><b>SAYING:</b><span></span></div>';
  var btn = w.querySelector('#vg-btn'), cap = w.querySelector('#vg-cap'), capText = cap.querySelector('span');
  var speedBox = w.querySelector('#vg-speed'), rateEl = w.querySelector('#vg-rate');
  function setRate(d) {
    rateIx = Math.max(0, Math.min(RATES.length - 1, rateIx + d));
    try { localStorage.setItem('clearapply-rate', RATES[rateIx]); } catch (e) {}
    render();
    say('Speed ' + rateName() + '. This is how fast I will speak.');
  }
  w.querySelector('#vg-slower').addEventListener('click', function () { setRate(-1); });
  w.querySelector('#vg-faster').addEventListener('click', function () { setRate(1); });

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
    speedBox.hidden = !on;
    rateEl.textContent = RATES[rateIx] + '×';
    syncWelcomeSwitch();
  }
  function toggle() {
    if (on) { say('Voice guide off.'); }
    on = !on; setOn(on);
    render();
    if (on) { introDone = true; say('Voice guide on. ' + intro()); }
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

  /* ---------- Buttons that act like a real site ---------- */
  var SIZES = [1, 1.15, 1.3, 1.5], sizeIx = 0;
  try { sizeIx = Math.max(0, SIZES.indexOf(parseFloat(localStorage.getItem('clearapply-size')))); } catch (e) {}
  function applySize() {
    var m = document.querySelector('main'); if (m) m.style.zoom = SIZES[sizeIx] === 1 ? '' : SIZES[sizeIx];
    try { localStorage.setItem('clearapply-size', SIZES[sizeIx]); } catch (e) {}
  }
  var HELP = 'Keyboard help. Press Tab to move to the next item and Shift Tab to go back. Press Enter to press a button or open a link. Press Space to turn a switch on or off. Press Alt R to hear the instructions for this page again, Alt W to find out where you are, Alt V to turn the voice guide on or off, and Escape to stop it talking. Next to each field there is a Speak button: press it, wait for the tone, and say your answer. Use the Slower and Faster buttons at the bottom of the screen to change how fast I speak.';
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (!b) return;
    var n = (b.getAttribute('aria-label') || visibleText(b)).toLowerCase();
    if (/increase font size/.test(n)) { sizeIx = Math.min(SIZES.length - 1, sizeIx + 1); applySize(); say('Text size ' + Math.round(SIZES[sizeIx] * 100) + ' percent.'); }
    else if (/decrease font size/.test(n)) { sizeIx = Math.max(0, sizeIx - 1); applySize(); say('Text size ' + Math.round(SIZES[sizeIx] * 100) + ' percent.'); }
    else if (/^help/.test(n)) { say(HELP); }
    else if (/save (progress|draft)|save & continue|save application progress/.test(n)) { chime('ok'); say('Your progress is saved. You can come back and finish later.'); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target;
    if (el && el.type === 'file' && el.files && el.files[0]) {
      chime('ok');
      say('Resume uploaded: ' + el.files[0].name + '. Press Tab to move to the next item.', { queue: true });
    }
  });

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
    addMics();
    addReadAnswers();
    applySize();
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
        shownPath = new URL(url, location.href).pathname;
        page = pageName(url);
        window.scrollTo(0, 0);
        runScripts(document.body);
        try { document.dispatchEvent(new Event('DOMContentLoaded')); } catch (e) {}
        setupScreen();
        var hash = new URL(url, location.href).hash;
        if (hash && document.querySelector(hash)) document.querySelector(hash).scrollIntoView();
        introDone = true;
        chime(page === 'submitted.html' ? 'ok' : 'page');
        say(intro());   // the click or key press that opened this screen still counts, so this is allowed
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
  window.addEventListener('hashchange', function () { if (location.hash === '#jobs') { introDone = true; say(intro()); } });
  var shownPath = location.pathname;
  window.addEventListener('popstate', function () {
    if (location.pathname === shownPath) return;   // only the #part changed: same screen, nothing to load
    goTo(location.href, false);
  });
  if (history.replaceState) history.replaceState({ vg: true }, '', location.href);

  setupScreen();
})();
