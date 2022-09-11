#!/bin/bash

cd "$(dirname "$0")"

cd builder

npm run build 
cd .. 
git add -A 
git commit -m "build" 
git push
