#!/bin/bash

git checkout main
git pull
docker rm -f donbot-c
docker rmi donbot-i
docker build -t donbot-i .
docker run -d --name donbot-c --restart=unless-stopped donbot-i