const SPREADSHEET_ID = "1xl0FtvRcF9fdg1wucCcDT_1GJLGlM3C0DbSQYNzMWcI";
const NOTIFICATION_EMAIL = "sam@newwavedm.com";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    if (data.website) return output({ ok: true });
    if (!data.name || !data.mobile || !data.email) return output({ ok: false, error: "Missing required fields" });

    const cache = CacheService.getScriptCache();
    if (data.submissionId && cache.get(data.submissionId)) return output({ ok: true, duplicate: true });

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("Enquiries");
    sheet.appendRow([
      data.submittedAt ? new Date(data.submittedAt) : new Date(),
      clean(data.name), clean(data.mobile), clean(data.email), clean(data.groupMembers),
      clean(data.groupSize), clean(data.boatExperience), clean(data.notes), clean(data.page),
      "New", ""
    ]);
    if (data.submissionId) cache.put(data.submissionId, "1", 21600);

    try {
      MailApp.sendEmail({
        to: NOTIFICATION_EMAIL,
        subject: `New Boat Syndicate enquiry – ${clean(data.name)}`,
        htmlBody: ownerEmail(data),
        replyTo: clean(data.email),
        name: "Gold Coast Boat Syndicate"
      });
      MailApp.sendEmail({
        to: clean(data.email),
        subject: "Thanks for your interest in the Gold Coast Boat Syndicate",
        htmlBody: confirmationEmail(data),
        name: "Gold Coast Boat Syndicate",
        replyTo: NOTIFICATION_EMAIL
      });
    } catch (emailError) {
      console.error("Lead saved but email failed", emailError);
    }
    return output({ ok: true });
  } catch (error) {
    console.error(error);
    return output({ ok: false, error: "Submission failed" });
  } finally {
    lock.releaseLock();
  }
}

function clean(value) {
  return String(value || "").replace(/[<>]/g, "").trim();
}

function ownerEmail(data) {
  return `<h2>New Boat Syndicate enquiry</h2><p><strong>Name:</strong> ${clean(data.name)}</p><p><strong>Mobile:</strong> ${clean(data.mobile)}</p><p><strong>Email:</strong> ${clean(data.email)}</p><p><strong>Who is in the share:</strong> ${clean(data.groupMembers) || "Not provided"}</p><p><strong>Group size:</strong> ${clean(data.groupSize) || "Not provided"}</p><p><strong>Boat experience:</strong> ${clean(data.boatExperience) || "Not provided"}</p><p><strong>Questions:</strong> ${clean(data.notes) || "None"}</p><p><a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit">Open enquiry sheet</a></p>`;
}

function confirmationEmail(data) {
  return `<p>Hi ${clean(data.name)},</p><p>Thanks for registering your interest in the Gold Coast Boat Syndicate.</p><p>There is no commitment at this stage. I am currently speaking with potential ownership groups and will be in touch shortly to answer any questions and explain the next steps.</p><p>Sam</p>`;
}

function output(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
