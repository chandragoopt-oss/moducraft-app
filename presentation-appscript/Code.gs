/**
 * Module Studio Presentation Builder — standalone Apps Script backend.
 * This project is intentionally separate from the production ModuCraft app.
 *
 * SECURITY: Do not deploy or connect this endpoint to browser code yet.
 * The API-key placeholder is not production authentication. Integrate the
 * existing server-verified ModuCraft session/role system before deployment.
 */
const APP = Object.freeze({
  NAME: 'Module Studio Presentation Builder',
  VERSION: '0.2.0',
  PROPERTY_FOLDER_ID: 'PRESENTATION_ROOT_FOLDER_ID',
  PROPERTY_API_KEY: 'PRESENTATION_API_KEY',
  WEBSITE: 'www.modulestudio.in',
  MAX_SLIDES: 60,
  MAX_TEXT: 12000
});

const REQUIRED_OPENING = ['cover', 'about', 'how-we-work', 'why'];
const REQUIRED_CLOSING = ['commitments', 'milestones', 'contact'];
const VALID_TYPES = ['moodboard', 'first-design', 'final-design'];

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
  if (!expected) throw new Error('Backend is not configured.');
  if (!provided || provided !== expected) throw new Error('Unauthorized');
}

function createPresentation_(payload) {
  // Validate everything before creating a Drive file to avoid empty/orphan decks.
  const model = validatePresentation_(payload);
  const folderId = PropertiesService.getScriptProperties().getProperty(APP.PROPERTY_FOLDER_ID);
  if (!folderId) throw new Error('Run setupPresentationFolder from the script editor first.');

  const folder = DriveApp.getFolderById(folderId);
  const title = [model.client, model.project, typeLabel_(model.type)].join(' — ');
  let deck = null;

  try {
    deck = SlidesApp.create(title);
    const file = DriveApp.getFileById(deck.getId());
    file.moveTo(folder);

    const slides = deck.getSlides();
    const first = slides[0];
    clearSlide_(first);
    renderSlide_(first, model.slides[0], model, 1, model.slides.length);

    for (let i = 1; i < model.slides.length; i++) {
      const slide = deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      renderSlide_(slide, model.slides[i], model, i + 1, model.slides.length);
    }

    return {
      ok: true,
      presentationId: deck.getId(),
      presentationUrl: deck.getUrl(),
      title: title,
      slideCount: model.slides.length
    };
  } catch (err) {
    // Remove a partially created file if rendering fails.
    if (deck) {
      try { DriveApp.getFileById(deck.getId()).setTrashed(true); } catch (cleanupError) {
        console.error('Could not clean up incomplete deck: ' + cleanupError);
      }
    }
    throw err;
  }
}

function validatePresentation_(payload) {
  const model = {
    client: required_(payload.client, 'client'),
    project: required_(payload.project, 'project'),
    preparedBy: required_(payload.preparedBy, 'preparedBy'),
    date: required_(payload.date, 'date'),
    type: required_(payload.type, 'type'),
    quotationNumber: String(payload.quotationNumber || '').trim(),
    slides: Array.isArray(payload.slides) ? payload.slides : []
  };

  if (VALID_TYPES.indexOf(model.type) === -1) throw new Error('Invalid presentation type.');
  if (model.type !== 'moodboard' && !model.quotationNumber) {
    throw new Error('Quotation number is required for design presentations.');
  }
  if (!model.slides.length || model.slides.length > APP.MAX_SLIDES) {
    throw new Error('Presentation must contain between 1 and ' + APP.MAX_SLIDES + ' slides.');
  }

  const keys = model.slides.map(function(slide) { return slide && String(slide.key || ''); });
  if (keys.slice(0, REQUIRED_OPENING.length).join('|') !== REQUIRED_OPENING.join('|')) {
    throw new Error('Required opening order: Cover, About Us, How We Work, Why Module Studio.');
  }
  if (keys.slice(-REQUIRED_CLOSING.length).join('|') !== REQUIRED_CLOSING.join('|')) {
    throw new Error('Required closing order: Our Commitments, Quotation & Payment Milestones, Contact Us.');
  }

  model.slides.forEach(function(slide, index) {
    if (!slide || !String(slide.title || '').trim()) throw new Error('Slide ' + (index + 1) + ' needs a title.');
    if (String(slide.title).length > 180 || String(slide.body || '').length > APP.MAX_TEXT) {
      throw new Error('Slide ' + (index + 1) + ' exceeds the allowed text length.');
    }
    if (model.type === 'first-design' && /₹|\bINR\b|\b\d+(?:\.\d+)?\s?(?:mm|cm|m|ft|feet|inch|inches)\b/i.test(String(slide.body || ''))) {
      throw new Error('First Design presentations must not contain prices or dimensions. Material specifications are allowed.');
    }
  });

  if (model.slides[0].key !== 'cover') throw new Error('Cover page is required.');
  return model;
}

