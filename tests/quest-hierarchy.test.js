const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'index.html');
const source = fs.readFileSync(indexPath, 'utf8');
const helpersStart = source.indexOf('var QUEST_TREE_MAX_DEPTH = 12;');
const helpersEnd = source.indexOf('\nfunction renderQuests()', helpersStart);

if (helpersStart < 0 || helpersEnd < 0) {
  throw new Error('Quest hierarchy helpers not found in index.html');
}

global.S = { orte: [] };
global.esc = function(value) { return String(value); };
global.cleanUrl = function(value) { return value; };
eval(source.slice(helpersStart, helpersEnd));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function quest(id, parentId, done) {
  return {
    id: id,
    parentId: parentId || null,
    done: !!done,
    name: id,
    typ: 'Aufgabe',
    links: []
  };
}

function renderedQuest(html, id) {
  return html.indexOf('>' + id + '</div>') !== -1;
}

(function countsDescendantsDefensivelyWithoutMutatingQuests() {
  const quests = [
    quest('root'),
    quest('child-done', 'root', true),
    quest('child-open', 'root', false),
    quest('grandchild-done', 'child-open', true),
    quest('unrelated', null, true)
  ];
  const snapshot = JSON.stringify(quests);
  const progress = getQuestDescendantProgress('root', quests.concat([null, {}]));

  assert(progress.done === 2, 'Direct and indirect completed descendants were not counted');
  assert(progress.total === 3, 'Direct and indirect descendants were not counted');
  assert(JSON.stringify(quests) === snapshot, 'Descendant progress mutated quest data');
  assert(getQuestDescendantProgress('', quests).total === 0, 'Missing main quest IDs were not handled defensively');
  assert(getQuestDescendantProgress('root', null).total === 0, 'Invalid quest collections were not handled defensively');
  quests.forEach(function(q) {
    assert(!Object.prototype.hasOwnProperty.call(q, 'progress'), 'Progress was stored on a quest');
    assert(!Object.prototype.hasOwnProperty.call(q, 'xp'), 'XP was stored on a quest');
    assert(!Object.prototype.hasOwnProperty.call(q, 'miles'), 'Miles were stored on a quest');
  });
})();

(function stopsDescendantProgressAtCyclesAndTheFixedDepthLimit() {
  const cycleRoot = quest('cycle-root');
  const cycleChild = quest('cycle-child', 'cycle-root', true);
  cycleRoot.parentId = 'cycle-child';
  const cycleProgress = getQuestDescendantProgress('cycle-root', [cycleRoot, cycleChild]);
  assert(cycleProgress.done === 1 && cycleProgress.total === 1, 'Cycle protection counted the main quest or looped');

  const deepQuests = [quest('deep-root')];
  for (let i = 1; i <= QUEST_PROGRESS_MAX_DEPTH + 2; i++) {
    deepQuests.push(quest('progress-depth-' + i, i === 1 ? 'deep-root' : 'progress-depth-' + (i - 1), true));
  }
  const deepProgress = getQuestDescendantProgress('deep-root', deepQuests);
  assert(deepProgress.total === QUEST_PROGRESS_MAX_DEPTH, 'Descendant progress ignored its fixed depth limit');
  assert(deepProgress.done === QUEST_PROGRESS_MAX_DEPTH, 'Completed count exceeded the fixed depth limit');
})();

(function rendersDescendantProgressOnlyOnMainCardsWithChildren() {
  const root = quest('progress-root');
  const childDone = quest('progress-child-done', 'progress-root', true);
  const childOpen = quest('progress-child-open', 'progress-root', false);
  const leafRoot = quest('leaf-root');
  const html = renderQuestHierarchy([root, childDone, childOpen, leafRoot], [root, childDone, childOpen, leafRoot]);
  const progressRows = html.match(/class="quest-descendant-progress"/g) || [];

  assert(progressRows.length === 1, 'Progress was rendered for a main quest without descendants or for a subquest');
  assert(html.indexOf('1 / 2 erledigt · 50%') !== -1, 'Progress row was not derived from done / total');
  assert(html.indexOf('aria-valuenow="50"') !== -1, 'Progress bar percentage was not derived from done / total');
  assert(html.indexOf('style="width:50%;"') !== -1, 'Progress fill percentage was not derived from done / total');
})();

(function keepsInputOrderAndHierarchy() {
  const quests = [quest('child', 'root'), quest('root'), quest('sibling')];
  const snapshot = JSON.stringify(quests);
  const html = renderQuestHierarchy(quests, quests);

  assert(JSON.stringify(quests) === snapshot, 'Quest input was mutated or reordered');
  assert(html.indexOf('>root</div>') < html.indexOf('>child</div>'), 'Child was not rendered below its parent');
})();

