const steps = ["Goal", "Lifecycle", "Evidence", "Resources", "Timeline"];
const goals = [
  { id: "problem", title: "Understand a user problem", description: "Explore needs, friction, and behavior to understand what is getting in the way." },
  { id: "validate", title: "Validate a design", description: "Test a prototype or design to see whether it works for the people using it." },
  { id: "usage", title: "Explain product usage or drop-off", description: "Find where people leave a journey and what may be driving the pattern." },
  { id: "compare", title: "Compare a new concept", description: "Learn which direction is clearest and most useful to your users." },
];
const lifecycleOptions = [
  { id: "early", title: "Early discovery", description: "The problem and audience are still taking shape." },
  { id: "new", title: "New product design", description: "A new experience is being defined." },
  { id: "prototype", title: "Prototype", description: "A concept or flow is ready to test." },
  { id: "live", title: "Live product", description: "The experience is in use and behavior data is available." },
  { id: "redesign", title: "Redesign", description: "An existing journey is being changed or improved." },
];
const evidenceOptions = [
  { id: "users", title: "Direct user access", description: "Customers or target users can take part." },
  { id: "analytics", title: "Product analytics", description: "Events, funnels, or cohort data are available." },
  { id: "recordings", title: "Session recordings", description: "Replay or clickstream tools are available." },
  { id: "existing", title: "Existing research", description: "Past studies, journey maps, or product notes." },
  { id: "support", title: "Support or CRM feedback", description: "Tickets, sales notes, or customer requests." },
  { id: "none", title: "Nothing collected yet", description: "The study will start with a small evidence base." },
];
const timelineOptions = [
  { id: "one-week", title: "Within 1 week", description: "A quick diagnostic and a focused recommendation." },
  { id: "two-weeks", title: "Within 2 weeks", description: "Enough time to check signals and synthesize evidence." },
  { id: "four-weeks", title: "3–4 weeks", description: "Room for recruitment, validation, and deeper synthesis." },
  { id: "flexible", title: "Flexible", description: "Optimize for confidence and team availability." },
];

const initialAnswers = {
  projectName: "Onboarding first value",
  primaryQuestion: "Where are new users getting stuck before they reach first value?",
  goal: "problem",
  goalFocus: "New user onboarding and first successful action",
  lifecycle: "live",
  lifecycleContext: "Redesign underway",
  evidence: ["analytics", "existing"],
  eventQuality: "Some events need a QA pass",
  researchFreshness: "Within the last 12 months",
  participantAccess: "none",
  recruitingWindow: "not-now",
  participantsCount: "5–8 participants",
  teamCapacity: "small",
  timeline: "two-weeks",
  timelineFocus: "Find decision-ready patterns",
};

const appState = {
  screen: "selector",
  step: 0,
  answers: structuredClone(initialAnswers),
  hasGenerated: false,
  helpOpen: false,
  profileOpen: false,
  completedTasks: {},
};
const root = document.querySelector("#app");
const toastRegion = document.querySelector("#toast-region");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function goalById(id = appState.answers.goal) {
  return goals.find((goal) => goal.id === id) || goals[0];
}

function selectedEvidence(id) {
  return appState.answers.evidence.includes(id);
}

function canUseParticipants() {
  return appState.answers.participantAccess === "ready" || (
    appState.answers.participantAccess === "recruit" &&
    appState.answers.recruitingWindow === "within" &&
    appState.answers.timeline !== "one-week"
  );
}

function timelineLabel(id = appState.answers.timeline) {
  return ({ "one-week": "1 week", "two-weeks": "2 weeks", "four-weeks": "3–4 weeks", flexible: "Flexible" })[id] || "2 weeks";
}

function lifecycleLabel(id = appState.answers.lifecycle) {
  return lifecycleOptions.find((option) => option.id === id)?.title || "Live product";
}

