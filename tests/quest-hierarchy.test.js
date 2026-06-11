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

console.log('Quest hierarchy tests OK');
