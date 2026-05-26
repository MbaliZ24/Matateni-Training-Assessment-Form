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

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Signed Form - ${form.id}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    h2 { margin: 18px 0 8px; font-size: 16px; }
    .meta { color: #475569; font-size: 13px; margin-bottom: 12px; }
    .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .cell { flex: 1 1 220px; }
    ul { margin: 8px 0 0 18px; }
  </style>
</head>
<body>
  <h1>Signed Training Assessment Form</h1>
  <div class="meta">Form ID: ${form.id} | Title: ${form.title} | Date: ${form.date}</div>

  <div class="box">
    <div class="row">
      <div class="cell"><strong>Status:</strong> ${form.status}</div>
      <div class="cell"><strong>Department:</strong> ${form.department}</div>
      <div class="cell"><strong>Trainees:</strong> ${form.trainees}</div>
    </div>
  </div>

  <h2>Supervisor Sign-off</h2>
  <div class="box">
    <div><strong>Decision:</strong> ${review?.decision ?? (form.status === "Approved" ? "Approved" : form.status)}</div>
    <div><strong>Reviewer:</strong> ${review?.submittedBy ?? "Supervisor"}</div>
    <div><strong>Updated:</strong> ${(review?.updatedAt ?? form.createdAt).slice(0, 10)}</div>
    <div><strong>Comments:</strong> ${review?.comments ?? "No written comments."}</div>
    <div><strong>Action Items:</strong></div>
    <ul>
      ${(review?.actionItems?.length ? review.actionItems : ["No action items."]).map((x) => `<li>${x}</li>`).join("")}
    </ul>
  </div>

  <h2>Section Feedback</h2>
  <div class="box">
    ${sectionFeedback.length ? sectionFeedback.map((s) => `<div><strong>${s.section}</strong> - ${s.verdict}<br/>${s.comment || "No section comment."}</div><br/>`).join("") : "No section-level feedback."}
  </div>

  ${
    includeTraineeComments
      ? `<h2>Trainee Comments</h2>
         <div class="box">
           ${traineeComments.length ? traineeComments.map((c) => `<div><strong>${c.traineeName || "Anonymous"}</strong> (${c.feedbackDate || "N/A"})<br/>${c.comment || "No comment."}</div><br/>`).join("") : "No trainee comments."}
         </div>`
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
