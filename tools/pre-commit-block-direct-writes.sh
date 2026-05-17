#!/usr/bin/env bash
# Reject commits that write to atomics/ or rigs/ unless the commit message
# contains the literal token: [PROMOTE]
#
# Install:
#   ln -sf ../../tools/pre-commit-block-direct-writes.sh .git/hooks/pre-commit
#
# Rationale: the aitm-kit-ttp-collector skill produces draft atomics under
# intel/kits/<kit-slug>/. Promotion into atomics/ and rigs/ is a human step
# (regen UUIDs, strip _citations, implement wrap-tool executor, schema
# validate). This hook is the structural forcing function -- prose rules
# drift, git hooks don't.

if git diff --cached --name-only | grep -qE '^(atomics|rigs)/'; then
    msg_file=".git/COMMIT_EDITMSG"
    if [ -f "$msg_file" ] && grep -q '\[PROMOTE\]' "$msg_file"; then
        exit 0
    fi
    if git log -1 --pretty=%B 2>/dev/null | grep -q '\[PROMOTE\]'; then
        # Amending an existing promotion commit is fine.
        exit 0
    fi
    echo "ERROR: changes under atomics/ or rigs/ require [PROMOTE] in the commit message." >&2
    echo "       Drafts belong in intel/kits/<kit-slug>/. See" >&2
    echo "       .claude/skills/aitm-kit-ttp-collector/SKILL.md for the promotion workflow." >&2
    exit 1
fi
