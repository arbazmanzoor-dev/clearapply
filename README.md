# ClearApply

An accessible online job application for blind people who use a screen reader.

**Live prototype:** https://arbazmanzoor-dev.github.io/clearapply/

## The problem

A blind woman who depends on a screen reader for daily tasks like job applications, banking and shopping cannot complete an online job application. Its buttons and icons have no text labels or alt text, so her screen reader only says "button" or "image" and can't tell her what each one does.

This happens because the design team assumed that a visually clear interface is automatically accessible, without checking what a non-visual user actually hears.

## What ClearApply changes

- Every button has a text label, for example "Upload your resume (PDF or Word, up to 5 MB)" instead of an icon alone.
- Every form field has a visible label, says whether it is required or optional, and gives a hint.
- Error messages are read out with the exact fix, for example "Please enter an email address, like name@example.com".
- Edit buttons name their section ("Edit contact details", not just "Edit").
- The confirmation and reference number are announced automatically.

Each screen has a panel called **"What the screen reader says"** that shows what a blind user would hear on that screen.

## Screens

1. Before: a typical job form (the problem)
2. Welcome
3. Step 1: Contact details
4. Step 2: Work experience
5. Step 3: Education
6. Step 4: Upload resume
7. Step 5: Review and submit
8. Application submitted
9. Before vs After

## How to try it

- Open the live link and start with screen 1.
- Use only the keyboard: Tab to move, Enter to press.
- For the real experience, turn on a screen reader: VoiceOver (Mac/iPhone), TalkBack (Android) or NVDA (Windows, free).

## About

Prototype for the Design Thinking course (Experiment 2: Human-Centred Design Process), Faculty of Engineering and Technology, JAIN (Deemed-to-be University), Bengaluru.

Team No: 6

Built with Google Stitch, HTML and Tailwind CSS. The applicant, job and company in the prototype are made up for the demo.
