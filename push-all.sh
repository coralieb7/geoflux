#!/usr/bin/env bash
set -e

BRANCH=$(git symbolic-ref --short HEAD)

echo "Pushing '$BRANCH' to origin..."
git push origin "$BRANCH"

echo "Pushing '$BRANCH' to mirror..."
git push mirror "$BRANCH"

echo "Done — pushed to both remotes."
