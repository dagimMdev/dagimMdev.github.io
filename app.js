const portfolio = window.portfolioData;
if (!portfolio) {
  throw new Error("Portfolio data did not load. Check that portfolio-data.js is available.");
}

const chatMessages = document.querySelector("#chat-messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const projectGrid = document.querySelector("#project-grid");
const projectTemplate = document.querySelector("#project-card-template");
const interestGrid = document.querySelector("#interest-grid");
const journalList = document.querySelector("#journal-list");
const contactLinks = document.querySelector("#contact-links");

const intents = [
  { id: "skills", terms: ["skill", "skills", "programming language", "programming languages", "technical", "technology", "java", "python", "javafx", "junit"] },
  { id: "projects", terms: ["project", "projects", "portfolio", "encryption", "gui application", "python experiment", "arduino", "sensor experiment"] },
  { id: "experience", terms: ["experience", "job", "employment", "volunteer", "leadership", "work history", "youth development"] },
  { id: "education", terms: ["education", "school", "college", "university", "degree", "study", "studying"] },
  { id: "languages", terms: ["speak", "spoken", "language do you speak", "languages do you speak", "amharic", "wolaytta", "hindi", "english"] },
  { id: "interests", terms: ["interest", "interests", "sensor", "sensors", "radar", "object detection", "distance measurement", "computer vision", "automatic door", "microcontroller"] },
  { id: "opportunities", terms: ["intern", "internship", "hire", "opportunity", "opportunities", "career", "looking for", "interested in"] }
];

const intentAnchors = [
  { id: "skills", terms: ["skill", "skills", "programming language", "programming languages", "technical skills", "technology stack"] },
  { id: "projects", terms: ["project", "projects", "source code", "live demo", "arduino", "sensor experiment"] },
  { id: "experience", terms: ["experience", "employment", "work history", "job history"] },
  { id: "education", terms: ["education", "school", "college", "university", "degree"] },
  { id: "languages", terms: ["spoken languages", "speak", "spoken", "amharic", "wolaytta", "hindi", "english"] },
  { id: "interests", terms: ["interest", "interests", "radar", "object detection", "distance measurement", "computer vision", "automatic door", "microcontroller"] },
  { id: "opportunities", terms: ["internship", "internships", "job opportunity", "career opportunity", "career"] }
];

const fallbackAnswer = "I don't have enough approved portfolio information to answer that accurately. Try asking about skills, projects, education, experience, or languages spoken.";

function normalizedWords(text) {
  return text.toLocaleLowerCase().match(/[a-z0-9+#]+/g) || [];
}

function termMatches(words, term) {
  const termWords = normalizedWords(term);
  return termWords.length > 0 && words.some((_, start) =>
    termWords.every((word, offset) => words[start + offset] === word)
  );
}

function resolveIntent(question) {
  const words = normalizedWords(question);
  const anchoredIntents = intentAnchors.filter(({ terms }) =>
    terms.some((term) => termMatches(words, term))
  );
  if (anchoredIntents.length === 1) return anchoredIntents[0].id;
  if (anchoredIntents.length > 1) return null;

  const scores = intents.map((intent) => ({
    id: intent.id,
    score: intent.terms.reduce((total, term) => total + Number(termMatches(words, term)), 0)
  })).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);

  if (!scores.length || (scores.length > 1 && scores[0].score === scores[1].score)) return null;
  return scores[0].id;
}

function answerQuestion(question) {
  const intent = resolveIntent(question);
  const profile = portfolio.profile;

  if (intent === "skills") return `The skills listed on this portfolio are ${profile.skills.join(", ")}.`;
  if (intent === "languages") return `The languages listed on this portfolio are ${profile.spokenLanguages.join(", ")}.`;
  if (intent === "education") return profile.education;
  if (intent === "experience") return profile.experience;
  if (intent === "opportunities") return profile.opportunities;
  if (intent === "interests") {
    if (/\b(built|build|made|created|finished|completed|implemented|developed)\b/i.test(question)) {
      const words = normalizedWords(question);
      const mentionedInterest = portfolio.interests.map((interest) => ({
        interest,
        score: interest.keywords.reduce((total, keyword) =>
          total + (termMatches(words, keyword) ? normalizedWords(keyword).length + 1 : 0), 0
        ) + normalizedWords(interest.title).reduce((total, word) =>
          total + (termMatches(words, word) ? 3 : 0), 0
        )
      })).filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)[0]?.interest;
      return mentionedInterest
        ? `The portfolio lists "${mentionedInterest.title}" as an idea to explore, not as a completed project.`
        : "The hardware and software topics listed here are interests and ideas, not completed projects.";
    }
    return portfolio.interests.map((interest) =>
      `${interest.title}: ${interest.description}`
    ).join(" ");
  }
  if (intent === "projects") {
    if (!portfolio.projects.length) return "There are no public project details on this portfolio yet.";
    const mentionedArduino = termMatches(normalizedWords(question), "arduino");
    const projects = mentionedArduino
      ? portfolio.projects.filter((project) =>
        project.technologies.some((technology) => normalizedWords(technology).includes("arduino"))
      )
      : portfolio.projects;
    return projects.map((project) =>
      `${project.title}: ${project.description} Technologies: ${project.technologies.join(", ")}. Progress: ${project.status}.`
    ).join(" ");
  }
  return fallbackAnswer;
}

function setText(element, selector, text) {
  element.querySelector(selector).textContent = text;
}

function createProjectArt(type, art) {
  if (type === "encryption") {
    ["01", "10", "11"].forEach((value) => {
      const bit = document.createElement("span");
      bit.textContent = value;
      art.append(bit);
    });
    const arrow = document.createElement("b");
    arrow.textContent = "↗";
    art.append(arrow);
    art.classList.add("encryption-art");
    return;
  }

  if (type === "gui") {
    const window = document.createElement("div");
    window.className = "mini-window";
    for (let index = 0; index < 3; index += 1) window.append(document.createElement("i"));
    const caption = document.createElement("span");
    caption.textContent = "Build something useful.";
    window.append(caption);
    art.append(window);
    art.classList.add("gui-art");
    return;
  }

  if (type === "python") {
    const code = document.createElement("span");
    code.textContent = "</>";
    const sparkle = document.createElement("i");
    sparkle.textContent = "✳";
    art.append(code, sparkle);
    art.classList.add("python-art");
    return;
  }

  if (type === "sensor") {
    art.classList.add("sensor-art");
    const sonar = document.createElement("div");
    sonar.className = "sonar-display";
    for (let index = 0; index < 3; index += 1) {
      const pulse = document.createElement("i");
      pulse.className = "sensor-pulse";
      sonar.append(pulse);
    }
    const board = document.createElement("div");
    board.className = "sensor-board";
    const boardLabel = document.createElement("span");
    boardLabel.textContent = "ARDUINO";
    const sensor = document.createElement("b");
    sensor.textContent = "SENSOR";
    board.append(boardLabel, sensor);
    art.append(sonar, board);
    return;
  }

  const label = document.createElement("span");
  label.textContent = art || "CODE";
  art.append(label);
  art.classList.add("code-art");
}

function addExternalLink(container, label, value, allowedHost) {
  if (typeof value !== "string" || !value.trim()) return false;

  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || (allowedHost && !allowedHost.includes(url.hostname))) return false;
  const link = document.createElement("a");
  link.href = url.href;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  container.append(link);
  return true;
}