(function keepsDeepDescendantsUnderTheirExistingParentChain() {
  const quests = [];
  for (let i = 0; i < QUEST_TREE_MAX_DEPTH + 50; i++) {
    quests.push(quest('deep-' + i, i ? 'deep-' + (i - 1) : null));
  }

  const html = renderQuestHierarchy(quests, quests);
  quests.forEach(function(q) {
    assert(renderedQuest(html, q.id), q.id + ' disappeared below the visual depth limit');
  });
  assert(html.indexOf('Tiefe begrenzt') !== -1, 'Depth-limited descendants lack their capped context');
  assert(html.indexOf('Verwaiste Quest') === -1, 'Valid deep descendants were incorrectly rendered as orphans');
  assert((html.match(/exped-stages-capped/g) || []).length === 1, 'Capped descendants created additional visual nesting');
})();

(function rendersFilteredChildrenStandaloneWithoutCallingThemOrphans() {
  const parent = quest('hidden-parent', null, true);
  const child = quest('visible-child', 'hidden-parent', false);
  const html = renderQuestHierarchy([child], [parent, child]);

  assert(renderedQuest(html, child.id), 'Filtered child was not rendered');
  assert(html.indexOf('Gefilterter Treffer') !== -1, 'Filtered child lacks standalone context');
  assert(html.indexOf('Verwaiste Quest') === -1, 'Filtered child was incorrectly marked as orphan');
})();

(function stillStopsCyclesWithVisited() {
  const cycleA = quest('cycle-a', 'cycle-b');
  const cycleB = quest('cycle-b', 'cycle-a');
  const html = renderQuestHierarchy([cycleA, cycleB], [cycleA, cycleB]);

  assert(renderedQuest(html, cycleA.id), 'First cyclic quest was not surfaced');
  assert(renderedQuest(html, cycleB.id), 'Second cyclic quest was not surfaced');
  assert((html.match(/>cycle-a<\/div>/g) || []).length === 1, 'First cyclic quest rendered more than once');
  assert((html.match(/>cycle-b<\/div>/g) || []).length === 1, 'Second cyclic quest rendered more than once');
})();

