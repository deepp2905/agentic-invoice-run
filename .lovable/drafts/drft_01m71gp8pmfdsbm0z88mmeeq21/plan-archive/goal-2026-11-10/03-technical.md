## Technical details
- Extend the pure reducer with `toggleRule` and a log entry shape carrying `runId`, `ruleId`, `before`/`after`; seed history in mock data, not the reducer.
- Add a pure `testRuleAgainstRuns(rule, runs)` helper over the mock-runs catalog; reuse the existing rule panel component on Rules.
- Track `lastSeenLogId` in provider state for the sidebar badge.
- Add tests: rule test results per run, toggle + undo, filters, seeded history not undoable.
- No data saved between reloads, matching the current prototype.
