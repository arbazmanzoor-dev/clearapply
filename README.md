# ClearApply

A job application website built for blind people who use a screen reader.

**Live site:** https://arbazmanzoor-dev.github.io/clearapply/

## The problem

A blind woman who depends on a screen reader for daily tasks like job applications, banking and shopping cannot complete an online job application. Its buttons and icons have no text labels or alt text, so her screen reader only says "button" or "image" and cannot tell her what each one does.

This happens because the design team assumed that a visually clear interface is automatically accessible, without checking what a non-visual user actually hears.

## What ClearApply does differently

- **Every button has a name.** You hear "Upload your resume, button", never just "button".
- **Every form field** has a visible label, says whether it is required or optional, and gives a hint.
- **Errors tell you the fix**, for example "Please enter an email address, like name@example.com". When you correct it, the site tells you it looks right.
- **Edit buttons name their section** ("Edit contact details", not just "Edit").
- **A voice guide on every page** reads the page aloud and tells you what to do next.
- **A "Skip to main content" link** means you don't have to Tab through the menu on every page.
- **Text size buttons (A- / A+)** make the page bigger or smaller.
- **Voice typing:** a Speak button next to every field. Say your answer and it is typed in and read back. Spoken emails like "priya dot sharma at gmail dot com" become priya.sharma@gmail.com.
- **Read all my answers aloud** on the review page, so you can check everything before submitting.
- **Where am I? (Alt+W)** tells you which step you are on, what is done and what is left.
- **Speech speed:** Slower and Faster buttons, from 0.8× up to 2×.
- **Sound cues:** a rising tone for success, a low tone for errors, and a short tone when listening starts or a new page opens.

## Pages

- **Home:** open jobs and how ClearApply helps
- **Job page:** Junior Web Developer at BrightPath Tech, with the audio guide setting
- **Application:** 5 steps (contact details, work experience, education, upload resume, review and submit)
- **Confirmation:** application sent, with a reference number
- **About this project:** the problem statement, a typical inaccessible job form, and a Before vs After comparison

## How to try it

1. Open the live site and press **Tab** once to start the voice guide.
2. Choose **View job and apply** and complete the application using only the keyboard: **Tab** to move, **Enter** to press.
3. Voice guide keys: **Alt+R** repeats the instructions, **Alt+W** tells you where you are, **Alt+V** turns it on or off, **Esc** stops it.
4. Press **Speak** next to a field, wait for the tone and say your answer. This works in Chrome, Edge and Safari; the browser asks for microphone permission the first time.
5. To compare, open **About this project → A typical job form** and hear how a screen reader only says "button".
6. To test with a real screen reader, turn the voice guide off and use VoiceOver (Mac/iPhone), TalkBack (Android) or NVDA (Windows, free).

Browsers only allow a page to speak after you press a key or click, so the voice guide starts on your first Tab. After that, it speaks each page as it opens.

## Built with

HTML, Tailwind CSS and JavaScript, designed with Google Stitch. The voice guide and voice typing use the browser's built-in Web Speech API, and the sound cues use the Web Audio API, so no server is needed.

## About

Prototype for the Design Thinking course (Experiment 2: Human-Centred Design Process), Faculty of Engineering and Technology, JAIN (Deemed-to-be University), Bengaluru.

Team: 6

The applicant, jobs and companies on the site are made up for the demo.
