# Adopting this on a team

This stack is meant to drop into any repository, on any stack, for any team. That goal only holds if
somebody has said which parts transfer and which parts are this pipeline's own choices. This file
says it.

It does not describe how to install anything. [`estate-layout.md`](estate-layout.md) covers where
files go, [`instruction-precedence.md`](instruction-precedence.md) covers which instruction tier
wins, and [`estate-instructions.template.md`](estate-instructions.template.md) is the template the
installer writes. Read those for mechanics. Read this for what to keep and what to change.

## What transfers, and what a team owns

The goal is consistent decisions and consistent evidence across teams, with execution that fits the
team. Seven phases, six agents, the artifact filenames, the evidence ladder's four rungs, and the
budget numbers are this pipeline's answers, not the part worth copying literally.

| Common practice, worth keeping | Team owned, expected to differ |
|---|---|
| An explicit scope, its exclusions, and a named owner for each decision | The tracker the work comes from, its ticket shape, and its terminology |
| Criteria linked to a source, with assumptions separated from facts | The product specifications, architecture records and service contracts that are the source |
| The least capability that does the job, and an external write authorised for its actual effect | The tools, the runner, the credentials, and who may approve a write |
| Evidence that observes the required outcome rather than a proxy for it | The test frameworks, and which proof routes exist at all on this stack |
| Honest recovery: what is known, what remains, and what was inferred rather than measured | The host, its session storage, and where artifacts live |
| A change to the pipeline that is reviewed and versioned before it is trusted | The team's own release and adoption process |

The left column is why this stack exists. The right column is where a team that copies this
pipeline's answers instead of its reasoning gets a worse result than writing its own.

## The team setup record

Before the first real run, write these down somewhere the team can find. It is a checklist, not a
format, and nothing here reads it. A machine readable profile would be a second source of truth for
facts that already live in the team's own configuration.

- **Authority and domain entry points.** Where the product decisions and the architecture of record
  actually live, so the planner is pointed at evidence instead of inferring it.
- **Allowed repositories and tools.** Which repositories a run may write to, and which tools exist
  on this host. A capability this stack names and the host does not have is a gap to record, not a
  thing to work around.
- **Proof routes and their prerequisites.** For each kind of criterion the team meets repeatedly:
  the existing test, command or inspection that observes it, what has to be running first, and what
  the resulting evidence still does not establish.
- **Approval owners and effect boundaries.** Who authorises a push, a pull request, or any write
  that leaves the working tree. This stack merges nothing and asks for external writes one at a
  time; the team decides who answers.
- **Private evidence policy.** Run artifacts carry ticket text, paths and terminal output. Where
  they may be kept, for how long, and what may never be committed.
- **Adopted version, and every deviation.** The rstack version in use, and each rule the team
  changed, with the reason. A deviation nobody wrote down becomes a defect report later.

## Proportionate use

Not every piece of work wants all seven phases. What follows is about choosing the right shape of work
for the task, and it is not permission to shorten a run that has already started.

| The work | What this stack should give it |
|---|---|
| Investigation, an incident, a design question, or a code read | Scope, cited evidence, stated uncertainty, and a clear handoff. No invented red and green cycles, and no acceptance matrix, for an assignment that changes nothing. |
| A documentation only change | Verify the documentation outcome and that its links resolve. Do not manufacture executable tests so an artifact has rows in it. |
| A small behaviour change or a bug fix | Concise criteria, evidence that observes the behaviour, a bounded diff, and an independent read. Small does not excuse weak evidence, and a fourteen line diff in a shared fixture has invisible blast radius. |
| A change crossing components or repositories | The interface, the compatibility assumption, who owns each side, the order if the order matters, and evidence on both sides of the boundary. |
| A release, a merge, a deployment, or a production operation | Use the team's existing authorised procedure. This stack's approval phase prepares a commit and asks; it does not implement merge or deploy, and it should not be extended to. |

**This table does not license a live run to skip a phase.** Phase 5 is unconditional, and
[`risk-tiers.md`](risk-tiers.md) argues why at length: the tier is a prediction made at phase 1
before the diff exists. A tier sets depth. It has never set which phases run, and the one release
where it did was reversed.

## What to expect on a new stack

The gate's checks are stack aware in one direction only: they can tell that evidence is absent, and
they cannot always tell why. Runner output that names modules rather than tests, a language whose
runner prints function names rather than filenames, and a fixture that is never named however well
the run went all read as absent evidence. Each of those is a caveat in the gate's own output rather
than a failure, and the first real run on a new stack is where you find out which apply.