function methodForAnswers() {
  const answer = appState.answers;
  const analytics = selectedEvidence("analytics");
  const support = selectedEvidence("support");
  const users = canUseParticipants();
  const live = ["live", "redesign"].includes(answer.lifecycle);
  let id = "heuristic";

  if (answer.goal === "validate") {
    id = users ? "usability" : (analytics && live ? "funnel" : "heuristic");
  } else if (answer.goal === "compare") {
    id = users ? "concept" : "heuristic";
  } else if (answer.goal === "usage") {
    id = analytics && live ? "funnel" : (support ? "support" : (users ? "usability" : "heuristic"));
  } else if (users) {
    id = "interviews";
  } else if (analytics && live) {
    id = "funnel";
  } else if (support) {
    id = "support";
  } else if (selectedEvidence("existing")) {
    id = "prior";
  }

  const library = {
    funnel: {
      id, name: "Funnel & cohort analysis", duration: answer.timeline === "one-week" ? "2 focused days" : "3–4 days",
      sample: "Use 2–4 weeks of stable traffic; aim for roughly 200 eligible users per key segment for directional comparisons.",
      summary: "Map the journey step by step, then compare where completion changes across meaningful cohorts.",
      rationale: "The product is live and analytics are available, so behavior can show where the journey loses momentum before you spend time recruiting.",
      limitation: "A funnel shows where people leave, not why. Event gaps, mixed cohorts, and seasonality can look like user friction.",
      actions: ["Confirm event definitions and denominators", "Build the onboarding funnel", "Compare new-user, device, and acquisition cohorts", "Check the largest drop-off against prior evidence"],
    },
    usability: {
      id, name: "Moderated usability testing", duration: answer.timeline === "one-week" ? "3 days" : "4–6 days",
      sample: "5–8 representative participants for each priority segment; treat the pattern as qualitative, not statistically conclusive.",
      summary: "Observe people completing realistic tasks in the current design and ask what they expected at moments of friction.",
      rationale: "Direct user access lets the team see where the design breaks down and hear the expectation behind each behavior.",
      limitation: "Small samples surface usability patterns but cannot estimate population rates or prove that a design change caused an outcome.",
      actions: ["Choose 3–5 representative tasks", "Recruit participants who match the target audience", "Observe without teaching the interface", "Separate observed behavior from interpretation"],
    },
    interviews: {
      id, name: "Semi-structured user interviews", duration: "4–6 days",
      sample: "6–8 people with recent experience of the problem; add a segment only when the decision depends on comparing it.",
      summary: "Explore context, workarounds, and needs with people who recently encountered the problem.",
      rationale: "The goal is to understand a user problem, and participants are available for first-hand evidence.",
      limitation: "People may misremember or rationalize behavior. Pair interview themes with product evidence before prioritizing.",
      actions: ["Recruit recent and relevant participants", "Ask for concrete examples rather than opinions", "Probe workarounds and unmet needs", "Code themes against the research question"],
    },
    concept: {
      id, name: "Comparative concept testing", duration: "4–6 days",
      sample: "5–8 target users for directional comprehension; test concepts in randomized order where practical.",
      summary: "Compare how people understand, value, and navigate each concept using the same task and prompts.",
      rationale: "The team needs to compare concepts and can involve people who match the intended audience.",
      limitation: "Preference is not adoption. A favorite concept can still fail in real use or under delivery constraints.",
      actions: ["Define what each concept is intended to solve", "Use the same task and prompts for every concept", "Rotate concept order", "Compare comprehension, not only preference"],
    },
    heuristic: {
      id, name: "Heuristic review of the key journey", duration: "1–2 days",
      sample: "Review the 3–5 highest-impact screens or steps with one researcher and one product partner.",
      summary: "Inspect the journey for clarity, feedback, error prevention, and consistency, then rank issues by user impact.",
      rationale: "The current resource and evidence mix cannot support first-hand participant research within the selected window.",
      limitation: "This is expert judgment, not user evidence. Validate high-impact fixes with users before treating them as proven.",
      actions: ["Walk the journey from the user's entry point", "Record a screenshot and issue for each friction point", "Rate severity and confidence separately", "Identify what requires user validation"],
    },
    support: {
      id, name: "Support-theme analysis", duration: "2–3 days",
      sample: "Review a recent, consistent ticket window; code reasons and note the total volume behind each theme.",
      summary: "Group support and CRM feedback into recurring reasons users ask for help or abandon a task.",
      rationale: "Support feedback is available and provides a direct signal about user confusion or unmet needs.",
      limitation: "Support cases over-represent people who contact the team. They do not describe silent drop-off by themselves.",
      actions: ["Agree a recent ticket window", "Tag each case by task and root question", "Separate one-off edge cases from repeated patterns", "Compare themes with product behavior"],
    },
    prior: {
      id, name: "Prior-research synthesis", duration: "1–2 days",
      sample: "Use the most recent studies and product evidence that still match today's audience and journey.",
      summary: "Bring existing studies, product notes, and analytics into one evidence map before commissioning new work.",
      rationale: "Existing research is available, so the fastest responsible step is to identify what is already known and what remains uncertain.",
      limitation: "Older findings may no longer reflect the current audience, product, or context. Check dates and assumptions.",
      actions: ["Collect studies and product decisions", "Record audience, date, method, and confidence", "Separate evidence from interpretation", "List unanswered questions"],
    },
  };
  return library[id];
}

function supportingMethods(primary) {
  const candidates = [];
  const answer = appState.answers;
  if (selectedEvidence("support") && primary.id !== "support") candidates.push("support");
  if (selectedEvidence("existing") && primary.id !== "prior") candidates.push("prior");
  if (selectedEvidence("analytics") && primary.id !== "funnel") candidates.push("funnel");
  if (canUseParticipants() && primary.id !== "usability" && primary.id !== "interviews") candidates.push("usability");
  if (!canUseParticipants() && primary.id !== "heuristic") candidates.push("heuristic");
  const unique = [...new Set(candidates)].slice(0, 2);
  return unique.map((id) => methodForId(id, answer));
}

function methodForId(id, answer = appState.answers) {
  const library = {
    funnel: { name: "Funnel & cohort analysis", duration: "2–4 days", sample: "2–4 weeks of stable traffic", summary: "Locate where completion changes across key steps and cohorts.", rationale: "Behavior data can quantify where the journey changes.", limitation: "It cannot explain user intent on its own." },
    usability: { name: "Moderated usability testing", duration: "4–6 days", sample: "5–8 people per priority segment", summary: "Watch target users complete realistic tasks in the current design.", rationale: "First-hand observation can reveal expectation and comprehension gaps.", limitation: "Small samples identify patterns, not population rates." },
    support: { name: "Support-theme analysis", duration: "2–3 days", sample: "A recent, consistent ticket window", summary: "Code support reasons to find repeated friction themes.", rationale: "Customer feedback is already available to the team.", limitation: "Support cases over-represent people who contact the team." },
    heuristic: { name: "Heuristic review", duration: "1–2 days", sample: "3–5 key screens or journey steps", summary: "Inspect the flow for clarity, feedback, errors, and consistency.", rationale: "This gives a quick expert view when participant access is limited.", limitation: "It is expert judgment, not user evidence." },
    prior: { name: "Prior-research synthesis", duration: "1–2 days", sample: "The most recent relevant studies", summary: "Bring existing evidence into one map and identify what remains unknown.", rationale: "Existing findings can prevent repeated research.", limitation: "Check that the audience and product context are still current." },
  };
  return { id, ...library[id], actions: [] };
}