function renderProjects() {
  projectGrid.replaceChildren();
  portfolio.projects.forEach((project, index) => {
    const card = projectTemplate.content.firstElementChild.cloneNode(true);
    card.classList.add(project.cardStyle);
    setText(card, "[data-project-technologies]", project.technologies.join(" · ").toUpperCase());
    setText(card, "[data-project-number]", String(index + 1).padStart(2, "0"));
    setText(card, "[data-project-title]", project.title);
    setText(card, "[data-project-description]", project.description);
    setText(card, "[data-project-lesson]", project.lessonLearned || "Public takeaway not added yet.");
    setText(card, "[data-project-status]", project.status);
    createProjectArt(project.artType, card.querySelector("[data-project-art]"));

    const links = card.querySelector("[data-project-links]");
    addExternalLink(links, "Source code ↗", project.sourceUrl, ["github.com"]);
    addExternalLink(links, "Live demo ↗", project.demoUrl);
    projectGrid.append(card);
  });
}

function renderInterests() {
  interestGrid.replaceChildren();
  portfolio.interests.forEach((interest, index) => {
    const card = document.createElement("article");
    card.className = `interest-card ${["project-dark", "project-yellow", "project-lilac"][index % 3]}`;
    const meta = document.createElement("p");
    meta.className = "interest-meta";
    meta.textContent = interest.technology;
    const title = document.createElement("h3");
    title.textContent = interest.title;
    const description = document.createElement("p");
    description.textContent = interest.description;
    const status = document.createElement("span");
    status.className = "interest-status";
    status.textContent = "IDEA / NOT STARTED";
    card.append(meta, title, description, status);
    interestGrid.append(card);
  });
}

function renderJournal() {
  journalList.replaceChildren();
  portfolio.journal.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "journal-entry";
    const date = document.createElement("p");
    date.className = "journal-date";
    date.textContent = entry.date;
    const title = document.createElement("h4");
    title.textContent = entry.title;
    const summary = document.createElement("p");
    summary.textContent = entry.summary;
    const lesson = document.createElement("p");
    lesson.className = "journal-lesson";
    lesson.textContent = `Takeaway: ${entry.lessonLearned}`;
    article.append(date, title, summary, lesson);

    if (entry.technologies.length) {
      const technologies = document.createElement("p");
      technologies.className = "journal-technologies";
      technologies.textContent = entry.technologies.join(" · ");
      article.append(technologies);
    }
    journalList.append(article);
  });

  if (!portfolio.journal.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "journal-empty";
    emptyState.textContent = "No public learning notes have been added yet.";
    journalList.append(emptyState);
  }
}

function renderContactLinks() {
  contactLinks.replaceChildren();
  addExternalLink(contactLinks, "GitHub ↗", portfolio.contact.github, ["github.com"]);
  addExternalLink(contactLinks, "LinkedIn ↗", portfolio.contact.linkedin, ["linkedin.com", "www.linkedin.com"]);
}

function addMessage(text, className) {
  const message = document.createElement("div");
  message.className = `message ${className}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function askQuestion(question) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) return;
  addMessage(trimmedQuestion, "user-message");
  addMessage(answerQuestion(trimmedQuestion), "assistant-message");
}

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  askQuestion(chatInput.value);
  chatInput.value = "";
  chatInput.focus();
});

document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", () => askQuestion(button.dataset.question));
});

renderProjects();
renderInterests();
renderJournal();
renderContactLinks();
