#!/bin/bash
export $(grep -v '^#' /opt/docsclient/.env | xargs)
export NODE_TLS_REJECT_UNAUTHORIZED=0
cd /opt/docsclient
node dist/main.js