function fitSignals(primary) {
  const evidenceText = appState.answers.evidence.map((id) => evidenceOptions.find((item) => item.id === id)?.title).filter(Boolean).join(", ") || "No evidence yet";
  return [
    { label: "Goal", value: goalById().title },
    { label: "Lifecycle", value: lifecycleLabel() },
    { label: "Evidence", value: evidenceText },
    { label: "Resources", value: canUseParticipants() ? "Participants can take part" : "No participant access in this plan" },
    { label: "Timeline", value: timelineLabel() },
  ];
}

function primaryRationale(primary) {
  const goal = goalById().title.toLowerCase();
  const evidence = appState.answers.evidence.map((id) => evidenceOptions.find((item) => item.id === id)?.title).filter(Boolean).join(" and ") || "no existing evidence";
  return `${primary.rationale} The study is focused on ${goal} in a ${lifecycleLabel().toLowerCase()}, with ${evidence.toLowerCase()} available over ${timelineLabel().toLowerCase()}.`;
}

function htmlForOption(option, { group, selected, multiple = false }) {
  const type = multiple ? "checkbox" : "radio";
  const checked = multiple ? selectedEvidence(option.id) : selected === option.id;
  const field = multiple ? "evidence" : group;
  return `<label class="choice-card ${checked ? "is-selected" : ""}">
    <input type="${type}" name="${escapeHtml(group)}" value="${escapeHtml(option.id)}" data-answer="${field}" ${checked ? "checked" : ""} />
    <span class="choice-copy"><span class="choice-title">${escapeHtml(option.title)}</span><span class="choice-description">${escapeHtml(option.description)}</span></span>
    <span class="choice-control" aria-hidden="true"></span>
  </label>`;
}

