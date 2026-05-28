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
  const review = form.supervisorReview;
  const sectionFeedback = review?.sectionFeedback ?? [];
  const traineeComments = form.supervisorOnlyFeedback ?? [];
  const submitted = form.submittedData;
  const objectives = submitted?.objectives ?? [];
  const trainees = submitted?.trainees ?? [];
  const roster = submitted?.traineeRoster ?? [];
  const formats = submitted?.trainingFormats ?? [];

  const esc = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const yesNo = (v?: string) => (v && v.trim().length > 0 ? esc(v) : "-");
  const txt = (v?: string) => (v && v.trim().length > 0 ? esc(v) : "-");
  const imageTag = (src?: string, alt?: string) =>
    src && src.trim().length > 0
      ? `<img src="${esc(src)}" alt="${esc(alt || "Signature")}" style="max-height:48px; max-width:180px; object-fit:contain; border:1px solid #e2e8f0; border-radius:6px; padding:2px; background:#fff;" />`
      : "<span>-</span>";
  const listOrDash = (items: string[]) =>
    items.length > 0 ? `<ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "<p class='muted'>-</p>";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Signed Form - ${form.id}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      font-size: 11px;
      line-height: 1.35;
    }
    .title {
      margin: 0 0 4px;
      font-size: 18px;
      font-weight: 700;
    }
    .meta {
      color: #475569;
      font-size: 10px;
      margin-bottom: 8px;
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
  </style>
</head>
<body>
  <h1 class="title">Training Effectiveness Assessment Form</h1>
  <div class="meta">
    Form ID: ${esc(form.id)} | Title: ${esc(form.title)} | Date: ${esc(form.date)} | Submitted: ${esc(
      form.submittedAt || form.createdAt
    )} | Status: ${esc(form.status)}
  </div>

  <section class="section">
    <h2>Section A - Training Information</h2>
    <div class="grid">
      <div class="cell"><b>Trainer Name</b><span>${txt(submitted?.trainerName)}</span></div>
      <div class="cell"><b>Trainer Department/Role</b><span>${txt(submitted?.trainerDepartment || form.department)}</span></div>
      <div class="cell"><b>Training Date</b><span>${txt(submitted?.trainingDate || form.date)}</span></div>
      <div class="cell wide"><b>Training Title / Topic</b><span>${txt(submitted?.trainingTitle || form.title)}</span></div>
      <div class="cell"><b>Duration (Days)</b><span>${txt(submitted?.durationDays)}</span></div>
      <div class="cell"><b>Duration (Hours)</b><span>${txt(submitted?.durationHours)}</span></div>
      <div class="cell"><b>Number of Trainees</b><span>${txt(submitted?.numberOfTrainees || String(form.trainees))}</span></div>
      <div class="cell wide"><b>Training Format</b><span>${formats.length ? formats.map(esc).join(", ") : "-"}</span></div>
      <div class="cell wide"><b>Target User Group</b><span>${txt(submitted?.targetUserGroup)}</span></div>
    </div>
  </section>

  <section class="section">
    <h2>Section B - Training Objectives</h2>
    ${listOrDash(objectives)}
  </section>

  <section class="section">
    <h2>Section C - Trainee Feedback Summary</h2>
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
  </section>

  <section class="section">
    <h2>Section D - Skills & Follow-up</h2>
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
    <div class="grid" style="margin-top:6px">
      <div class="cell"><b>Application Extent</b><span>${txt(submitted?.applicationExtent)}</span></div>
      <div class="cell"><b>Observed Improvement</b><span>${yesNo(submitted?.observedImprovement)}</span></div>
      <div class="cell"><b>Support Needed</b><span>${txt(submitted?.supportNeeded)}</span></div>
      <div class="cell wide"><b>Observed Improvement Details</b><span>${txt(submitted?.observedImprovementDetails)}</span></div>
      <div class="cell wide"><b>Barriers / Comments</b><span>${txt(submitted?.barriersComment)}</span></div>
    </div>
  </section>

  <section class="section">
    <h2>Section F - Reflection</h2>
    <div class="grid">
      <div class="cell wide"><b>What worked well</b><span>${txt(submitted?.workedWellComment)}</span></div>
      <div class="cell wide"><b>Trainer future-session comment</b><span>${txt(submitted?.trainerFutureSessionComment)}</span></div>
      <div class="cell wide"><b>Supervisor future-session comment</b><span>${txt(submitted?.supervisorFutureSessionComment)}</span></div>
      <div class="cell"><b>Effectiveness Rating</b><span>${txt(submitted?.effectivenessRating)}</span></div>
      <div class="cell wide"><b>Recommendation</b><span>${txt(submitted?.recommendationChoice || form.recommendation)}</span></div>
    </div>
  </section>

  <section class="section">
    <h2>Section G - Sign-off</h2>
    <div class="grid">
      <div class="cell"><b>Trainer Name</b><span>${txt(submitted?.signOff?.trainerName)}</span></div>
      <div class="cell"><b>Trainer Signed</b><span>${submitted?.signatures?.trainer ? "Yes" : "No"}</span></div>
      <div class="cell"><b>Trainer Date</b><span>${txt(submitted?.signOff?.trainerDate)}</span></div>
      <div class="cell"><b>Trainer Signature Image</b>${imageTag(submitted?.signatures?.trainerImage, "Trainer signature")}</div>
      <div class="cell"><b>Supervisor Name</b><span>${txt(submitted?.signOff?.supervisorName)}</span></div>
      <div class="cell"><b>Supervisor Signed</b><span>${submitted?.signatures?.supervisor ? "Yes" : "No"}</span></div>
      <div class="cell"><b>Supervisor Date</b><span>${txt(submitted?.signOff?.supervisorDate)}</span></div>
      <div class="cell"><b>Supervisor Signature Image</b>${imageTag(
        submitted?.signatures?.supervisorImage,
        "Supervisor signature"
      )}</div>
    </div>
  </section>

  <section class="section">
    <h2>Supervisor Review</h2>
    <div class="grid">
      <div class="cell"><b>Decision</b><span>${esc(review?.decision ?? (form.status === "Approved" ? "Approved" : form.status))}</span></div>
      <div class="cell"><b>Reviewer</b><span>${esc(review?.submittedBy ?? "Supervisor")}</span></div>
      <div class="cell"><b>Updated</b><span>${esc((review?.updatedAt ?? form.createdAt).slice(0, 10))}</span></div>
      <div class="cell wide"><b>Comments</b><span>${txt(review?.comments)}</span></div>
      <div class="cell wide"><b>Action Items</b>${review?.actionItems?.length ? listOrDash(review.actionItems) : "<p class='muted'>-</p>"}</div>
    </div>
    ${
      sectionFeedback.length
        ? `<table>
             <thead><tr><th>Section</th><th>Verdict</th><th>Comment</th></tr></thead>
             <tbody>${sectionFeedback
               .map((s) => `<tr><td>${esc(s.section)}</td><td class="nowrap">${esc(s.verdict)}</td><td>${esc(s.comment || "-")}</td></tr>`)
               .join("")}</tbody>
           </table>`
        : "<p class='muted' style='margin-top:6px'>No section-level review notes.</p>"
    }
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
