// The procedure a PR reviewer follows, as text. It is given to the engine when
// a run starts, retained under its identity, bound into the PR review packet,
// and handed to the PR reviewer as an input. A review therefore counts for one
// exact procedure.
//
// This is the place a team's own PR-review checklist goes: start a run with
// another procedure text and the run records and uses that one. A procedure
// asks questions and sets style. It cannot change what the engine owns: the
// inputs, the record format, the mandatory coverage items, what a verdict
// means, or what a verdict allows. Nothing here is specific to one team.

export const DEFAULT_PR_REVIEW_PROCEDURE = `# PR review procedure: default, version 1

Report on each item below under \`coverage\`, using the item name exactly as written.

- intent-fidelity: Do the title and summary say what the request and the approved specification ask for, without adding or dropping a requirement?
- measured-change-fidelity: Does what you say changed match the paths the packet measured and what those files contain? Read the changed files.
- verification-claims: Does every statement about testing stay inside what the retained execution records show? Say what they leave untested.
- technical-review-disclosure: Are the code review's findings, limitations, and unchecked coverage represented honestly, and not presented as more than they are?
- material-risks: Are operational risks, exclusions, and missing verification that a human reviewer needs to know stated?
- title-and-scope: Is the title accurate and specific, and is the change inside the approved scope?
- submission-readiness: Would submitting this change with this description mislead a reviewer or be premature?

A team may add items after these. Report each added item under \`coverage\` by its name.
`;
