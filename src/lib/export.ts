import type { TrainingForm } from "../types";

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function exportCsvRows(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [headers.map(escapeCsv).join(","), ...rows.map((row) => row.map(escapeCsv).join(","))];
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildSignedFormHtml(form: TrainingForm, includeTraineeComments: boolean) {
  const traineeComments = form.supervisorOnlyFeedback ?? [];
  const submitted = form.submittedData;
  const objectives = submitted?.objectives ?? [];
  const trainees = submitted?.trainees ?? [];
  const roster = submitted?.traineeRoster ?? [];
  const formats = submitted?.trainingFormats ?? [];
  const statementLabels = [
    "The training objectives were clear.",
    "The content was relevant to my role.",
    "The trainer was knowledgeable and organised.",
    "The pace and duration of training were appropriate.",
    "Practical exercises / workplace examples were useful.",
    "The training will help me perform my job more effectively."
  ];
  const computedStatementAverages = (() => {
    const totals = Array(statementLabels.length).fill(0);
    const counts = Array(statementLabels.length).fill(0);
    traineeComments.forEach((comment) => {
      comment.statementRatings?.forEach((rating, index) => {
        if (typeof rating === "number" && index < statementLabels.length) {
          totals[index] += rating;
          counts[index] += 1;
        }
      });
    });
    return totals.map((total, index) => (counts[index] > 0 ? Number((total / counts[index]).toFixed(2)) : 0));
  })();
  const statementAverages =
    submitted?.perStatementAverages?.length === statementLabels.length
      ? submitted.perStatementAverages
      : computedStatementAverages;

  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const txt = (v?: string) => (v && v.trim().length > 0 ? esc(v) : "-");
  const imageTag = (src?: string, alt?: string) =>
    src && src.trim().length > 0
      ? `<img src="${esc(src)}" alt="${esc(alt || "Signature")}" style="max-height:48px; max-width:180px; object-fit:contain; border:1px solid #e2e8f0; border-radius:6px; padding:2px; background:#fff;" />`
      : "<span>-</span>";
  const listOrDash = (items: string[]) =>
    items.length > 0 ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p class='muted'>-</p>";
  const optionGroup = (selected: string | undefined, options: string[]) =>
    `<div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:6px;">
      ${options
        .map((option) => {
          const active = (selected ?? "").trim().toLowerCase() === option.trim().toLowerCase();
          return `<span style="border:1px solid ${active ? "#7f1d1d" : "#cbd5e1"}; background:${active ? "#fef2f2" : "#fff"}; color:${active ? "#7f1d1d" : "#334155"}; border-radius:999px; padding:4px 10px; font-size:10px; font-weight:${active ? "700" : "500"};">${active ? "Selected: " : ""}${esc(option)}</span>`;
        })
        .join("")}
    </div>`;

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Signed Form - ${form.id}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Calibri", "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      font-size: 11px;
      line-height: 1.3;
      position: relative;
      background: #fff;
    }
    .watermark {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark img {
      width: 420px;
      max-width: 70vw;
      height: auto;
      opacity: 0.06;
      filter: grayscale(100%);
      transform: rotate(-18deg);
      object-fit: contain;
    }
    .content {
      position: relative;
      z-index: 1;
    }
    .header {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 8px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .logo-wrap {
      display: inline-block;
      border: 1px solid #dbe3ee;
      border-radius: 8px;
      padding: 8px 12px;
      background: #fff;
      margin-bottom: 8px;
    }
    .logo {
      max-width: 360px;
      width: 100%;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .subhead {
      margin: 4px 0 0;
      font-size: 10px;
      color: #64748b;
    }
    .title {
      margin: 4px 0 2px;
      font-size: 16px;
      font-weight: 700;
    }
    .meta {
      color: #475569;
      font-size: 10px;
      margin-top: 4px;
    }
    .section {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px;
      margin-bottom: 8px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .section h2 {
      margin: 0 0 6px;
      font-size: 12px;
      letter-spacing: 0.02em;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px 10px;
    }
    .cell b { display: block; font-size: 10px; color: #475569; font-weight: 600; margin-bottom: 1px; }
    .cell span { font-size: 11px; }
    .wide { grid-column: 1 / -1; }
    .muted { color: #64748b; margin: 0; }
    ul { margin: 4px 0 0 16px; padding: 0; }
    li { margin: 1px 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 10.5px;
    }
    th, td {
      border: 1px solid #dbe3ee;
      padding: 4px 5px;
      text-align: left;
      vertical-align: top;
    }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .nowrap { white-space: nowrap; }
    .footer-note {
      margin-top: 8px;
      font-size: 9.5px;
      color: #64748b;
      text-align: center;
      border-top: 1px dashed #cbd5e1;
      padding-top: 5px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="watermark" aria-hidden="true">
    <img src="/matateni-logo.png" alt="" />
  </div>
  <div class="content">
  <section class="header">
    <div class="logo-wrap">
      <img class="logo" src="/matateni-logo.png" alt="Matateni Technologies" />
    </div>
    <h1 class="title">Training Effectiveness Assessment Form</h1>
    <p class="subhead">Matateni Projects (Pty) Ltd</p>
    <div class="meta">
      Form ID: ${esc(form.id)} | Title: ${esc(form.title)} | Date: ${esc(form.date)} | Submitted: ${esc(
        form.submittedAt || form.createdAt
      )} | Status: ${esc(form.status)}
    </div>
    <p class="subhead">Developed by: support@matateni.tech | https://matateni.tech</p>
  </section>

  <div class="meta">
    This document summarizes trainer submission, trainee feedback, and supervisor review/sign-off.
  </div>

  <section class="section">
    <h2>Section A: Training Information</h2>
    <table>
      <thead><tr><th>Field Name</th><th>Training Details</th></tr></thead>
      <tbody>
        <tr><td>Trainer's Name</td><td>${txt(submitted?.trainerName)}</td></tr>
        <tr><td>Trainer's Department / Role</td><td>${txt(submitted?.trainerDepartment || form.department)}</td></tr>
        <tr><td>Training Title / Topic</td><td>${txt(submitted?.trainingTitle || form.title)}</td></tr>
        <tr><td>Training Date</td><td>${txt(submitted?.trainingDate || form.date)}</td></tr>
        <tr><td>Training Duration</td><td>${txt(submitted?.durationHours)} hour(s)</td></tr>
        <tr><td>Training Format</td><td>${formats.length ? formats.map(esc).join(", ") : "-"}</td></tr>
        <tr><td>Number of Trainees</td><td>${txt(submitted?.numberOfTrainees || String(form.trainees))}</td></tr>
        <tr><td>Target User Group</td><td>${txt(submitted?.targetUserGroup)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>Section B: Training Objectives</h2>
    ${listOrDash(objectives)}
  </section>

  <section class="section">
    <h2>Section C: Trainee Feedback Summary</h2>
    <p><b>Total Feedbacks Submitted:</b> ${esc(form.feedbackResponses)}</p>
    <div class="grid">
      <div class="cell"><b>Responses</b><span>${esc(form.feedbackResponses)} / ${esc(form.trainees)}</span></div>
      <div class="cell"><b>Average Score</b><span>${esc(form.averageScore.toFixed(1))} / 5</span></div>
      <div class="cell"><b>Pass Rate</b><span>${txt(submitted?.passRate)}</span></div>
    </div>
    ${
      roster.length
        ? `<table>
             <thead><tr><th>Trainee</th><th>Department / Role</th><th>Attendance</th></tr></thead>
             <tbody>${roster
               .map((r) => `<tr><td>${esc(r.name || "-")}</td><td>${esc(r.departmentOrRole || "-")}</td><td>${esc(r.attendance || "-")}</td></tr>`)
               .join("")}</tbody>
           </table>`
        : "<p class='muted'>No roster submitted.</p>"
    }
    ${
      statementAverages.length === statementLabels.length
        ? `<table>
             <thead><tr><th>Evaluation Criteria / Statement</th><th>Aggregate Rating (out of 5)</th></tr></thead>
             <tbody>${statementLabels
               .map((label, i) => `<tr><td>${esc(label)}</td><td class="nowrap">${statementAverages[i].toFixed(2)} / 5</td></tr>`)
               .join("")}</tbody>
           </table>`
        : ""
    }
  </section>

  <section class="section">
    <h2>Section D: Knowledge / Skills Check (Trainer Assessment)</h2>
    <p><b>Total Trainees Evaluated:</b> ${esc(trainees.length)}</p>
    ${
      trainees.length
        ? `<table>
             <thead><tr><th>Trainee</th><th>Understanding</th><th>Independent</th></tr></thead>
             <tbody>${trainees
               .map(
                 (t) =>
                   `<tr><td>${esc(t.name || "-")}</td><td>${esc(t.understanding || "-")}</td><td>${esc(t.independent || "-")}</td></tr>`
               )
               .join("")}</tbody>
           </table>`
        : "<p class='muted'>No skills evaluation submitted.</p>"
    }
    <h2 style="margin-top:8px">Section E: Workplace Application & Follow-up</h2>
    <p class="muted" style="margin:4px 0 8px;">To be completed by trainer with input from supervisor or line manager, 2-4 weeks post-training.</p>
    <div style="margin-top:6px;">
      <p><b>1. To what extent have trainees applied the skills in the workplace?</b></p>
      ${optionGroup(submitted?.applicationExtent, ["Not at all", "Minimally", "Moderately", "Largely", "Fully"])}

      <p style="margin-top:10px;"><b>2. Observed improvement in performance or system use?</b></p>
      ${optionGroup(submitted?.observedImprovement, ["Yes", "No"])}
      <p style="margin-top:6px;"><b>If yes, please describe briefly:</b> ${txt(submitted?.observedImprovementDetails)}</p>

      <p style="margin-top:10px;"><b>3. Additional support or refresher training needed?</b></p>
      ${optionGroup(submitted?.supportNeeded, ["None", "Minimal", "Significant", "Full retraining required"])}

      <p style="margin-top:10px;"><b>4. Comments / barriers to application (e.g. time, resources, supervision):</b></p>
      <p style="margin:6px 0 4px;"><b>Comment by trainer:</b></p>
      <div style="margin-top:4px; min-height:54px; border:1px solid #cbd5e1; border-radius:8px; padding:8px; background:#fff;">${txt(submitted?.trainerApplicationComment || submitted?.barriersComment)}</div>
      <p style="margin:10px 0 4px;"><b>Comment by supervisor:</b></p>
      <div style="margin-top:4px; min-height:54px; border:1px solid #cbd5e1; border-radius:8px; padding:8px; background:#fff;">${txt(submitted?.supervisorApplicationComment)}</div>
    </div>
  </section>

  <section class="section">
    <h2>Section F: Overall Trainer Reflection & Improvement</h2>
    <table>
      <thead><tr><th>Reflection Field</th><th>Details</th></tr></thead>
      <tbody>
        <tr><td>What worked well in this training</td><td>${txt(submitted?.workedWellComment)}</td></tr>
        <tr><td>What would you change for future sessions</td><td>${txt(submitted?.trainerFutureSessionComment)}</td></tr>
        <tr><td>Training effectiveness rating (overall)</td><td>${txt(submitted?.effectivenessRating)}</td></tr>
        <tr><td>Recommendation</td><td>${txt(submitted?.recommendationChoice || form.recommendation)}</td></tr>
      </tbody>
    </table>
  </section>

  <section class="section">
    <h2>Section G: Sign-off</h2>
    <table>
      <thead><tr><th>Sign-off Role</th><th>Name</th><th>Signature</th><th>Date Signed</th></tr></thead>
      <tbody>
        <tr>
          <td>Trainer</td>
          <td>${txt(submitted?.signOff?.trainerName)}</td>
          <td>${imageTag(submitted?.signatures?.trainerImage, "Trainer signature")}</td>
          <td>${txt(submitted?.signOff?.trainerDate)}</td>
        </tr>
        <tr>
          <td>Supervisor</td>
          <td>${txt(submitted?.signOff?.supervisorName)}</td>
          <td>${imageTag(submitted?.signatures?.supervisorImage, "Supervisor signature")}</td>
          <td>${txt(submitted?.signOff?.supervisorDate)}</td>
        </tr>
      </tbody>
    </table>
  </section>

  ${
    includeTraineeComments
      ? `<section class="section">
           <h2>Trainee Comments</h2>
           ${
             traineeComments.length
               ? `<table>
                    <thead><tr><th>Trainee</th><th>Date</th><th>Comment</th><th>Avg</th></tr></thead>
                    <tbody>${traineeComments
                      .map(
                        (c) =>
                          `<tr><td>${esc(c.traineeName || "Anonymous")}</td><td class="nowrap">${esc(c.feedbackDate || "N/A")}</td><td>${esc(c.comment || "-")}</td><td class="nowrap">${esc(c.averageScore.toFixed(1))}</td></tr>`
                      )
                      .join("")}</tbody>
                  </table>`
               : "<p class='muted'>No trainee comments.</p>"
           }
         </section>`
      : ""
  }
  <div class="footer-note">
    Matateni Projects (Pty) Ltd • Confidential Internal Document • For training governance and audit use.
  </div>
</div>
</body>
</html>`;
}

export function exportSignedFormPdf(form: TrainingForm, options?: { includeTraineeComments?: boolean }) {
  const includeTraineeComments = options?.includeTraineeComments ?? false;
  const html = buildSignedFormHtml(form, includeTraineeComments);
  const win = window.open("", "_blank", "width=1024,height=768");
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
}