function selectField(label, key, options, hint = "") {
  const current = appState.answers[key];
  return `<label class="form-field"><span class="field-label">${escapeHtml(label)}</span>
    <select data-answer="${escapeHtml(key)}">${options.map((option) => `<option value="${escapeHtml(option.value)}" ${current === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select>
    ${hint ? `<span class="field-hint">${escapeHtml(hint)}</span>` : ""}</label>`;
}

function conditionalFollowup() {
  const answer = appState.answers;
  if (appState.step === 0) {
    return `<label class="form-field followup-field"><span class="field-label">Which part of the experience is in focus?</span><input type="text" maxlength="120" value="${escapeHtml(answer.goalFocus)}" data-text-answer="goalFocus" /></label>`;
  }
  if (appState.step === 1) {
    return selectField("What best describes the work underway?", "lifecycleContext", [
      { value: "New journey definition", label: "Defining a new journey" },
      { value: "Prototype ready", label: "A prototype is ready to test" },
      { value: "Recently launched", label: "Recently launched" },
      { value: "Redesign underway", label: "Redesign underway" },
      { value: "Ongoing optimization", label: "Ongoing optimization" },
    ]);
  }
  if (appState.step === 2) {
    const fields = [];
    if (selectedEvidence("analytics")) fields.push(selectField("How reliable are the key events?", "eventQuality", [
      { value: "Events are consistent", label: "Consistent and documented" },
      { value: "Some events need a QA pass", label: "Some events need a QA pass" },
      { value: "Not sure yet", label: "Not sure yet" },
    ]));
    if (selectedEvidence("existing")) fields.push(selectField("How current is the existing research?", "researchFreshness", [
      { value: "Within the last 12 months", label: "Within the last 12 months" },
      { value: "More than 12 months old", label: "More than 12 months old" },
      { value: "Mixed or unknown", label: "Mixed or unknown" },
    ]));
    return fields.length ? `<div class="followup-grid">${fields.join("")}</div>` : `<p class="followup-note">With no existing evidence selected, the first phase will establish a baseline and record assumptions.</p>`;
  }
  if (appState.step === 3) {
    const fields = [selectField("Team capacity", "teamCapacity", [
      { value: "solo", label: "One research owner" },
      { value: "small", label: "Small team · 2–5 people" },
      { value: "dedicated", label: "Dedicated research partner" },
    ])];
    if (answer.participantAccess === "ready") fields.push(selectField("People available", "participantsCount", [
      { value: "5–8 participants", label: "5–8 participants" },
      { value: "9–12 participants", label: "9–12 participants" },
      { value: "Fewer than 5 participants", label: "Fewer than 5 participants" },
    ]));
    if (answer.participantAccess === "recruit") fields.push(selectField("Can recruitment finish in time?", "recruitingWindow", [
      { value: "within", label: "Yes, within this plan" },
      { value: "not-now", label: "Not within this plan" },
      { value: "unsure", label: "Not sure yet" },
    ]));
    return `<div class="followup-grid">${fields.join("")}</div>`;
  }
  return selectField("What should this plan optimize for?", "timelineFocus", [
    { value: "Find decision-ready patterns", label: "Decision-ready patterns" },
    { value: "Protect time for recruiting", label: "Protect time for recruiting" },
    { value: "Start with a rapid diagnostic", label: "A rapid diagnostic first" },
  ]);
}

function renderChoiceGroup() {
  const answer = appState.answers;
  if (appState.step === 0) return goals.map((option) => htmlForOption(option, { group: "goal", selected: answer.goal })).join("");
  if (appState.step === 1) return lifecycleOptions.map((option) => htmlForOption(option, { group: "lifecycle", selected: answer.lifecycle })).join("");
  if (appState.step === 2) return evidenceOptions.map((option) => htmlForOption(option, { group: "evidence", selected: "", multiple: true })).join("");
  if (appState.step === 3) {
    const resources = [
      { id: "ready", title: "Participants are available", description: "The team can invite current or target users now." },
      { id: "recruit", title: "Recruiting is possible", description: "There is a path to recruit within the study window." },
      { id: "none", title: "No direct user access", description: "Use product evidence and expert review for this pass." },
    ];
    return resources.map((option) => htmlForOption(option, { group: "participantAccess", selected: answer.participantAccess })).join("");
  }
  return timelineOptions.map((option) => htmlForOption(option, { group: "timeline", selected: answer.timeline })).join("");
}

function renderStepper() {
  const progress = appState.step === 0 ? 0 : (appState.step / (steps.length - 1)) * 100;
  return `<div class="stepper-wrap" aria-label="Research plan setup">
    <div class="stepper-track"><span style="width:${progress}%"></span></div>
    <ol class="stepper">${steps.map((label, index) => `<li><button type="button" class="step-button ${appState.step === index ? "is-current" : ""} ${index < appState.step ? "is-complete" : ""}" data-step-nav="${index}" aria-current="${appState.step === index ? "step" : "false"}"><span class="step-number">${index + 1}</span><span class="step-name">${label}</span></button></li>`).join("")}</ol>
  </div>`;
}

function stepContent() {
  const copy = [
    ["What do you need to learn?", "Start with your main research goal. This helps us tailor the next steps to your needs.", "Choose one goal"],
    ["Where are you in the product lifecycle?", "The product stage changes which methods are possible and what evidence already exists.", "Choose the current stage"],
    ["What evidence can you access?", "Select every source your team can use during this study.", "Select all that apply"],
    ["What resources can you bring?", "Method fit depends on people, recruiting, and the time your team can realistically give.", "Choose your participant access"],
    ["When does the team need a decision?", "Your timeline shapes the sample, sequence, and depth of the work.", "Choose a workable window"],
  ][appState.step];
  return { title: copy[0], description: copy[1], answerTitle: copy[2] };
}

function renderHeader() {
  return `<header class="topbar"><div class="topbar-inner">
    <button class="brand" type="button" data-action="home" aria-label="Grove home"><span class="brand-name">Grove</span><span class="brand-divider"></span><span class="brand-product">UX Research Planner</span></button>
    <div class="topbar-actions">
      ${appState.hasGenerated ? `<button class="header-link" type="button" data-action="open-plan">${appState.screen === "workspace" ? "Method fit" : "Research workspace"}</button>` : ""}
      <button class="header-link" type="button" data-action="help">Help</button>
      <button class="avatar-button" type="button" data-action="profile" aria-label="Open profile menu" aria-expanded="${appState.profileOpen}">JD</button>
      ${appState.profileOpen ? `<div class="profile-popover"><strong>Jordan Davis</strong><span>Local prototype</span><button type="button" data-action="reset">Reset example study</button></div>` : ""}
    </div>
  </div></header>`;
}

function renderSelector() {
  const content = stepContent();
  const nextLabel = appState.step < 4 ? `Next: ${steps[appState.step + 1]}` : "See recommendations";
  const leftExtra = appState.step === 0 ? `<div class="study-fields">
      <label class="form-field"><span class="field-label">Study name</span><input type="text" maxlength="80" value="${escapeHtml(appState.answers.projectName)}" data-text-answer="projectName" /></label>
      <label class="form-field"><span class="field-label">Primary research question</span><textarea rows="3" maxlength="220" data-text-answer="primaryQuestion">${escapeHtml(appState.answers.primaryQuestion)}</textarea></label>
    </div>` : `<div class="study-context"><span class="context-label">CURRENT STUDY</span><strong>${escapeHtml(appState.answers.projectName)}</strong><span>${escapeHtml(goalById().title)} · ${escapeHtml(lifecycleLabel())}</span></div>`;
  const whyText = [
    "Your goal shapes the methods, participants, and plan we’ll recommend in the next steps.",
    "A method that works for a live product may not fit an early concept or prototype.",
    "The recommendation will only use evidence sources your team can actually reach.",
    "Access and team capacity determine whether user sessions are realistic in this window.",
    "A shorter window narrows the plan; it does not make weak evidence more certain.",
  ][appState.step];
  return `${renderStepper()}<main class="selector-layout">
    <section class="question-column"><img class="botanical-art" src="/assets/grove-botanical.png" alt="" aria-hidden="true" />
      <div class="question-content"><div class="eyebrow">STEP ${appState.step + 1} OF 5 <span>·</span> ${escapeHtml(steps[appState.step].toUpperCase())}</div>
        <h1>${escapeHtml(content.title)}</h1><p class="lead">${escapeHtml(content.description)}</p>
        ${leftExtra}
        <div class="why-block"><span class="why-label">WHY WE ASK</span><p>${escapeHtml(whyText)}</p></div>
      </div>
    </section>
    <section class="answer-column"><div class="answer-heading"><span class="eyebrow">${escapeHtml(content.answerTitle.toUpperCase())}</span><p>${appState.step === 2 ? "Choose what is available now; the plan can flag evidence gaps." : "You can revise any answer before opening the research workspace."}</p></div>
      <div class="choice-list">${renderChoiceGroup()}</div>
      <div class="followup-panel">${conditionalFollowup()}</div>
      <div class="selector-footer"><button type="button" class="back-button" data-action="previous" ${appState.step === 0 ? "disabled" : ""}>Back</button><span class="save-hint">Your answers stay editable</span><button type="button" class="primary-button" data-action="next">${nextLabel}<span aria-hidden="true">→</span></button></div>
    </section>
  </main>`;
}

function renderSummaryChips() {
  const rows = [
    ["Goal", goalById().title],
    ["Stage", lifecycleLabel()],
    ["Evidence", appState.answers.evidence.map((id) => evidenceOptions.find((item) => item.id === id)?.title).filter(Boolean).join(" · ") || "None yet"],
    ["Window", timelineLabel()],
  ];
  return rows.map(([label, value]) => `<div class="summary-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function renderMethodDetails(method) {
  return `<details class="method-details"><summary>See method details</summary><div class="details-grid">
    <div><span class="detail-label">What to do</span><ul>${(method.actions || []).map((action) => `<li>${escapeHtml(action)}</li>`).join("")}</ul></div>
    <div><span class="detail-label">Sample and duration</span><p>${escapeHtml(method.sample)}</p><p>${escapeHtml(method.duration)}</p><span class="detail-label">Limitations</span><p>${escapeHtml(method.limitation)}</p></div>
  </div></details>`;
}

function renderMethodCard(method, isPrimary = false) {
  return `<article class="method-card ${isPrimary ? "primary-method" : "supporting-method"}">
    <div class="method-kicker"><span>${isPrimary ? "PRIMARY METHOD" : "SUPPORTING METHOD"}</span>${isPrimary ? `<span class="fit-pill">${canUseParticipants() || selectedEvidence("analytics") || selectedEvidence("support") ? "Strong fit" : "Best available fit"}</span>` : ""}</div>
    <h3>${escapeHtml(method.name)}</h3><p class="method-summary">${escapeHtml(method.summary)}</p>
    <div class="method-meta"><span><b>Time</b>${escapeHtml(method.duration)}</span><span><b>Sample</b>${escapeHtml(method.sample)}</span></div>
    ${isPrimary ? `<div class="rationale-grid"><div><span class="detail-label">Why this fits</span><p>${escapeHtml(primaryRationale(method))}</p></div><div><span class="detail-label">Limitations</span><p>${escapeHtml(method.limitation)}</p></div></div>` : `<p class="support-rationale"><strong>Role:</strong> ${escapeHtml(method.rationale)}</p>`}
    ${renderMethodDetails(method)}
  </article>`;
}

function renderResults() {
  const primary = methodForAnswers();
  const supporting = supportingMethods(primary);
  const signals = fitSignals(primary);
  return `<main class="results-page page-width">
    <div class="results-topline"><span class="eyebrow">YOUR RESEARCH RECOMMENDATION</span><button class="text-button" type="button" data-action="edit-answers">Edit answers</button></div>
    <div class="results-heading"><div><h1>A focused way forward.</h1><p class="lead">A plan for <strong>${escapeHtml(appState.answers.projectName)}</strong>, built from your five inputs.</p></div><div class="results-window"><span>PLANNED WINDOW</span><strong>${escapeHtml(timelineLabel())}</strong><small>${canUseParticipants() ? "Participant validation included" : "Data-led diagnostic"}</small></div></div>
    <div class="summary-strip">${renderSummaryChips()}</div>
    <div class="recommendation-grid"><section class="primary-column"><div class="section-heading"><div><span class="eyebrow">START HERE</span><h2>Primary method</h2></div><span class="method-count">01</span></div>${renderMethodCard(primary, true)}</section>
      <aside class="reason-column"><div class="reason-panel"><span class="eyebrow">HOW IT WAS CHOSEN</span><h3>Rules matched to your context</h3><p>The recommendation is generated from explicit rules, not a hidden score. Change an answer to see the method and plan update.</p><ul class="fit-list">${signals.map((signal) => `<li><span>${escapeHtml(signal.label)}</span><strong>${escapeHtml(signal.value)}</strong></li>`).join("")}</ul><p class="method-caveat">Methods guide the next best research step. They do not replace product judgment or participant consent.</p></div>
      ${supporting.length ? `<div class="supporting-stack"><div class="section-heading"><div><span class="eyebrow">ADD CONTEXT</span><h2>Supporting methods</h2></div></div>${supporting.map((method) => renderMethodCard(method, false)).join("")}</div>` : ""}</aside>
    </div>
    <section class="results-sample"><div><span class="eyebrow">SAMPLE GUIDANCE</span><h2>Enough evidence for a useful decision</h2></div><p>${escapeHtml(primary.sample)} If the available volume is smaller, keep findings directional and record the uncertainty instead of treating the pattern as conclusive.</p></section>
    <div class="results-actions"><button type="button" class="secondary-button" data-action="copy-summary">Copy recommendation</button><button type="button" class="primary-button" data-action="open-workspace">Open research workspace<span aria-hidden="true">→</span></button></div>
  </main>`;
}

const taskTemplates = {
  prepare: ["Confirm the decision owner and the question this study must answer", "Check event names, denominators, and the eligible user population", "Agree the onboarding entry and first-value completion events"],
  diagnose: ["Build the onboarding funnel from entry to first successful action", "Compare new users by device and acquisition source", "Check the largest drop-off against event quality and prior findings"],
  validate: ["Review the journey with a second researcher or product partner", "Record evidence, interpretations, and unresolved assumptions separately", "Decide whether participant validation is needed before a high-impact change"],
  decide: ["Rank opportunities by user impact, reach, and confidence", "Choose one change and define its success measure", "Share the evidence map, recommendation, and follow-up owner"],
};

function phaseData() {
  const durations = {
    "one-week": [1, 2, 1, 1],
    "two-weeks": [2, 3, 3, 2],
    "four-weeks": [4, 6, 6, 4],
    flexible: [3, 4, 5, 3],
  }[appState.answers.timeline] || [2, 3, 3, 2];
  const validateTitle = canUseParticipants() ? "Validate the explanation with users" : "Triangulate the explanation";
  const validateTasks = canUseParticipants()
    ? ["Run 5–8 sessions using the representative onboarding task", "Probe what people expected at moments of hesitation", "Compare observed behavior with the analytics pattern"]
    : ["Review existing research and support signals for the same journey", "Run a heuristic walkthrough of the highest-drop-off step", "List what still requires direct user validation"];
  const focusTasks = appState.answers.goal === "validate"
    ? ["Agree the prototype fidelity and success criteria", "Build tasks around the intended user outcome", "Record task success, hesitation, and recovery"]
    : taskTemplates.diagnose;
  const taskSets = [taskTemplates.prepare, focusTasks, validateTasks, taskTemplates.decide];
  const names = ["Align & audit", "Locate the friction", validateTitle, "Decide & share"];
  const descriptions = [
    "Set the decision context and make sure the data means what the team thinks it means.",
    appState.answers.goal === "validate" ? "Observe whether the current design supports the intended task." : "Map the journey and identify the step or cohort that changes the outcome.",
    canUseParticipants() ? "Check whether the observed pattern matches what people do and expect." : "Triangulate the signal with available evidence and make the evidence gap visible.",
    "Turn the strongest evidence into a prioritized next step and a measure of success.",
  ];
  let cursor = 1;
  return names.map((name, index) => {
    const start = cursor;
    const end = cursor + durations[index] - 1;
    cursor = end + 1;
    return { id: ["prepare", "diagnose", "validate", "decide"][index], name, duration: durations[index], start, end, description: descriptions[index], tasks: taskSets[index] };
  });
}

function allTaskEntries(phases) {
  return phases.flatMap((phase) => phase.tasks.map((_, index) => `${phase.id}-${index}`)).concat(["deliverable-funnel", "deliverable-evidence", "deliverable-brief", "deliverable-decision"]);
}

function taskCheckbox(id, text) {
  return `<label class="task-row"><input type="checkbox" data-task="${escapeHtml(id)}" ${appState.completedTasks[id] ? "checked" : ""} /><span class="task-check" aria-hidden="true"></span><span>${escapeHtml(text)}</span></label>`;
}

function renderWorkspaceNav() {
  const links = [
    ["overview", "Overview"], ["phases", "Phases & tasks"], ["questions", "Research questions"],
    ["timeline", "Timeline"], ["formulas", "Formulas"], ["decisions", "Decision rules"], ["deliverables", "Deliverables"],
  ];
  return `<nav class="workspace-nav" aria-label="Research workspace sections"><span class="workspace-nav-label">IN THIS PLAN</span>${links.map(([id, label], index) => `<a href="#ws-${id}" class="workspace-link ${index === 0 ? "is-active" : ""}" data-anchor="ws-${id}">${label}</a>`).join("")}<div class="workspace-progress"><span>PLAN CHECKLIST</span><strong data-progress-text></strong><div class="progress-rail"><i data-progress-bar></i></div></div></nav>`;
}

function renderWorkspace() {
  const primary = methodForAnswers();
  const phases = phaseData();
  const total = allTaskEntries(phases).length;
  const done = allTaskEntries(phases).filter((id) => appState.completedTasks[id]).length;
  const progress = Math.round((done / total) * 100);
  const participantQuestions = canUseParticipants();
  const researchQuestions = participantQuestions
    ? ["What were you trying to do when you reached this step?", "What did you expect to happen next?", "What, if anything, made you pause or reconsider?", "How would you decide that you had finished successfully?", "What would you do if this option were not available?"]
    : ["At which step does the largest loss of new users occur?", "Does the pattern change by device, acquisition source, or first session?", "Could event quality or an untracked action explain the apparent exit?", "What existing research or support theme points to the same moment?", "What evidence would change the team's current explanation?"];
  const questionNote = participantQuestions ? "Ask these after the participant completes the task. Avoid teaching the interface or leading toward a preferred answer." : "These are analyst prompts for the data-led pass. If a high-impact design change depends on user intent, add participant sessions before shipping.";
  const participants = canUseParticipants() ? "5–8 people per priority segment" : "No participants in this plan";
  return `<main class="workspace-page page-width">
    <div class="workspace-header"><div><span class="eyebrow">RESEARCH WORKSPACE</span><h1>${escapeHtml(appState.answers.projectName)}</h1><p class="lead">${escapeHtml(appState.answers.primaryQuestion)}</p></div><div class="workspace-header-actions"><button type="button" class="secondary-button" data-action="edit-answers">Update plan</button><button type="button" class="primary-button" data-action="back-results">Method fit</button></div></div>
    <div class="workspace-summary"><div><span>PRIMARY METHOD</span><strong>${escapeHtml(primary.name)}</strong></div><div><span>TIMEBOX</span><strong>${escapeHtml(timelineLabel())}</strong></div><div><span>SAMPLE</span><strong>${escapeHtml(participants)}</strong></div><div><span>CHECKLIST</span><strong data-workspace-progress>${done} of ${total} complete</strong></div></div>
    <div class="workspace-layout">${renderWorkspaceNav()}<div class="workspace-content">
      <section class="workspace-section overview-section" id="ws-overview"><div class="section-top"><div><span class="eyebrow">01 · SCOPE</span><h2>Start with the decision</h2></div><span class="section-step">Overview</span></div>
        <div class="overview-grid"><div><span class="detail-label">Research question</span><p>${escapeHtml(appState.answers.primaryQuestion)}</p><span class="detail-label">Focus</span><p>${escapeHtml(appState.answers.goalFocus)}</p></div><div><span class="detail-label">Inputs used by the recommendation</span><ul class="answer-list">${fitSignals(primary).map((signal) => `<li><span>${escapeHtml(signal.label)}</span><strong>${escapeHtml(signal.value)}</strong></li>`).join("")}</ul></div></div>
        <div class="scope-note"><strong>Evidence boundary</strong><p>${canUseParticipants() ? "Participant validation is included; use the analytics to locate friction and sessions to understand the experience behind it." : "No direct user access is selected. Treat behavior patterns as diagnostic signals, not explanations of user intent. Validate high-impact changes with users when access becomes available."}</p></div>
      </section>
      <section class="workspace-section" id="ws-phases"><div class="section-top"><div><span class="eyebrow">02 · WORK</span><h2>Phases & tasks</h2></div><span class="section-step">${phases.length} phases</span></div><p class="section-intro">A practical sequence sized to ${escapeHtml(timelineLabel().toLowerCase())}. Check off work as it is completed.</p>
        <div class="phase-list">${phases.map((phase, index) => `<article class="phase-card"><div class="phase-number">0${index + 1}</div><div class="phase-body"><div class="phase-heading"><div><h3>${escapeHtml(phase.name)}</h3><p>${escapeHtml(phase.description)}</p></div><span class="phase-time">Day ${phase.start}–${phase.end} · ${phase.duration} ${phase.duration === 1 ? "day" : "days"}</span></div><div class="task-list">${phase.tasks.map((task, taskIndex) => taskCheckbox(`${phase.id}-${taskIndex}`, task)).join("")}</div></div></article>`).join("")}</div>
      </section>
      <section class="workspace-section" id="ws-questions"><div class="section-top"><div><span class="eyebrow">03 · QUESTIONS</span><h2>Questions to work through</h2></div></div><p class="section-intro">${escapeHtml(questionNote)}</p><ol class="question-list">${researchQuestions.map((question, index) => `<li><span class="question-index">0${index + 1}</span><span>${escapeHtml(question)}</span></li>`).join("")}</ol><details class="method-details"><summary>Optional participant guide</summary><div class="participant-guide"><p>If access becomes available, use the same task with 5–8 representative people and ask:</p><ul><li>“What did you expect to happen here?”</li><li>“What would you try next?”</li><li>“What feels unclear or surprising?”</li></ul></div></details></section>
      <section class="workspace-section" id="ws-timeline"><div class="section-top"><div><span class="eyebrow">04 · SEQUENCE</span><h2>Working timeline</h2></div><span class="section-step">${escapeHtml(timelineLabel())}</span></div><div class="timeline-table">${phases.map((phase, index) => `<div class="timeline-row"><span class="timeline-day">DAY ${phase.start}–${phase.end}</span><div class="timeline-track"><i style="width:${Math.max(15, Math.round((phase.duration / phases.reduce((sum, item) => sum + item.duration, 0)) * 100))}%"></i></div><strong>${escapeHtml(phase.name)}</strong><span>${phase.duration} ${phase.duration === 1 ? "day" : "days"}</span></div>`).join("")}</div><p class="field-hint">Relative working days; schedule around product release, data refresh, and participant availability.</p></section>
      <section class="workspace-section" id="ws-formulas"><div class="section-top"><div><span class="eyebrow">05 · ANALYSIS</span><h2>Useful formulas</h2></div></div><div class="formula-list"><article class="formula-row"><div><h3>Step drop-off</h3><p>Share of eligible users who do not complete the next step.</p></div><code>(entrants − next-step completers) ÷ entrants × 100</code></article><article class="formula-row"><div><h3>Completion rate</h3><p>Use a consistent population and time window when comparing cohorts.</p></div><code>completers ÷ eligible starters × 100</code></article><article class="formula-row"><div><h3>Segment gap</h3><p>Compare in percentage points, not only relative change.</p></div><code>segment completion − overall completion</code></article></div><p class="caution-note">Check denominators, event coverage, and the date window before interpreting a change. A formula cannot repair inconsistent instrumentation.</p></section>
      <section class="workspace-section" id="ws-decisions"><div class="section-top"><div><span class="eyebrow">06 · DECIDE</span><h2>Decision rules</h2></div></div><div class="rule-list"><article><span class="rule-number">01</span><p>Investigate steps with <strong>more than 25% drop-off</strong> or a gap of <strong>10+ percentage points</strong> from the comparable cohort. First confirm tracking quality.</p></article><article><span class="rule-number">02</span><p>Raise priority when a critical task failure appears in <strong>three or more sessions</strong> or the same issue appears in <strong>two independent evidence sources</strong>.</p></article><article><span class="rule-number">03</span><p>Separate <strong>observed behavior</strong>, <strong>user explanation</strong>, and <strong>team interpretation</strong> in the evidence log.</p></article><article><span class="rule-number">04</span><p>Use qualitative findings to choose what to improve. Use a controlled experiment or comparable before/after window to estimate whether the change caused a lift.</p></article></div></section>
      <section class="workspace-section deliverables-section" id="ws-deliverables"><div class="section-top"><div><span class="eyebrow">07 · OUTPUTS</span><h2>Deliverables</h2></div></div><div class="deliverable-list">${taskCheckbox("deliverable-funnel", "Annotated onboarding funnel with event definitions and cohort cuts")}${taskCheckbox("deliverable-evidence", "Evidence map with source, confidence, and open questions")}${taskCheckbox("deliverable-brief", "Prioritized opportunity brief with expected user impact")}${taskCheckbox("deliverable-decision", "Decision record with owner, success measure, and validation plan")}</div></section>
    </div></div>
  </main>`;
}

function renderHelp() {
  if (!appState.helpOpen) return "";
  return `<div class="modal-backdrop" data-modal-backdrop><section class="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button class="modal-close" type="button" data-action="close-help" aria-label="Close help">Close</button><span class="eyebrow">A NOTE ON THE PLANNER</span><h2 id="help-title">Recommendations you can inspect.</h2><p>The selector uses explicit, deterministic rules to match your goal and constraints to research methods. It does not call an AI service or claim statistical confidence.</p><p>Change evidence, access, or timeline answers to see the method, sample guidance, phases, and decision rules update. The plan stays in this browser session.</p><button class="primary-button" type="button" data-action="close-help">Back to the planner</button></section></div>`;
}

function showToast(message) {
  toastRegion.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toastRegion.innerHTML = ""; }, 2600);
}

