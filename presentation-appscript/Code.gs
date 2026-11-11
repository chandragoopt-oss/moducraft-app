/**
 * Module Studio Presentation Builder — standalone Apps Script backend.
 * Deploy as a NEW standalone Apps Script project owned by the Module Studio account.
 * Does not modify or import the existing ModuCraft web app or Design Studio.
 */
const APP = Object.freeze({
  NAME: 'Module Studio Presentation Builder',
  VERSION: '0.1.0',
  PROPERTY_FOLDER_ID: 'PRESENTATION_ROOT_FOLDER_ID',
  PROPERTY_API_KEY: 'PRESENTATION_API_KEY'
});

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'health';
  if (action === 'health') {
    return json_({ ok: true, app: APP.NAME, version: APP.VERSION, status: 'ready' });
  }
  return json_({ ok: false, error: 'Unknown GET action' });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    authorize_(payload.apiKey);
    switch (payload.action) {
      case 'health':
        return json_({ ok: true, app: APP.NAME, version: APP.VERSION });
      case 'createPresentation':
        return json_(createPresentation_(payload));
      case 'listPresentations':
        return json_(listPresentations_());
      default:
        return json_({ ok: false, error: 'Unsupported action' });
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function authorize_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty(APP.PROPERTY_API_KEY);
  if (!expected) throw new Error('Backend is not configured: set PRESENTATION_API_KEY in Script Properties.');
  if (!provided || provided !== expected) throw new Error('Unauthorized');
}

function createPresentation_(payload) {
  const folderId = PropertiesService.getScriptProperties().getProperty(APP.PROPERTY_FOLDER_ID);
  if (!folderId) throw new Error('Set PRESENTATION_ROOT_FOLDER_ID in Script Properties.');
  const client = required_(payload.client, 'client');
  const project = required_(payload.project, 'project');
  const type = required_(payload.type, 'type');
  if (!['moodboard', 'first-design', 'final-design'].includes(type)) throw new Error('Invalid presentation type.');
  if (type !== 'moodboard' && !payload.quotationNumber) throw new Error('Quotation number is required for design presentations.');

  const folder = DriveApp.getFolderById(folderId);
  const title = [client, project, typeLabel_(type)].join(' — ');
  const deck = SlidesApp.create(title);
  const file = DriveApp.getFileById(deck.getId());
  file.moveTo(folder);

  const slides = Array.isArray(payload.slides) ? payload.slides : [];
  if (!slides.length) throw new Error('At least one slide is required.');
  slides.forEach(function(item, index) {
    if (!item || !item.title) throw new Error('Slide ' + (index + 1) + ' has no title.');
  });
  const first = deck.getSlides()[0];
  renderSlide_(first, slides[0], payload, 1, slides.length);
  for (let i = 1; i < slides.length; i++) {
    const slide = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    renderSlide_(slide, slides[i], payload, i + 1, slides.length);
  }
  return {
    ok: true,
    presentationId: deck.getId(),
    presentationUrl: deck.getUrl(),
    title: title,
    slideCount: slides.length
  };
}

function renderSlide_(slide, data, project, page, total) {
  const bg = slide.getBackground();
  bg.setSolidFill('#F6F7F3');
  const title = slide.insertTextBox(String(data.title || ''), 48, 55, 620, 75);
  title.getText().getTextStyle().setFontFamily('Georgia').setFontSize(28).setForegroundColor('#26382C');
  const body = slide.insertTextBox(String(data.body || ''), 50, 150, 620, 190);
  body.getText().getTextStyle().setFontFamily('Arial').setFontSize(14).setForegroundColor('#657166');
  const footer = slide.insertTextBox('MODULE STUDIO  ·  ' + page + ' / ' + total, 50, 370, 620, 20);
  footer.getText().getTextStyle().setFontFamily('Arial').setFontSize(8).setForegroundColor('#899389');
}

function listPresentations_() {
  const folderId = PropertiesService.getScriptProperties().getProperty(APP.PROPERTY_FOLDER_ID);
  if (!folderId) throw new Error('Set PRESENTATION_ROOT_FOLDER_ID in Script Properties.');
  const files = DriveApp.getFolderById(folderId).getFilesByType(MimeType.GOOGLE_SLIDES);
  const rows = [];
  while (files.hasNext()) {
    const f = files.next();
    rows.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), updated: f.getLastUpdated().toISOString() });
  }
  return { ok: true, presentations: rows };
}

function typeLabel_(type) {
  return ({ moodboard: 'Moodboard', 'first-design': 'First Design Presentation', 'final-design': 'Final Design Presentation' })[type];
}
function required_(value, name) {
  const v = String(value || '').trim();
  if (!v) throw new Error('Missing required field: ' + name);
  return v;
}
function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

/** Run once from the Apps Script editor to create the private output folder. */
function setupPresentationFolder() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(APP.PROPERTY_FOLDER_ID);
  if (!id) {
    const folder = DriveApp.createFolder('Module Studio Presentations');
    id = folder.getId();
    props.setProperty(APP.PROPERTY_FOLDER_ID, id);
  }
  Logger.log('Presentation folder ID: ' + id);
}

/** Run once from the Apps Script editor to create an API key. */
function setupPresentationApiKey() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(APP.PROPERTY_API_KEY)) {
    const key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(APP.PROPERTY_API_KEY, key);
    Logger.log('Copy this API key into the Presentation Builder server configuration: ' + key);
  } else {
    Logger.log('API key already exists. It was not replaced.');
  }
}
