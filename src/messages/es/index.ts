import common from "./common.json";
import errors from "./errors.json";
import metadata from "./metadata.json";
import auth from "./auth.json";
import exam from "./exam.json";
import flashcards from "./flashcards.json";
import feynman from "./feynman.json";
import notes from "./notes.json";
import chat from "./chat.json";
import vocabulary from "./vocabulary.json";
import reader from "./reader.json";
import review from "./review.json";
import workspace from "./workspace.json";
import subscription from "./subscription.json";
import landing from "./landing.json";
import admin from "./admin.json";

// Reference language: every other locale must provide these same namespaces and keys.
const messages = {
  common,
  errors,
  metadata,
  auth,
  exam,
  flashcards,
  feynman,
  notes,
  chat,
  vocabulary,
  reader,
  review,
  workspace,
  subscription,
  landing,
  admin,
};

export default messages;