function updateProgressUI() {
  const phases = phaseData();
  const all = allTaskEntries(phases);
  const done = all.filter((id) => appState.completedTasks[id]).length;
  const percent = all.length ? Math.round((done / all.length) * 100) : 0;
  root.querySelectorAll("[data-progress-text]").forEach((node) => { node.textContent = `${done} of ${all.length} complete`; });
  root.querySelectorAll("[data-progress-bar]").forEach((node) => { node.style.width = `${percent}%`; });
  root.querySelectorAll("[data-workspace-progress]").forEach((node) => { node.textContent = `${done} of ${all.length} complete`; });
}

function setScreen(screen) {
  appState.screen = screen;
  appState.helpOpen = false;
  appState.profileOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function nextStep() {
  if (appState.step < 4) {
    appState.step += 1;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else {
    appState.hasGenerated = true;
    setScreen("results");
  }
}

function handleAction(action) {
  if (action === "home") {
    appState.step = 0;
    setScreen("selector");
  } else if (action === "next") {
    nextStep();
  } else if (action === "previous") {
    if (appState.step > 0) appState.step -= 1;
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "edit-answers") {
    appState.step = 0;
    setScreen("selector");
  } else if (action === "open-workspace") {
    appState.hasGenerated = true;
    setScreen("workspace");
  } else if (action === "back-results") {
    setScreen("results");
  } else if (action === "open-plan") {
    setScreen(appState.screen === "workspace" ? "results" : "workspace");
  } else if (action === "help") {
    appState.helpOpen = true;
    appState.profileOpen = false;
    render();
  } else if (action === "close-help") {
    appState.helpOpen = false;
    render();
  } else if (action === "profile") {
    appState.profileOpen = !appState.profileOpen;
    render();
  } else if (action === "reset") {
    appState.answers = structuredClone(initialAnswers);
    appState.completedTasks = {};
    appState.hasGenerated = false;
    appState.step = 0;
    appState.profileOpen = false;
    setScreen("selector");
    showToast("Example study reset");
  } else if (action === "copy-summary") {
    const recommendation = methodForAnswers();
    const text = `${appState.answers.projectName}\n${appState.answers.primaryQuestion}\nRecommended: ${recommendation.name}\nWhy: ${primaryRationale(recommendation)}\nLimitations: ${recommendation.limitation}`;
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => showToast("Recommendation copied")).catch(() => showToast("Copy is unavailable in this browser"));
    else showToast("Copy is unavailable in this browser");
  }
}

root.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  if (actionTarget) {
    event.preventDefault();
    handleAction(actionTarget.dataset.action);
    return;
  }
  const stepTarget = event.target.closest("[data-step-nav]");
  if (stepTarget) {
    appState.step = Number(stepTarget.dataset.stepNav);
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  const anchor = event.target.closest("[data-anchor]");
  if (anchor) {
    event.preventDefault();
    root.querySelectorAll(".workspace-link").forEach((link) => link.classList.toggle("is-active", link === anchor));
    document.getElementById(anchor.dataset.anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (event.target.matches("[data-modal-backdrop]")) {
    appState.helpOpen = false;
    render();
  }
});

root.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-task]")) {
    appState.completedTasks[target.dataset.task] = target.checked;
    render(true);
    return;
  }
  if (!target.matches("[data-answer]")) return;
  const key = target.dataset.answer;
  if (key === "evidence") {
    const values = new Set(appState.answers.evidence);
    if (target.value === "none" && target.checked) {
      values.clear();
      values.add("none");
    } else {
      values.delete("none");
      if (target.checked) values.add(target.value);
      else values.delete(target.value);
    }
    appState.answers.evidence = [...values];
  } else {
    appState.answers[key] = target.value;
  }
  render(true);
});

root.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-text-answer]")) appState.answers[target.dataset.textAnswer] = target.value;
});

root.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && appState.helpOpen) {
    appState.helpOpen = false;
    render();
  }
});

function render(preserveScroll = false) {
  const scrollTop = window.scrollY;
  const body = appState.screen === "selector" ? renderSelector() : (appState.screen === "results" ? renderResults() : renderWorkspace());
  root.innerHTML = `${renderHeader()}${body}${renderHelp()}`;
  if (appState.screen === "workspace") updateProgressUI();
  if (preserveScroll) window.scrollTo({ top: scrollTop, behavior: "instant" });
}

render();