function clearSlide_(slide) {
  slide.getPageElements().forEach(function(element) { element.remove(); });
}

function renderSlide_(slide, data, project, page, total) {
  slide.getBackground().setSolidFill('#F6F7F3');

  const titleText = String(data.title || '');
  const bodyText = String(data.body || '');
  const title = slide.insertTextBox(titleText, 48, 42, 624, 62);
  title.getText().getTextStyle()
    .setFontFamily('Georgia').setFontSize(26).setBold(true).setForegroundColor('#26382C');

  const body = slide.insertTextBox(bodyText, 50, 125, 620, 205);
  body.getText().getTextStyle()
    .setFontFamily('Arial').setFontSize(13).setForegroundColor('#526054');

  if (data.key === 'cover') {
    const metadata = [
      project.client,
      project.project,
      project.date,
      'Prepared by ' + project.preparedBy,
      project.type === 'moodboard' ? '' : 'Quotation No. ' + project.quotationNumber
    ].filter(Boolean).join('  ·  ');
    const meta = slide.insertTextBox(metadata, 50, 335, 620, 32);
    meta.getText().getTextStyle().setFontFamily('Arial').setFontSize(9).setForegroundColor('#526054');
  }

  const footer = slide.insertTextBox(
    'MODULE STUDIO  ·  ' + APP.WEBSITE + '                                      ' + page + ' / ' + total,
    48, 378, 624, 16
  );
  footer.getText().getTextStyle()
    .setFontFamily('Arial').setFontSize(8).setForegroundColor('#899389');
}

function listPresentations_() {
  const folderId = PropertiesService.getScriptProperties().getProperty(APP.PROPERTY_FOLDER_ID);
  if (!folderId) throw new Error('Run setupPresentationFolder from the script editor first.');
  const files = DriveApp.getFolderById(folderId).getFilesByType(MimeType.GOOGLE_SLIDES);
  const rows = [];
  while (files.hasNext()) {
    const file = files.next();
    rows.push({
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      updated: file.getLastUpdated().toISOString()
    });
  }
  return { ok: true, presentations: rows };
}

function typeLabel_(type) {
  return ({
    moodboard: 'Moodboard',
    'first-design': 'First Design Presentation',
    'final-design': 'Final Design Presentation'
  })[type];
}

function required_(value, name) {
  const result = String(value || '').trim();
  if (!result) throw new Error('Missing required field: ' + name);
  return result;
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
  Logger.log('Presentation folder is configured.');
}

/**
 * Not required for the current setup stage.
 * Do not use this API-key-only check as production authentication.
 */
function setupPresentationApiKey() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty(APP.PROPERTY_API_KEY)) {
    const key = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
    props.setProperty(APP.PROPERTY_API_KEY, key);
    Logger.log('A private API key was generated. Do not share it or place it in browser code.');
  } else {
    Logger.log('API key already exists. It was not replaced.');
  }
}
