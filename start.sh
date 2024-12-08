#!/bin/bash

git checkout feat/strategy-variable-sl-tp
git pull
sudo docker rm -f donbot-c
sudo docker rmi donbot-i
sudo docker build -t donbot-i .
sudo docker run -d --name donbot-c --restart=unless-stopped donbot-i
clear