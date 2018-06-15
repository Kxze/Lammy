#!/usr/bin/env bash
curl --user ${CIRCLE_TOKEN}: \
    --request POST \
    --form revision=05064fe5b6e6a1724c4ff38ecb0ecaa04a1f5611\
    --form config=@config.yml \
    --form notify=false \
        https://circleci.com/api/v1.1/project/github/Kxze/Lammy/tree/master