(function rendersQuestCardContentAndActionsFromQuestData() {
  global.esc = function(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  global.cleanUrl = function(value) { return 'clean:' + value; };

  const openQuest = quest('quest-open');
  openQuest.status = 'Erledigt';
  openQuest.desc = '<Notiz & Plan>';
  openQuest.links = [{ url: 'https://example.com/?a=1', label: '<Quelle>' }];
  const openHtml = renderQuestEntry(openQuest, 0, '', false);

  assert(openHtml.indexOf('quest-status-open">Offen</span>') !== -1, 'Open status pill was not derived from q.done');
  assert(openHtml.indexOf('quest-status-done">Erledigt</span>') === -1, 'Unrelated status data changed the status pill');
  assert(openHtml.indexOf('<span class="quest-note-label">Expeditionsnotiz</span>&lt;Notiz &amp; Plan&gt;') !== -1, 'Quest description was not rendered as an escaped expedition note');
  assert(openHtml.indexOf('href="clean:https://example.com/?a=1"') !== -1, 'Quest resource URL did not use cleanUrl');
  assert(openHtml.indexOf('↗ &lt;Quelle&gt;</a>') !== -1, 'Quest resource label was not escaped');
  assert(openHtml.indexOf("onclick=\"toggleQuest('quest-open')\"") !== -1, 'Quest toggle handler changed');
  assert(openHtml.indexOf("onclick=\"openQuestModal('quest-open')\"") !== -1, 'Visible edit action is missing or disconnected');
  assert(openHtml.indexOf('>Bearbeiten</span>') !== -1, 'Edit action lacks a visible label');
  assert(openHtml.indexOf("onclick=\"delQuest('quest-open')\"") !== -1, 'Quest delete handler changed');

  const doneQuest = quest('quest-done', null, true);
  const doneHtml = renderQuestEntry(doneQuest, 0, '', false);
  assert(doneHtml.indexOf('class="exped-card is-done"') !== -1, 'Completed quest lacks its calm card treatment hook');
  assert(doneHtml.indexOf('quest-status-done">Erledigt</span>') !== -1, 'Completed status pill was not derived from q.done');
})();

(function keepsQuestCheckboxTouchTargetTiedToTheSharedMinimum() {
  assert(source.indexOf('.quest-check { width:var(--touch-min); height:var(--touch-min);') !== -1, 'Quest checkbox no longer uses the shared touch-target minimum');
})();

(function rendersDistinctQuestEmptyStatesWithoutMutatingData() {
  const renderStart = source.indexOf('function renderQuests()');
  const renderEnd = source.indexOf('\nfunction setQuestFilter(', renderStart);
  if (renderStart < 0 || renderEnd < 0) throw new Error('renderQuests not found in index.html');

  eval(source.slice(renderStart, renderEnd));
  const questsView = { innerHTML: '' };
  global.document = {
    getElementById: function(id) {
      assert(id === 'quests-view', 'renderQuests requested an unexpected element');
      return questsView;
    }
  };
  global.esc = function(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  const emptyQuests = [];
  global.S = { quests: emptyQuests, orte: [] };
  questViewFilter = 'erledigt';
  renderQuests();

  assert(S.quests === emptyQuests && S.quests.length === 0, 'The first-expedition empty state changed quest data');
  assert(questsView.innerHTML.indexOf('Noch keine Expeditionen.') !== -1, 'The first-expedition microcopy is missing');
  assert(questsView.innerHTML.indexOf('>Erste Expedition anlegen</button>') !== -1, 'The first-expedition action is missing');
  assert(questsView.innerHTML.indexOf('onclick="openNewExpeditionFromQuestOverview()"') !== -1, 'The first-expedition action does not use the quest-overview creation flow');
  assert(questsView.innerHTML.indexOf('onclick="openNewExpeditionFromQuestOverview()">+ Neue Expedition</button>') !== -1, 'The quest-overview header action does not use the shared creation flow');
  assert(questsView.innerHTML.indexOf('onclick="openQuestModal()"') === -1, 'The first-expedition action still opens the modal directly');
  assert(questsView.innerHTML.indexOf('Alle Expeditionen anzeigen') === -1, 'The data-empty state was confused with the filter-empty state');
  assert(questViewFilter === 'erledigt', 'Rendering the data-empty state changed the transient filter');

  const openQuest = quest('only-open');
  global.S = { quests: [openQuest], orte: [] };
  questsView.innerHTML = '';
  questViewFilter = 'erledigt';
  renderQuests();

  assert(questsView.innerHTML.indexOf('Im Filter „Erledigt“ gibt es keine Expeditionen.') !== -1, 'The active-filter empty-state message is missing');
  assert(questsView.innerHTML.indexOf('onclick="setQuestFilter(\'alle\')"') !== -1, 'The active-filter empty state cannot reset to all quests');
  assert(questsView.innerHTML.indexOf('Erste Expedition anlegen') === -1, 'The filter-empty state incorrectly offers first-expedition creation');
  assert(S.quests.length === 1 && S.quests[0] === openQuest, 'The filter-empty state changed quest data');
  assert(questViewFilter === 'erledigt', 'Rendering the filter-empty state reset or persisted the filter automatically');
})();

(function resetsTheTransientFilterBeforeOpeningANewExpedition() {
  const helperStart = source.indexOf('function openNewExpeditionFromQuestOverview()');
  const helperEnd = source.indexOf('\nfunction switchTabByName(', helperStart);
  if (helperStart < 0 || helperEnd < 0) throw new Error('Quest-overview creation helper not found in index.html');

  const calls = [];
  global.setQuestFilter = function(filter) {
    calls.push('filter:' + filter);
    questViewFilter = filter;
  };
  global.openQuestModal = function() {
    calls.push('modal');
  };

  eval(source.slice(helperStart, helperEnd));

  questViewFilter = 'erledigt';
  openNewExpeditionFromQuestOverview();
  assert(questViewFilter === 'alle', 'The quest-overview creation flow did not reset the completed filter to all');
  assert(calls.join(',') === 'filter:alle,modal', 'The completed filter was not reset before opening the modal');

  calls.length = 0;
  questViewFilter = 'offen';
  openNewExpeditionFromQuestOverview();
  assert(questViewFilter === 'offen', 'The quest-overview creation flow reset the open filter');
  assert(calls.join(',') === 'modal', 'The open filter triggered an unnecessary filter reset');

  calls.length = 0;
  questViewFilter = 'alle';
  openNewExpeditionFromQuestOverview();
  assert(questViewFilter === 'alle', 'The quest-overview creation flow changed the all filter');
  assert(calls.join(',') === 'modal', 'The all filter triggered an unnecessary filter reset');
})();

console.log('Quest hierarchy tests OK');
